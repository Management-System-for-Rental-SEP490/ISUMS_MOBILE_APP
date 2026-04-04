import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { RootStackParamList } from "../../../../shared/types";
import { CustomAlert } from "../../../../shared/components/alert";
import {
  createVnpayPaymentLink,
  isLikelyVnpayReturnNavigation,
  validateVnpayReturnUrl,
} from "../../../../shared/services/tenantPaymentApi";
import { brandPrimary } from "../../../../shared/theme/color";
import {
  getTotalPages,
  slicePage,
} from "../../../../shared/utils";
import { PaginationBar } from "../../../../shared/components/PaginationBar";
import {
  HOUSES_KEYS,
  TENANT_INVOICES_QUERY_KEY,
  useTenantHouses,
  useTenantInvoices,
} from "../../../../shared/hooks";
import { formatTenantInvoiceAmount } from "../../../../shared/utils/tenantInvoice";
import { formatTenantIssueDateTime } from "../../../../shared/utils";
import { neutral } from "../../../../shared/theme/color";
import { Ionicons } from "@expo/vector-icons";
import Icons from "../../../../shared/theme/icon";
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
import styles from "./TenantRentPaymentStyles";
import { TENANT_MAIN_TAB_ROUTES } from "../../../../shared/components/footerNavigator";
import { useAuthStore } from "../../../../store/useAuthStore";
import { isTenantInvoicePayable } from "../../../../shared/utils/tenantInvoice";

type Props = NativeStackScreenProps<RootStackParamList, "TenantRentPayment">;

function navigateAfterSuccessfulRentPayment(
  navigation: Props["navigation"],
  afterSuccess: RootStackParamList["TenantRentPayment"]["afterSuccess"] | undefined
) {
  const mode = afterSuccess ?? "home";
  if (mode === "home") {
    const di = TENANT_MAIN_TAB_ROUTES.indexOf("Dashboard");
    const dashboardIndex = di >= 0 ? di : 2;
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            state: {
              routes: TENANT_MAIN_TAB_ROUTES.map((name) => ({ name })),
              index: dashboardIndex,
            },
          },
        ],
      })
    );
    return;
  }
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: "Main" }, { name: "TenantInvoiceList" }],
    })
  );
}

/** Mã trạng thái thô từ BE (vd. PAYMENT_SUCCESS) — không đưa vào alert cho người dùng. */
function isRawBackendPaymentToken(text: string): boolean {
  const s = text.trim();
  if (!s.length) return false;
  return /^[A-Z][A-Z0-9_]*$/.test(s);
}

function userFacingPaymentReturnBody(message: unknown, data: unknown): string | undefined {
  const parts: string[] = [];
  for (const x of [message, data]) {
    if (typeof x !== "string") continue;
    const s = x.trim();
    if (!s || isRawBackendPaymentToken(s)) continue;
    parts.push(s);
  }
  const joined = parts.join("\n\n").trim();
  return joined.length ? joined : undefined;
}

function resolvePrimaryInvoiceId(
  invoiceId: string | null | undefined,
  invoiceIds: string[] | undefined
): string | null {
  const firstFromList = invoiceIds?.find((x) => String(x).trim().length > 0);
  if (firstFromList) return String(firstFromList).trim();
  const one = String(invoiceId ?? "").trim();
  return one.length ? one : null;
}

function normalizeHouseId(id: string | null | undefined): string {
  return String(id ?? "").trim();
}

/**
 * Thanh toán VNPay: chọn một hoặc nhiều `invoiceIds` → POST /api/payments/vnpay → mở URL trong WebView.
 */
const TenantRentPaymentScreen = ({ navigation, route }: Props) => {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { houseId: mainHouseIdFromStore } = useAuthStore();
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Set<string>>(new Set());
  const [invoicePage, setInvoicePage] = useState(1);
  const { data: invoiceData = [] } = useTenantInvoices();
  const { data: housesData } = useTenantHouses();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(route.params?.checkoutUrl ?? null);
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isReturnProcessing, setIsReturnProcessing] = useState(false);
  const [isNavigatingAfterSuccess, setIsNavigatingAfterSuccess] = useState(false);
  /** Tránh gọi validate trùng cho cùng một URL redirect. */
  const handledVnpayReturnUrlsRef = useRef<Set<string>>(new Set());

  const invoiceId = resolvePrimaryInvoiceId(
    route.params?.invoiceId ?? null,
    route.params?.invoiceIds
  );
  const invoiceCandidates = useMemo(() => {
    const set = new Set<string>();
    const all = [...(route.params?.invoiceIds ?? []), String(invoiceId ?? "")];
    all.forEach((x) => {
      const id = String(x ?? "").trim();
      if (id) set.add(id);
    });
    return Array.from(set);
  }, [route.params?.invoiceIds, invoiceId]);

  const houseNameById = useMemo(() => {
    const list = Array.isArray(housesData?.data) ? housesData.data : [];
    const map = new Map<string, string>();
    for (const house of list) {
      const hid = String(house.id ?? "").trim();
      if (!hid) continue;
      const name = String(house.name ?? "").trim();
      map.set(hid, name.length ? name : hid);
    }
    return map;
  }, [housesData?.data]);

  const invoiceMapById = useMemo(() => {
    const map = new Map(invoiceData.map((x) => [x.id, x]));
    return map;
  }, [invoiceData]);

  const resolvedMainHouseId = useMemo(() => {
    const normalizedMain = normalizeHouseId(mainHouseIdFromStore);
    if (normalizedMain) return normalizedMain;
    if (invoiceCandidates.length === 1) {
      const only = invoiceMapById.get(invoiceCandidates[0]);
      return normalizeHouseId(only?.houseId);
    }
    return "";
  }, [mainHouseIdFromStore, invoiceCandidates, invoiceMapById]);

  const payableInvoiceIds = useMemo(
    () =>
      invoiceData
        .filter((inv) => isTenantInvoicePayable(inv.status))
        .sort((a, b) => {
          const aMain = normalizeHouseId(a.houseId) === resolvedMainHouseId ? 0 : 1;
          const bMain = normalizeHouseId(b.houseId) === resolvedMainHouseId ? 0 : 1;
          if (aMain !== bMain) return aMain - bMain;
          const aDue = new Date(a.dueDate ?? "").getTime();
          const bDue = new Date(b.dueDate ?? "").getTime();
          if (Number.isNaN(aDue) || Number.isNaN(bDue)) return 0;
          return aDue - bDue;
        })
        .map((inv) => String(inv.id ?? "").trim())
        .filter((id) => id.length > 0),
    [invoiceData, resolvedMainHouseId]
  );

  const effectiveInvoiceCandidates = useMemo(() => {
    return payableInvoiceIds;
  }, [payableInvoiceIds]);

  useEffect(() => {
    const firstSelection = new Set<string>(effectiveInvoiceCandidates);
    setSelectedInvoiceIds(Array.from(firstSelection));
    setInvoicePage(1);
    setCheckoutUrl(route.params?.checkoutUrl ?? null);
    setLinkError(null);
    setExpandedInvoiceIds(new Set());
  }, [effectiveInvoiceCandidates, route.params?.checkoutUrl]);

  useEffect(() => {
    if (checkoutUrl) {
      handledVnpayReturnUrlsRef.current = new Set();
    }
  }, [checkoutUrl]);

  const invoiceTotalPages = getTotalPages(effectiveInvoiceCandidates.length);
  const pagedInvoiceIds = useMemo(
    () => slicePage(effectiveInvoiceCandidates, invoicePage),
    [effectiveInvoiceCandidates, invoicePage]
  );

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  const toggleInvoice = (id: string) => {
    setCheckoutUrl(null);
    setLinkError(null);
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setCheckoutUrl(null);
    setLinkError(null);
    setSelectedInvoiceIds((prev) => {
      if (prev.length === effectiveInvoiceCandidates.length) {
        return [];
      }
      const next = new Set<string>(effectiveInvoiceCandidates);
      return Array.from(next);
    });
  };

  const toggleExpanded = useCallback((id: string) => {
    setExpandedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected =
    effectiveInvoiceCandidates.length > 0 &&
    selectedInvoiceIds.length === effectiveInvoiceCandidates.length;

  const onCreatePaymentLink = useCallback(async () => {
    if (selectedInvoiceIds.length === 0) return;
    setCreatingLink(true);
    setIsNavigatingAfterSuccess(false);
    setLinkError(null);
    try {
      const uri = await createVnpayPaymentLink(selectedInvoiceIds, {
        appLanguage: i18n.language,
      });
      setCheckoutUrl(uri);
    } catch (e: unknown) {
      const ax = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const apiMsg = ax?.response?.data?.message;
      const msg =
        (typeof apiMsg === "string" && apiMsg.trim()) ||
        (typeof ax?.message === "string" && ax.message !== "NO_INVOICE_IDS"
          ? ax.message
          : null) ||
        t("tenant_payment.link_error");
      setLinkError(msg);
    } finally {
      setCreatingLink(false);
    }
  }, [selectedInvoiceIds, t, i18n.language]);

  const processVnpayReturnIfNeeded = useCallback(
    async (url: string) => {
      if (!isLikelyVnpayReturnNavigation(url)) return;
      if (handledVnpayReturnUrlsRef.current.has(url)) return;
      handledVnpayReturnUrlsRef.current.add(url);
      setIsReturnProcessing(true);
      try {
        const payload = await validateVnpayReturnUrl(url);
        setCheckoutUrl(null);
        const body = userFacingPaymentReturnBody(payload.message, payload.data);
        const ok = Boolean(payload.success);
        if (ok) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: HOUSES_KEYS.tenant }),
          ]);
        }
        // Giữ loading ngắn để người dùng thấy trạng thái "đang xử lý" trước khi hiện alert.
        await new Promise((resolve) => setTimeout(resolve, 350));
        const afterSuccessParam = route.params?.afterSuccess;
        CustomAlert.alert(
          ok ? t("tenant_payment.return_success_title") : t("tenant_payment.return_failed_title"),
          body,
          [
            {
              text: t("common.close"),
              onPress: () => {
                if (!ok) {
                  setIsReturnProcessing(false);
                  return;
                }
                setIsNavigatingAfterSuccess(true);
                requestAnimationFrame(() => {
                  navigateAfterSuccessfulRentPayment(navigation, afterSuccessParam);
                });
              },
            },
          ],
          { type: ok ? "success" : "error" }
        );
      } catch (e: unknown) {
        handledVnpayReturnUrlsRef.current.delete(url);
        await new Promise((resolve) => setTimeout(resolve, 250));
        const ax = e as { message?: string; response?: { data?: { message?: string } } };
        const apiMsg = ax?.response?.data?.message;
        const raw =
          (typeof apiMsg === "string" && apiMsg.trim()) ||
          (typeof ax?.message === "string" ? ax.message.trim() : "") ||
          "";
        const msg =
          raw && !isRawBackendPaymentToken(raw)
            ? raw
            : t("tenant_payment.return_validate_error");
        CustomAlert.alert(t("tenant_payment.return_validate_error_title"), msg, [
          {
            text: t("common.close"),
            onPress: () => setIsReturnProcessing(false),
          },
        ], { type: "error" });
      }
    },
    [navigation, queryClient, route.params?.afterSuccess, t]
  );

  if (isReturnProcessing) {
    return (
      <SafeAreaView style={[styles.container, { flex: 1 }]} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={brandPrimary} />
          <Text style={{ color: neutral.textSecondary, marginTop: 10 }}>
            {t("common.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isNavigatingAfterSuccess) {
    return (
      <SafeAreaView style={[styles.container, { flex: 1 }]} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={brandPrimary} />
          <Text style={{ color: neutral.textSecondary, marginTop: 10 }}>
            {t("common.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (checkoutUrl) {
    return (
      <SafeAreaView style={[styles.container, { flex: 1 }]} edges={["top"]}>
        <WebView
          source={{ uri: checkoutUrl }}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={brandPrimary} />
            </View>
          )}
          injectedJavaScriptBeforeContentLoaded={`
            (function() {
              function hideTestOrderInfo() {
                try {
                  var nodes = document.querySelectorAll('*');
                  for (var i = 0; i < nodes.length; i++) {
                    var text = (nodes[i].textContent || '').trim();
                    if (!text) continue;
                    if (text.indexOf('(Test)') >= 0 && text.length < 240) {
                      nodes[i].style.display = 'none';
                    }
                  }
                } catch (e) {}
              }
              hideTestOrderInfo();
              setTimeout(hideTestOrderInfo, 400);
              setTimeout(hideTestOrderInfo, 1200);
            })();
            true;
          `}
          onShouldStartLoadWithRequest={(req) => {
            const url = req.url;
            if (!isLikelyVnpayReturnNavigation(url)) return true;
            void processVnpayReturnIfNeeded(url);
            return false;
          }}
          onNavigationStateChange={(nav) => {
            void processVnpayReturnIfNeeded(nav.url);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { flex: 1 }]}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icons.chevronBack size={24} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>{t("tenant_payment.title")}</StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 8) }}
        keyboardShouldPersistTaps="handled"
      >
          {route.params?.issueTicketId ? (
            <View style={styles.issueTicketBanner}>
              <Text style={styles.issueTicketBannerText}>
                {t("tenant_payment.issue_ticket_context")}
              </Text>
            </View>
          ) : null}
          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>{t("tenant_payment.checklist_title")}</Text>
            <Text style={styles.checklistSubTitle}>
              {t("tenant_invoice.multi_subtitle")}
            </Text>
            {effectiveInvoiceCandidates.length > 0 ? (
              <>
                <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllRow}>
                  <View style={[styles.checkboxRound, allSelected && styles.checkboxRoundOn]}>
                    {allSelected ? <Ionicons name="checkmark" size={14} color={neutral.surface} /> : null}
                  </View>
                  <Text style={styles.selectAllText}>{t("tenant_payment.select_all")}</Text>
                  <Text style={styles.selectAllMeta}>
                    {t("tenant_payment.selected_count", { count: selectedInvoiceIds.length })}
                  </Text>
                </TouchableOpacity>
                {pagedInvoiceIds.map((id) => {
                  const rowIndex = effectiveInvoiceCandidates.indexOf(id) + 1;
                  const selected = selectedInvoiceIds.includes(id);
                  const isOpen = expandedInvoiceIds.has(id);
                  const inv = invoiceMapById.get(id);
                  const invoiceHouseId = normalizeHouseId(inv?.houseId);
                  const isMainHouseInvoice =
                    Boolean(resolvedMainHouseId) && invoiceHouseId === resolvedMainHouseId;
                  const displayTitle =
                    inv?.title && inv.title !== inv.id
                      ? inv.title
                      : t("tenant_invoice.invoice_placeholder_title");
                  return (
                    <View key={id} style={styles.invoiceAccordionCard}>
                      <View style={styles.invoiceAccordionHeader}>
                        <TouchableOpacity
                          onPress={() => toggleInvoice(id)}
                          style={styles.invoiceRow}
                          activeOpacity={0.85}
                        >
                          <View style={[styles.checkboxRound, selected && styles.checkboxRoundOn]}>
                            {selected ? (
                              <Ionicons name="checkmark" size={14} color={neutral.surface} />
                            ) : null}
                          </View>
                          <View style={styles.invoiceTextWrap}>
                            <Text style={styles.invoiceText} numberOfLines={1}>
                              {displayTitle || t("tenant_payment.invoice_row_label", { index: rowIndex })}
                            </Text>
                            <Text style={styles.invoiceMetaText}>
                              {inv?.dueDate
                                ? `${t("tenant_invoice.due")}: ${formatTenantIssueDateTime(inv.dueDate, locale)}`
                                : `${t("tenant_payment.invoice_id_label")}: ${id}`}
                            </Text>
                            {inv?.houseId ? (
                              <View style={styles.houseMetaRow}>
                                <Text style={styles.invoiceMetaText}>
                                  {t("tenant_invoice.field_house")}:{" "}
                                  {houseNameById.get(invoiceHouseId) ?? invoiceHouseId}
                                </Text>
                                {isMainHouseInvoice ? (
                                  <View style={styles.mainHouseBadge}>
                                    <Text style={styles.mainHouseBadgeText}>
                                      {t("tenant_payment.main_house_badge")}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.accordionChevronBtn}
                          onPress={() => toggleExpanded(id)}
                          activeOpacity={0.8}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <Ionicons
                            name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
                            size={18}
                            color={neutral.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {String(inv?.type || t("common.no_data")).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.totalLabel}>{t("tenant_invoice.field_total_amount")}</Text>
                      <View style={styles.amountRow}>
                        <Text style={styles.invoiceAmountText}>
                          {formatTenantInvoiceAmount(inv?.amount ?? 0, inv?.currency ?? "VND", locale)}
                        </Text>
                        <View style={styles.amountAction}>
                          <Ionicons name="calendar-outline" size={18} color={brandPrimary} />
                        </View>
                      </View>
                      {isOpen ? (
                        <View style={styles.invoiceAccordionBody}>
                          <Text style={styles.invoiceMetaText}>
                            {t("tenant_payment.invoice_id_label")}: {id}
                          </Text>
                          <Text style={styles.invoiceMetaText}>
                            {t("tenant_invoice.field_type")}: {inv?.type || "—"}
                          </Text>
                          <Text style={styles.invoiceMetaText}>
                            {t("tenant_invoice.field_period")}: {inv?.periodKey || "—"}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
                <PaginationBar
                  currentPage={invoicePage}
                  totalPages={invoiceTotalPages}
                  onPageChange={setInvoicePage}
                  hideWhenSingle
                  style={styles.paginationWrap}
                />
              </>
            ) : (
              <Text style={styles.placeholderBody}>{t("tenant_payment.no_invoice")}</Text>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.placeholderTitle}>{t("tenant_payment.placeholder_title")}</Text>
            <Text style={styles.placeholderBody}>{t("tenant_payment.placeholder_body")}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.payButton,
              (creatingLink ||
                selectedInvoiceIds.length === 0) &&
                styles.payButtonDisabled,
            ]}
            onPress={onCreatePaymentLink}
            disabled={creatingLink || selectedInvoiceIds.length === 0}
            activeOpacity={0.9}
          >
            {creatingLink ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="card-outline" size={18} color={neutral.surface} />
                <Text style={styles.payButtonText}>{t("tenant_payment.pay_selected")}</Text>
              </>
            )}
          </TouchableOpacity>

          {linkError ? (
            <Text style={[styles.placeholderBody, styles.linkErrorText]}>
              {linkError}
            </Text>
          ) : null}

      </ScrollView>
    </View>
  );
};

export default TenantRentPaymentScreen;
