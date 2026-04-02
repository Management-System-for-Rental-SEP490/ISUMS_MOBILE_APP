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
import { useTenantHouses, useTenantInvoices } from "../../../../shared/hooks";
import {
  filterPayableInvoices,
  formatTenantInvoiceAmount,
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

export default function TenantInvoiceListScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { data: rawInvoiceData = [], isLoading, isRefetching, refetch, isError } =
    useTenantInvoices();
  const { data: housesData } = useTenantHouses();
  const tenantHouseList = housesData?.data ?? [];

  const [filterHouseId, setFilterHouseId] = useState<string | null>(null);
  const [invoicePage, setInvoicePage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

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

  const distinctHouseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const inv of rawInvoiceData) {
      const hid = String(inv.houseId ?? "").trim();
      if (hid) ids.add(hid);
    }
    return [...ids].sort((a, b) => a.localeCompare(b));
  }, [rawInvoiceData]);

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
    setSelected(new Set());
    setLinkError(null);
  }, [filterHouseId]);

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

  const getInvoiceDisplayTitle = (inv: TenantInvoiceFromApi) => {
    const title = String(inv.title ?? "").trim();
    const id = String(inv.id ?? "").trim();
    if (!title || title === id) return t("tenant_invoice.invoice_placeholder_title");
    return title;
  };

  const onPressRow = (item: TenantInvoiceFromApi) => {
    navigation.navigate("TenantInvoiceDetail", { invoice: item });
  };

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
  const allSelected = payableList.length > 0 && totalSelected === payableList.length;
  const toggleSelectAll = useCallback(() => {
    setLinkError(null);
    setSelected((prev) => {
      if (payableList.length === 0) return prev;
      if (prev.size === payableList.length) return new Set();
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
    const ids = payableList.filter((x) => selected.has(x.id)).map((x) => x.id);
    setCreatingLink(true);
    setLinkError(null);
    try {
      const checkoutUrl = await createVnpayPaymentLink(ids, { appLanguage: i18n.language });
      navigation.navigate("TenantRentPayment", {
        invoiceId: ids[0] ?? null,
        invoiceIds: ids,
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
  }, [totalSelected, t, payableList, selected, i18n.language, navigation]);

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
    if (item.kind === "section") {
      return (
        <View style={[styles.sectionHeaderRow, index === 0 && styles.sectionHeaderRowFirst]}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }
    return renderInvoiceCard(item.item);
  };

  const showPageHeading = !(isLoading && !isRefetching);
  const listBottomPad =
    hasPayable && !isLoading && !isError ? 130 + insets.bottom : 24 + insets.bottom;

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

      {showPageHeading ? (
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>{t("tenant_invoice.list_heading")}</Text>
          <Text style={styles.pageSubtitle}>{t("tenant_invoice.list_subtitle")}</Text>
          {distinctHouseIds.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.houseChipScroll}
              contentContainerStyle={styles.houseChipScrollContent}
            >
              <TouchableOpacity
                style={[styles.houseChip, filterHouseId == null && styles.houseChipActive]}
                onPress={() => setFilterHouseId(null)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.houseChipText,
                    filterHouseId == null && styles.houseChipTextActive,
                  ]}
                >
                  {t("tenant_invoice.chip_all")}
                </Text>
              </TouchableOpacity>
              {distinctHouseIds.map((hid) => {
                const active = filterHouseId === hid;
                return (
                  <TouchableOpacity
                    key={hid}
                    style={[styles.houseChip, active && styles.houseChipActive]}
                    onPress={() => setFilterHouseId(active ? null : hid)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.houseChipText, active && styles.houseChipTextActive]}
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
            <TouchableOpacity style={styles.selectAllRow} onPress={toggleSelectAll} activeOpacity={0.88}>
              <View style={[styles.checkboxRound, allSelected && styles.checkboxRoundOn]}>
                {allSelected ? <Ionicons name="checkmark" size={14} color={neutral.surface} /> : null}
              </View>
              <Text style={styles.selectAllText}>{t("tenant_payment.select_all")}</Text>
              <Text style={styles.selectAllMeta}>{t("tenant_payment.selected_count", { count: totalSelected })}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

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
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.listContent,
            data.length === 0 ? styles.listEmptyGrow : undefined,
            { paddingBottom: listBottomPad },
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} colors={[brandPrimary]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t("tenant_invoice.empty_list")}</Text>
          }
          extraData={{ invoicePage, selected, creatingLink }}
          ListFooterComponent={
            <View style={{ paddingBottom: hasPayable ? 8 : insets.bottom + 8 }}>
              <PaginationBar
                currentPage={invoicePage}
                totalPages={totalPages}
                onPageChange={setInvoicePage}
                hideWhenSingle
              />
            </View>
          }
        />
      )}

      {hasPayable && !isLoading && !isError ? (
        <View style={[styles.multiFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
