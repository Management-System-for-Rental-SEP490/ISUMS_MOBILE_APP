import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, ListRenderItemInfo, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList, TenantInvoiceFromApi } from "../../../../shared/types";
import type { HouseFromApi } from "../../../../shared/types/api";
import {
  useTenantHouses,
  useTenantInvoices,
  useUserProfile,
  useRefreshControlGate,
} from "../../../../shared/hooks";
import {
  PullToRefreshControl,
  RefreshLogoInline,
  RefreshLogoOverlay,
} from "@shared/components/RefreshLogoOverlay";
import {
  filterPayableInvoices,
  formatTenantInvoiceAmount,
  formatTenantInvoiceCardTitle,
  isTenantInvoiceIssueType,
  isTenantInvoicePayable,
  isTenantRepairInvoiceFlow,
  sortTenantInvoicesForDisplay,
  sortTenantIssueInvoicesByTicketActivityDesc,
} from "../../../../shared/utils/tenantInvoice";
import Icons from "../../../../shared/theme/icon";
import { BRAND_DANGER, brandPrimary, brandSecondary, neutral } from "../../../../shared/theme/color";
import {
  formatTenantIssueDateTime,
  getTotalPages,
  slicePage,
} from "../../../../shared/utils";
import { formatApiErrorForTenantAlert } from "../../../../shared/utils/apiErrorMessage";
import { tenantInvoiceStyles as styles } from "./tenantInvoiceStyles";
import { PaginationBar } from "../../../../shared/components/PaginationBar";
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import { createVnpayPaymentLink } from "../../../../shared/services/tenantPaymentApi";
import { useAuthStore } from "../../../../store/useAuthStore";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";

type NavProp = NativeStackNavigationProp<RootStackParamList, "TenantInvoiceList">;

type ListRow = { kind: "invoice"; key: string; item: TenantInvoiceFromApi; navigateToTicketDetail: boolean };

/** Tránh `data ?? []` tạo mảng mới mỗi render. */
const EMPTY_TENANT_INVOICES: TenantInvoiceFromApi[] = [];
const EMPTY_TENANT_HOUSE_ROWS: HouseFromApi[] = [];

export default function TenantInvoiceListScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  /** Căn đang chọn trong app (đổi nhà = đổi bộ hóa đơn bắt buộc / chặn truy cập theo căn này). */
  const { houseId: selectedHouseIdFromStore } = useAuthStore();
  const { data: invoiceQueryData, isLoading, isRefetching, refetch, isError } = useTenantInvoices();
  const rawInvoiceData = invoiceQueryData ?? EMPTY_TENANT_INVOICES;
  const { data: housesData } = useTenantHouses();
  const { data: userProfile } = useUserProfile();
  const tenantHouseList = housesData?.data ?? EMPTY_TENANT_HOUSE_ROWS;

  const profileMainHouseId = useMemo(
    () => String(userProfile?.mainHouseId ?? "").trim(),
    [userProfile?.mainHouseId]
  );

  type StatusFilter = "all" | "payable" | "paid";
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [invoicePage, setInvoicePage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const { scrollAtTop, onScrollForRefreshGate } = useRefreshControlGate();

  const normalizedSelectedHouseId = useMemo(
    () => String(selectedHouseIdFromStore ?? "").trim(),
    [selectedHouseIdFromStore]
  );

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);


  /**
   * Hóa đơn tiền nhà/cọc chưa trả của căn đang chọn — chỉ dùng gợi ý UI (kích hoạt căn phụ).
   * Lô chọn nhiều trên danh sách gồm cả phí sửa chữa; khối này vẫn chỉ tính tiền nhà/cọc theo căn.
   */
  const mandatorySelectedHouseInvoiceIds = useMemo(() => {
    if (!normalizedSelectedHouseId) return [] as string[];
    return rawInvoiceData
      .filter(
        (inv) =>
          isTenantInvoicePayable(inv.status) &&
          !isTenantRepairInvoiceFlow(inv) &&
          String(inv.houseId ?? "").trim() === normalizedSelectedHouseId
      )
      .map((inv) => String(inv.id ?? "").trim())
      .filter((id) => id.length > 0);
  }, [rawInvoiceData, normalizedSelectedHouseId]);

  const hasSelectedHousePaymentLock = mandatorySelectedHouseInvoiceIds.length > 0;

  /** Chú thích kích hoạt đủ chức năng — chỉ hiện trên căn phụ (khác `mainHouseId` hồ sơ). */
  const showSecondaryHouseActivationNote = useMemo(
    () =>
      hasSelectedHousePaymentLock &&
      normalizedSelectedHouseId.length > 0 &&
      profileMainHouseId.length > 0 &&
      normalizedSelectedHouseId !== profileMainHouseId,
    [hasSelectedHousePaymentLock, normalizedSelectedHouseId, profileMainHouseId]
  );

  /** Nhiều căn + đã có nhà chính trên hồ sơ → nhắc ưu tiên thanh toán nhà chính trước. */
  const showMainHousePayFirstNote = useMemo(() => {
    if (profileMainHouseId.length === 0) return false;
    return tenantHouseList.length > 1;
  }, [profileMainHouseId, tenantHouseList.length]);

  const data = useMemo(() => {
    let base = rawInvoiceData;
    if (filterStatus === "payable") {
      base = rawInvoiceData.filter((i) => isTenantInvoicePayable(i.status));
    } else if (filterStatus === "paid") {
      base = rawInvoiceData.filter((i) => !isTenantInvoicePayable(i.status));
    }
    return sortTenantInvoicesForDisplay(base);
  }, [rawInvoiceData, filterStatus]);

  const issueInvoices = useMemo(() => {
    const rows = data.filter((i) => isTenantRepairInvoiceFlow(i));
    return sortTenantIssueInvoicesByTicketActivityDesc(rows);
  }, [data]);
  const regularInvoices = useMemo(
    () => data.filter((i) => !isTenantRepairInvoiceFlow(i)),
    [data]
  );

  /** Mọi hóa đơn chưa trả (tiền nhà/cọc + phí sửa chữa): chọn nhiều / chọn tất cả / thanh toán gộp — không trộn hai loại trong một lượt. */
  const payableList = useMemo(() => filterPayableInvoices(data), [data]);
  const hasPayable = payableList.length > 0;

  const totalPages = useMemo(() => getTotalPages(regularInvoices.length), [regularInvoices.length]);
  const pagedRegular = useMemo(
    () => slicePage(regularInvoices, invoicePage),
    [regularInvoices, invoicePage]
  );

  /**
   * Xây dựng danh sách hàng hiển thị.
   * Trang 1: gộp issue invoices + regular invoices rồi sort chưa trả lên trước — tránh issue invoice
   * đã trả hiện cao hơn regular invoice chưa trả.
   * Trang 2+: chỉ paginated regular invoices (issue invoices không lặp lại).
   */
  const listRows = useMemo((): ListRow[] => {
    const out: ListRow[] = [];

    if (invoicePage === 1 && issueInvoices.length > 0) {
      type CombinedEntry = { item: TenantInvoiceFromApi; isIssue: boolean };
      const combined: CombinedEntry[] = [
        ...issueInvoices.map((item) => ({ item, isIssue: true })),
        ...pagedRegular.map((item) => ({ item, isIssue: false })),
      ];
      combined.sort((a, b) => {
        const ap = isTenantInvoicePayable(a.item.status) ? 0 : 1;
        const bp = isTenantInvoicePayable(b.item.status) ? 0 : 1;
        return ap - bp;
      });
      combined.forEach(({ item, isIssue }) =>
        out.push({
          kind: "invoice",
          key: isIssue ? `iss-${item.id}` : item.id,
          item,
          navigateToTicketDetail: isIssue,
        })
      );
    } else {
      pagedRegular.forEach((item) =>
        out.push({ kind: "invoice", key: item.id, item, navigateToTicketDetail: false })
      );
    }

    return out;
  }, [issueInvoices, invoicePage, pagedRegular]);

  useEffect(() => {
    setInvoicePage(1);
    setSelected(new Set());
    setLinkError(null);
  }, [filterStatus]);

  useEffect(() => {
    setInvoicePage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const statusLabel = (status: string) => {
    const key = `tenant_invoice.status_${String(status || "").toUpperCase()}`;
    const label = t(key);
    if (label !== key) return label;
    return status || "—";
  };

  const statusStyle = (status: string) => {
    if (isTenantInvoicePayable(status)) {
      return { pill: styles.statusUnpaid, text: styles.statusUnpaidText };
    }
    return { pill: styles.statusPaid, text: styles.statusPaidText };
  };

  const formatInvoiceDate = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return formatTenantIssueDateTime(String(iso), locale);
  };

  const renderInvoiceDueOrPaidMetaRow = (inv: TenantInvoiceFromApi) => {
    const unpaid = isTenantInvoicePayable(inv.status);
    const metaText = unpaid
      ? `${t("tenant_invoice.due")}: ${inv.dueDate ? formatInvoiceDate(inv.dueDate) || "—" : "—"}`
      : `${t("tenant_invoice.list_paid_at_label")}: ${
          inv.paidAt && String(inv.paidAt).trim()
            ? formatInvoiceDate(inv.paidAt) || "—"
            : t("tenant_invoice.detail_payment_success_pending")
        }`;
    return (
      <View style={styles.dueRow}>
        <Ionicons name="time-outline" size={14} color={neutral.textMuted} />
        <Text style={styles.meta} numberOfLines={1}>
          {metaText}
        </Text>
      </View>
    );
  };

  const getInvoiceDisplayTitle = (inv: TenantInvoiceFromApi) => formatTenantInvoiceCardTitle(inv, t);

  const onPressRow = useCallback(
    (item: TenantInvoiceFromApi, navigateToRepairInvoice: boolean) => {
      if (navigateToRepairInvoice || isTenantRepairInvoiceFlow(item)) {
        if (isTenantInvoiceIssueType(item)) {
          navigation.navigate("TenantInvoiceDetail", { invoice: item });
        } else {
          navigation.navigate("TenantIssueInvoice", { invoice: item });
        }
        return;
      }
      navigation.navigate("TenantInvoiceDetail", { invoice: item });
    },
    [navigation]
  );

  const toggle = useCallback((id: string) => {
    setLinkError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const totalSelected = selected.size;
  const allSelected =
    payableList.length > 0 && payableList.every((inv) => selected.has(inv.id));
  const toggleSelectAll = useCallback(() => {
    setLinkError(null);
    setSelected((prev) => {
      if (payableList.length === 0) return prev;
      const allOn = payableList.every((inv) => prev.has(inv.id));
      if (allOn) return new Set();
      return new Set(payableList.map((x) => x.id));
    });
  }, [payableList]);

  const selectedTotalAmount = useMemo(() => {
    let sum = 0;
    for (const inv of payableList) {
      if (selected.has(inv.id)) sum += Number(inv.amount) || 0;
    }
    return sum;
  }, [payableList, selected]);

  const paySelectionLocked = totalSelected === 0 || creatingLink;

  const confirmPay = useCallback(async () => {
    if (totalSelected === 0) {
      Alert.alert(t("tenant_invoice.multi_none_title"), t("tenant_invoice.multi_none_body"));
      return;
    }
    const payableMapById = new Map(
      rawInvoiceData
        .filter((x) => isTenantInvoicePayable(x.status))
        .map((x) => [String(x.id ?? "").trim(), x] as const)
    );
    const ids = Array.from(selected).filter((id) => payableMapById.has(id));
    ids.sort((a, b) => a.localeCompare(b));
    let repairSelected = 0;
    for (const id of ids) {
      const inv = payableMapById.get(id);
      if (inv && isTenantRepairInvoiceFlow(inv)) repairSelected += 1;
    }
    const allRepair = ids.length > 0 && repairSelected === ids.length;
    const noRepair = repairSelected === 0;
    if (ids.length > 0 && !allRepair && !noRepair) {
      Alert.alert(
        t("tenant_invoice.multi_mixed_types_title"),
        t("tenant_invoice.multi_mixed_types_body")
      );
      return;
    }
    const vnpayUiContext = allRepair ? ("repair_fee_invoice" as const) : ("house_invoice" as const);
    setCreatingLink(true);
    setLinkError(null);
    try {
      const checkoutUrl = await createVnpayPaymentLink(
        { invoiceIds: ids },
        { appLanguage: i18n.language }
      );
      navigation.navigate("VnpayCheckout", {
        checkoutUrl,
        afterSuccess: "invoiceList",
        vnpayUiContext,
      });
    } catch (e: unknown) {
      setLinkError(formatApiErrorForTenantAlert(e, t, "payment_link"));
    } finally {
      setCreatingLink(false);
    }
  }, [totalSelected, t, rawInvoiceData, selected, i18n.language, navigation]);

  const renderDetailLink = (toRepairInvoice: boolean) => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={styles.detailsLinkText}>
        {toRepairInvoice
          ? t("tenant_invoice.view_repair_invoice_detail")
          : t("tenant_invoice.view_detail")}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={brandSecondary} />
    </View>
  );

  /**
   * Render một card hóa đơn.
   * - Hóa đơn đã trả: card bấm toàn bộ.
   * - Hóa đơn chưa trả: có ô checkbox chọn nhiều + footer thanh toán gộp.
   */
  const renderInvoiceCard = (item: TenantInvoiceFromApi, navigateToTicketDetail: boolean) => {
    const sv = statusStyle(item.status);
    const payable = isTenantInvoicePayable(item.status);
    const open = () => void onPressRow(item, navigateToTicketDetail);

    if (!payable) {
      return (
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={open}>
          <View style={styles.cardTopRow}>
            <View style={[styles.statusPill, sv.pill]}>
              <Text style={[styles.statusPillText, sv.text]} numberOfLines={1}>
                {statusLabel(item.status)}
              </Text>
            </View>
            <View style={styles.cardTopRowSpacer} />
            <TouchableOpacity
              style={styles.detailsLink}
              onPress={open}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {renderDetailLink(navigateToTicketDetail)}
            </TouchableOpacity>
          </View>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {getInvoiceDisplayTitle(item)}
          </Text>
          <View style={styles.cardBottomRow}>
            {renderInvoiceDueOrPaidMetaRow(item)}
            <Text style={styles.amount} numberOfLines={1}>
              {formatTenantInvoiceAmount(item.amount, item.currency, locale, t)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    const on = selected.has(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={styles.checkboxHitWrap}
            activeOpacity={0.88}
            onPress={() => toggle(item.id)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View style={[styles.checkboxRound, on && styles.checkboxRoundOn]}>
              {on ? <Ionicons name="checkmark" size={14} color={neutral.surface} /> : null}
            </View>
          </TouchableOpacity>
          <View style={[styles.statusPill, sv.pill]}>
            <Text style={[styles.statusPillText, sv.text]} numberOfLines={1}>
              {statusLabel(item.status)}
            </Text>
          </View>
          <View style={styles.cardTopRowSpacer} />
          <TouchableOpacity
            style={styles.detailsLink}
            onPress={open}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {renderDetailLink(navigateToTicketDetail)}
          </TouchableOpacity>
        </View>
        <TouchableOpacity activeOpacity={0.92} onPress={open}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {getInvoiceDisplayTitle(item)}
          </Text>
          <View style={styles.cardBottomRow}>
            {renderInvoiceDueOrPaidMetaRow(item)}
            <Text style={styles.amount} numberOfLines={1}>
              {formatTenantInvoiceAmount(item.amount, item.currency, locale, t)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRow = ({ item, index }: ListRenderItemInfo<ListRow>) => (
    <View style={[styles.mergedCardRow, index === 0 && styles.mergedCardRowFirst]}>
      {renderInvoiceCard(item.item, item.navigateToTicketDetail)}
    </View>
  );

  const showPageHeading = !(isLoading && !isRefetching);

  const listHeader = useMemo(
    () =>
      !showPageHeading ? null : (
        <View style={styles.mergedCardTop}>
          <Text style={styles.filterCardTitle} numberOfLines={1}>
            {t("tenant_invoice.list_heading")}
          </Text>
          {showMainHousePayFirstNote ? (
            <Text style={styles.mergedCardMandatoryLine}>
              {t("tenant_invoice.main_house_pay_first_required_note")}
            </Text>
          ) : null}
          {showSecondaryHouseActivationNote ? (
            <Text
              style={[
                styles.mergedCardMandatoryLine,
                showMainHousePayFirstNote ? { marginTop: 6 } : null,
              ]}
            >
              {t("tenant_invoice.secondary_house_first_rent_activation_note")}
            </Text>
          ) : null}
          <View style={styles.filterByHouseWrap}>
            <Text style={styles.filterByHouseLabel}>{t("tenant_invoice.filter_by_status")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterChipsScroll}
              contentContainerStyle={styles.filterChipsContent}
              keyboardShouldPersistTaps="handled"
            >
              {(
                [
                  { key: "all", label: t("tenant_invoice.chip_all") },
                  { key: "payable", label: t("tenant_invoice.section_unpaid") },
                  { key: "paid", label: t("tenant_invoice.section_paid") },
                ] as const
              ).map(({ key, label }) => {
                const active = filterStatus === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterSortChip, active && styles.filterSortChipActive]}
                    onPress={() => setFilterStatus(key)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[styles.filterSortChipText, active && styles.filterSortChipTextActive]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          {hasPayable ? (
            <TouchableOpacity
              style={[styles.selectAllRow, { marginTop: 12 }]}
              onPress={toggleSelectAll}
              activeOpacity={0.88}
            >
              <View style={[styles.checkboxRound, allSelected && styles.checkboxRoundOn]}>
                {allSelected ? <Ionicons name="checkmark" size={14} color={neutral.surface} /> : null}
              </View>
              <Text style={styles.selectAllText}>{t("tenant_payment.select_all")}</Text>
              <Text style={styles.selectAllMeta}>
                {t("tenant_payment.selected_count", { count: totalSelected })}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ),
    [
      showPageHeading,
      t,
      showMainHousePayFirstNote,
      showSecondaryHouseActivationNote,
      filterStatus,
      hasPayable,
      allSelected,
      toggleSelectAll,
      totalSelected,
    ]
  );
  /** Đệm dưới footer (đẩy khối tổng lên, tránh sát home indicator / gesture). */
  const multiFooterExtraBottom = 18;
  const multiFooterBottomInset = insets.bottom + multiFooterExtraBottom;
  const listBottomPad =
    hasPayable && !isLoading && !isError
      ? 130 + insets.bottom + multiFooterExtraBottom
      : 24 + insets.bottom;

  return (
    <View style={styles.container}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icons.chevronBack size={24} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>{t("tenant_invoice.screen_title")}</StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      {isLoading && !isRefetching ? (
        <View style={[styles.listEmptyGrow, { paddingBottom: insets.bottom, position: "relative" }]}>
          <RefreshLogoOverlay visible mode="page" />
        </View>
      ) : isError ? (
        <View style={[styles.listEmptyGrow, { paddingBottom: insets.bottom }]}>
          <Text style={styles.emptyText}>{t("tenant_invoice.load_error")}</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, alignSelf: "center" }}>
            <Text style={{ color: brandPrimary, fontWeight: "600" }}>{t("common.try_again")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1, position: "relative" }}>
          <RefreshLogoOverlay visible={isRefetching} />
          <FlatList
            data={listRows}
            keyExtractor={(row) => row.key}
            renderItem={renderRow}
            ListHeaderComponent={listHeader}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[
              styles.listContentMerged,
              data.length === 0 ? styles.listEmptyGrow : undefined,
              { paddingBottom: listBottomPad },
            ]}
            onScroll={onScrollForRefreshGate}
            scrollEventThrottle={16}
            refreshControl={
              <PullToRefreshControl
                refreshing={isRefetching}
                onRefresh={() => refetch()}
                scrollAtTop={scrollAtTop}
              />
            }
            ListEmptyComponent={
              showPageHeading ? (
                <View style={styles.mergedCardEmpty}>
                  <Text style={styles.emptyText}>{t("tenant_invoice.empty_list")}</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>{t("tenant_invoice.empty_list")}</Text>
              )
            }
            extraData={{ invoicePage, selected, creatingLink }}
            ListFooterComponent={
              data.length > 0 ? (
                <View style={styles.mergedCardFooter}>
                  <PaginationBar
                    currentPage={invoicePage}
                    totalPages={totalPages}
                    onPageChange={setInvoicePage}
                    hideWhenSingle
                  />
                </View>
              ) : null
            }
          />
        </View>
      )}

      {hasPayable && !isLoading && !isError ? (
        <View style={[styles.multiFooter, { paddingBottom: multiFooterBottomInset }]}>
          <View style={styles.multiFooterInner}>
            <View style={styles.multiFooterLeft}>
              <Text style={styles.multiFooterLabel}>{t("tenant_invoice.footer_total_label")}</Text>
              <Text style={styles.multiSummaryLine}>
                <Text style={styles.multiSummaryMuted}>{t("tenant_invoice.multi_footer_selected_label")} </Text>
                <Text style={styles.multiSummaryValue}>{totalSelected}</Text>
                <Text style={styles.multiSummaryMuted}> · </Text>
                <Text style={styles.multiSummaryValue}>
                  {formatTenantInvoiceAmount(selectedTotalAmount, "VND", locale, t)}
                </Text>
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.multiPayBtn, paySelectionLocked && !creatingLink && styles.multiPayBtnDisabled]}
              onPress={confirmPay}
              activeOpacity={0.85}
              disabled={paySelectionLocked}
            >
              {creatingLink ? (
                <RefreshLogoInline logoPx={18} />
              ) : (
                <Text
                  style={[styles.multiPayBtnText, paySelectionLocked && styles.multiPayBtnTextDisabled]}
                >
                  {t("tenant_invoice.multi_confirm_pay")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {linkError ? (
            <Text style={[styles.meta, { marginTop: 10, textAlign: "center", color: BRAND_DANGER }]}>
              {linkError}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
