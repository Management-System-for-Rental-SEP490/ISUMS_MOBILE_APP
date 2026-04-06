import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList, TenantInvoiceFromApi } from "../../../../shared/types";
import type { HouseFromApi } from "../../../../shared/types/api";
import { useTenantHouses, useTenantInvoices, useUserProfile } from "../../../../shared/hooks";
import {
  filterPayableInvoices,
  formatTenantInvoiceAmount,
  formatTenantInvoiceTitleForDisplay,
  isTenantInvoicePayable,
  sortTenantInvoicesForDisplay,
} from "../../../../shared/utils/tenantInvoice";
import Icons from "../../../../shared/theme/icon";
import { BRAND_DANGER, brandPrimary, brandSecondary, neutral } from "../../../../shared/theme/color";
import { formatTenantIssueDateTime, getTotalPages, slicePage } from "../../../../shared/utils";
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

type ListRow =
  | { kind: "section"; key: string; title: string }
  | { kind: "invoice"; key: string; item: TenantInvoiceFromApi };

/** Tránh `data ?? []` tạo mảng mới mỗi render — làm `useEffect(..., [mandatorySelectedHouseInvoiceIds])` lặp vô hạn. */
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

  const [filterHouseId, setFilterHouseId] = useState<string | null>(null);
  const [invoicePage, setInvoicePage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

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

  const houseNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of tenantHouseList) {
      const id = String(h.id ?? "").trim();
      if (!id) continue;
      const name = String(h.name ?? "").trim();
      m.set(id, name.length ? name : id);
    }
    return m;
  }, [tenantHouseList]);

  /** Hóa đơn chưa trả của đúng căn đang chọn — luôn phải gồm trong lô thanh toán gộp. */
  const mandatorySelectedHouseInvoiceIds = useMemo(() => {
    if (!normalizedSelectedHouseId) return [] as string[];
    return rawInvoiceData
      .filter(
        (inv) =>
          isTenantInvoicePayable(inv.status) &&
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

  const distinctHouseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const inv of rawInvoiceData) {
      const hid = String(inv.houseId ?? "").trim();
      if (hid) ids.add(hid);
    }
    return [...ids].sort((a, b) => a.localeCompare(b));
  }, [rawInvoiceData]);

  /** Nhiều căn + đã có nhà chính trên hồ sơ → nhắc ưu tiên thanh toán nhà chính trước. */
  const showMainHousePayFirstNote = useMemo(() => {
    if (profileMainHouseId.length === 0) return false;
    if (tenantHouseList.length > 1) return true;
    return distinctHouseIds.length > 1;
  }, [profileMainHouseId, tenantHouseList.length, distinctHouseIds.length]);

  const data = useMemo(() => {
    const base =
      filterHouseId == null
        ? rawInvoiceData
        : rawInvoiceData.filter((i) => String(i.houseId ?? "").trim() === filterHouseId);
    return sortTenantInvoicesForDisplay(base);
  }, [rawInvoiceData, filterHouseId]);

  const showHouseOnCard = distinctHouseIds.length > 1 && filterHouseId == null;

  const payableList = useMemo(() => filterPayableInvoices(data), [data]);
  const hasPayable = payableList.length > 0;

  const totalPages = useMemo(() => getTotalPages(data.length), [data.length]);
  const pagedData = useMemo(() => slicePage(data, invoicePage), [data, invoicePage]);

  const listRows = useMemo((): ListRow[] => {
    const unpaid = pagedData.filter((i) => isTenantInvoicePayable(i.status));
    const paid = pagedData.filter((i) => !isTenantInvoicePayable(i.status));
    const out: ListRow[] = [];
    if (unpaid.length) {
      out.push({
        kind: "section",
        key: `section-unpaid-${invoicePage}`,
        title: t("tenant_invoice.section_unpaid"),
      });
      unpaid.forEach((item) => out.push({ kind: "invoice", key: item.id, item }));
    }
    if (paid.length) {
      out.push({
        kind: "section",
        key: `section-paid-${invoicePage}`,
        title: t("tenant_invoice.section_paid"),
      });
      paid.forEach((item) => out.push({ kind: "invoice", key: item.id, item }));
    }
    return out;
  }, [pagedData, invoicePage, t]);

  useEffect(() => {
    setInvoicePage(1);
    setSelected(new Set(mandatorySelectedHouseInvoiceIds));
    setLinkError(null);
  }, [filterHouseId, mandatorySelectedHouseInvoiceIds]);

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

  const getInvoiceDisplayTitle = (inv: TenantInvoiceFromApi) =>
    formatTenantInvoiceTitleForDisplay(inv, t);

  const onPressRow = (item: TenantInvoiceFromApi) => {
    navigation.navigate("TenantInvoiceDetail", { invoice: item });
  };

  const toggle = useCallback((id: string) => {
    setLinkError(null);
    setSelected((prev) => {
      if (prev.has(id) && mandatorySelectedHouseInvoiceIds.includes(id)) {
        setLinkError(t("tenant_payment.primary_house_required_action"));
        return prev;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [mandatorySelectedHouseInvoiceIds, t]);

  const totalSelected = selected.size;
  const allSelected =
    payableList.length > 0 && payableList.every((inv) => selected.has(inv.id));
  const toggleSelectAll = useCallback(() => {
    setLinkError(null);
    setSelected((prev) => {
      if (payableList.length === 0) return prev;
      if (prev.size === payableList.length) return new Set(mandatorySelectedHouseInvoiceIds);
      return new Set([...payableList.map((x) => x.id), ...mandatorySelectedHouseInvoiceIds]);
    });
  }, [payableList, mandatorySelectedHouseInvoiceIds]);

  const selectedTotalAmount = useMemo(() => {
    let sum = 0;
    for (const inv of payableList) {
      if (selected.has(inv.id)) sum += Number(inv.amount) || 0;
    }
    return sum;
  }, [payableList, selected]);

  const hasMissingMandatoryForSelectedHouse = useMemo(
    () => mandatorySelectedHouseInvoiceIds.some((id) => !selected.has(id)),
    [mandatorySelectedHouseInvoiceIds, selected]
  );

  const paySelectionLocked =
    totalSelected === 0 || creatingLink || hasMissingMandatoryForSelectedHouse;

  const confirmPay = useCallback(async () => {
    if (totalSelected === 0) {
      Alert.alert(t("tenant_invoice.multi_none_title"), t("tenant_invoice.multi_none_body"));
      return;
    }
    if (hasMissingMandatoryForSelectedHouse) {
      setLinkError(t("tenant_payment.primary_house_required_action"));
      return;
    }
    const payableMapById = new Map(
      rawInvoiceData
        .filter((x) => isTenantInvoicePayable(x.status))
        .map((x) => [String(x.id ?? "").trim(), x] as const)
    );
    const ids = Array.from(selected).filter((id) => payableMapById.has(id));
    ids.sort((a, b) => {
      const aSel = mandatorySelectedHouseInvoiceIds.includes(a) ? 0 : 1;
      const bSel = mandatorySelectedHouseInvoiceIds.includes(b) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.localeCompare(b);
    });
    setCreatingLink(true);
    setLinkError(null);
    try {
      const checkoutUrl = await createVnpayPaymentLink(ids, { appLanguage: i18n.language });
      navigation.navigate("VnpayCheckout", {
        checkoutUrl,
        afterSuccess: "invoiceList",
      });
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      const apiMsg = ax?.response?.data?.message;
      const msg =
        (typeof apiMsg === "string" && apiMsg.trim()) ||
        (typeof ax?.message === "string" ? ax.message : null) ||
        t("tenant_payment.link_error");
      setLinkError(msg);
    } finally {
      setCreatingLink(false);
    }
  }, [
    totalSelected,
    t,
    hasMissingMandatoryForSelectedHouse,
    rawInvoiceData,
    selected,
    mandatorySelectedHouseInvoiceIds,
    i18n.language,
    navigation,
  ]);

  const renderDetailLink = () => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={styles.detailsLinkText}>{t("tenant_invoice.view_detail")}</Text>
      <Ionicons name="chevron-forward" size={16} color={brandSecondary} />
    </View>
  );

  const houseLineLabel = (inv: TenantInvoiceFromApi) => {
    const hid = String(inv.houseId ?? "").trim();
    if (!hid) return "—";
    return houseNameById.get(hid) ?? `${hid.slice(0, 8)}…`;
  };

  const renderInvoiceCard = (item: TenantInvoiceFromApi) => {
    const sv = statusStyle(item.status);
    const payable = isTenantInvoicePayable(item.status);

    if (!payable) {
      return (
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => onPressRow(item)}>
          <View style={styles.cardTopRow}>
            <View style={[styles.statusPill, sv.pill]}>
              <Text style={[styles.statusPillText, sv.text]} numberOfLines={1}>
                {statusLabel(item.status)}
              </Text>
            </View>
            <View style={styles.cardTopRowSpacer} />
            <TouchableOpacity
              style={styles.detailsLink}
              onPress={() => onPressRow(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {renderDetailLink()}
            </TouchableOpacity>
          </View>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {getInvoiceDisplayTitle(item)}
          </Text>
          {showHouseOnCard && item.houseId ? (
            <Text style={styles.cardHouseLine} numberOfLines={1}>
              {t("tenant_invoice.field_house")}: {houseLineLabel(item)}
            </Text>
          ) : null}
          <View style={styles.dueRow}>
            <Ionicons name="time-outline" size={14} color={neutral.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {t("tenant_invoice.due")}: {item.dueDate ? formatInvoiceDate(item.dueDate) || "—" : "—"}
            </Text>
          </View>
          <Text style={styles.amount}>
            {formatTenantInvoiceAmount(item.amount, item.currency, locale)}
          </Text>
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
            onPress={() => onPressRow(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {renderDetailLink()}
          </TouchableOpacity>
        </View>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {getInvoiceDisplayTitle(item)}
        </Text>
        {showHouseOnCard && item.houseId ? (
          <Text style={styles.cardHouseLine} numberOfLines={1}>
            {t("tenant_invoice.field_house")}: {houseLineLabel(item)}
          </Text>
        ) : null}
        <View style={styles.dueRow}>
          <Ionicons name="time-outline" size={14} color={neutral.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>
            {t("tenant_invoice.due")}: {item.dueDate ? formatInvoiceDate(item.dueDate) || "—" : "—"}
          </Text>
        </View>
        <Text style={styles.amount}>
          {formatTenantInvoiceAmount(item.amount, item.currency, locale)}
        </Text>
      </View>
    );
  };

  const renderRow = ({ item, index }: ListRenderItemInfo<ListRow>) => {
    const rowShell = (child: React.ReactElement) => (
      <View style={[styles.mergedCardRow, index === 0 && styles.mergedCardRowFirst]}>{child}</View>
    );
    if (item.kind === "section") {
      return rowShell(
        <View style={[styles.sectionHeaderInMerged, index === 0 && styles.sectionHeaderInMergedFirst]}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }
    return rowShell(renderInvoiceCard(item.item));
  };

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
          {distinctHouseIds.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.filterChipsScroll, { marginTop: 12 }]}
              contentContainerStyle={styles.filterChipsContent}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                style={[styles.filterSortChip, filterHouseId == null && styles.filterSortChipActive]}
                onPress={() => setFilterHouseId(null)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: filterHouseId == null }}
              >
                <Text
                  style={[
                    styles.filterSortChipText,
                    filterHouseId == null && styles.filterSortChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {t("tenant_invoice.chip_all")}
                </Text>
              </TouchableOpacity>
              {distinctHouseIds.map((hid) => {
                const active = filterHouseId === hid;
                return (
                  <TouchableOpacity
                    key={hid}
                    style={[styles.filterSortChip, active && styles.filterSortChipActive]}
                    onPress={() => setFilterHouseId(active ? null : hid)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[styles.filterSortChipText, active && styles.filterSortChipTextActive]}
                      numberOfLines={1}
                    >
                      {houseNameById.get(hid) ?? `${hid.slice(0, 8)}…`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
          {hasPayable ? (
            <TouchableOpacity
              style={[styles.selectAllRow, { marginTop: distinctHouseIds.length > 0 ? 12 : 14 }]}
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
      distinctHouseIds,
      filterHouseId,
      houseNameById,
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
        <View style={[styles.listEmptyGrow, { paddingBottom: insets.bottom }]}>
          <ActivityIndicator size="large" color={brandPrimary} />
        </View>
      ) : isError ? (
        <View style={[styles.listEmptyGrow, { paddingBottom: insets.bottom }]}>
          <Text style={styles.emptyText}>{t("tenant_invoice.load_error")}</Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, alignSelf: "center" }}>
            <Text style={{ color: brandPrimary, fontWeight: "600" }}>{t("common.try_again")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} colors={[brandPrimary]} />
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
                  {formatTenantInvoiceAmount(selectedTotalAmount, "VND", locale)}
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
                <ActivityIndicator size="small" color={neutral.surface} />
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
