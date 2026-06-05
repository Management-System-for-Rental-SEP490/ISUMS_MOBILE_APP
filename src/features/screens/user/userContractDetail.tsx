import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import axios from "axios";
import * as WebBrowser from "expo-web-browser";
import WebView from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CustomAlert as Alert } from "../../../shared/components/alert";
import { RootStackParamList } from "../../../shared/types";
import { useHouseById, useTenantHouses } from "../../../shared/hooks";
import {
  formatTenantContractDay,
  formatVndDisplay,
  isHouseIdOutsideTenantAccess,
  shortHouseIdForDisplay,
  tenantAccessibleHouseIdSet,
} from "../../../shared/utils";
import {
  acceptContractRelocationQuote,
  cancelContractRelocationRequest,
  createContractRelocationRequest,
  getContractRelocationLink,
  getEContractPresignedPdfUrl,
  getMarketplaceHouses,
  getMyContractRelocationRequests,
} from "../../../shared/services/econtractApi";
import type { ContractRelocationRequestFromApi, HouseFromApi } from "../../../shared/types/api";
import Icons from "../../../shared/theme/icon";
import {
  RefreshLogoInline,
  RefreshLogoOverlay,
} from "@shared/components/RefreshLogoOverlay";
import {
  brandFocusBorder,
  brandPrimary,
  brandSecondary,
  brandTheme,
  brandTintBg,
  neutral,
  tenantInvoicePaidBadgeBg,
  tenantInvoicePaidBadgeFg,
  tenantInvoiceUnpaidBadgeBg,
  tenantInvoiceUnpaidBadgeFg,
} from "../../../shared/theme/color";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../shared/components/StackScreenTitleBadge";
import { userContractDetailStyles as styles } from "./UserProfileScreenStyles";

type Props = NativeStackScreenProps<RootStackParamList, "UserContractDetail">;

function formatEContractStatus(status: string, t: (k: string) => string): string {
  const key = `profile.e_contract_status_${String(status || "").trim()}`;
  const label = t(key);
  return label !== key ? label : status || "—";
}

/** Màu badge trạng thái — nền + chữ + viền. */
function statusPillStyle(statusRaw: string): { bg: string; fg: string; border: string } {
  const s = String(statusRaw ?? "")
    .trim()
    .toUpperCase();

  if (s === "COMPLETED") {
    return {
      bg: tenantInvoicePaidBadgeBg,
      fg: tenantInvoicePaidBadgeFg,
      border: brandPrimary,
    };
  }

  if (s === "DRAFT") {
    return {
      bg: neutral.backgroundElevated,
      fg: neutral.slate600,
      border: neutral.slate300,
    };
  }

  if (s === "PENDING_TENANT_REVIEW") {
    return {
      bg: tenantInvoiceUnpaidBadgeBg,
      fg: tenantInvoiceUnpaidBadgeFg,
      border: tenantInvoiceUnpaidBadgeFg,
    };
  }

  if (s === "IN_PROGRESS" || s === "READY") {
    return {
      bg: brandTheme.blueMutedBg,
      fg: brandSecondary,
      border: brandFocusBorder,
    };
  }

  return {
    bg: brandTintBg,
    fg: brandPrimary,
    border: brandPrimary,
  };
}

function StatusPill({ label, pill }: { label: string; pill: ReturnType<typeof statusPillStyle> }) {
  return (
    <View
      style={[
        styles.statusPill,
        {
          backgroundColor: pill.bg,
          borderColor: pill.border,
        },
      ]}
    >
      <Text style={[styles.statusPillText, { color: pill.fg }]}>{label}</Text>
    </View>
  );
}

function QuoteRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.relocationQuoteRow}>
      <Text style={styles.relocationQuoteLabel}>{label}</Text>
      <Text
        style={[
          styles.relocationQuoteValue,
          emphasized && styles.relocationQuoteValueEmphasized,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function houseCardLabel(house: HouseFromApi): string {
  const name = String(house.name ?? "").trim();
  if (name) return name;
  return shortHouseIdForDisplay(String(house.id ?? ""));
}

function isOpenRelocationStatus(status: string | null | undefined): boolean {
  const s = String(status ?? "").toUpperCase();
  return !["REJECTED", "CANCELLED", "COMPLETED"].includes(s);
}

export default function UserContractDetailScreen({ navigation, route }: Props) {
  const { contract, relocationPrefillHouseId } = route.params;
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: housesRes } = useTenantHouses();

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  const tenantHouseRows = useMemo(
    () => (housesRes?.success && Array.isArray(housesRes.data) ? housesRes.data : []),
    [housesRes]
  );

  const accessHouseIds = useMemo(() => tenantAccessibleHouseIdSet(tenantHouseRows), [tenantHouseRows]);

  const houseOutsideAccess = useMemo(
    () => isHouseIdOutsideTenantAccess(contract.houseId, accessHouseIds),
    [contract.houseId, accessHouseIds]
  );

  const { data: houseByIdRes } = useHouseById(contract.houseId, houseOutsideAccess);

  const houseDisplayName = useMemo(() => {
    const hid = String(contract.houseId ?? "").trim();
    if (!hid) return "—";
    const found = tenantHouseRows.find((h) => String(h.id ?? "").trim() === hid);
    const name = found?.name?.trim();
    if (name) return name;
    const fromDetail =
      houseByIdRes?.success && houseByIdRes.data ? String(houseByIdRes.data.name ?? "").trim() : "";
    if (fromDetail) return fromDetail;
    return shortHouseIdForDisplay(hid);
  }, [contract.houseId, tenantHouseRows, houseByIdRes]);

  const contractId = String(contract.id ?? "").trim();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [relocationVisible, setRelocationVisible] = useState(false);
  const [relocationLoading, setRelocationLoading] = useState(false);
  const [relocationHouseLoading, setRelocationHouseLoading] = useState(false);
  const [relocationHouses, setRelocationHouses] = useState<HouseFromApi[]>([]);
  const [requestedHouseId, setRequestedHouseId] = useState("");
  const [relocationReason, setRelocationReason] = useState("");
  const [relocationRequests, setRelocationRequests] = useState<ContractRelocationRequestFromApi[]>([]);
  const [relocationLink, setRelocationLink] = useState<ContractRelocationRequestFromApi | null>(null);
  const [quoteAccepting, setQuoteAccepting] = useState(false);
  const [relocationCancelling, setRelocationCancelling] = useState(false);
  const [relocationSearch, setRelocationSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!contractId) {
      setRelocationLink(null);
      return () => {
        cancelled = true;
      };
    }
    getContractRelocationLink(contractId)
      .then((data) => {
        if (!cancelled) setRelocationLink(data);
      })
      .catch(() => {
        if (!cancelled) setRelocationLink(null);
      });
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  const resolvePdfErrorMessage = useCallback(
    (e: unknown): string => {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        if (status === 400) return t("profile.e_contract_pdf_error_no_pdf");
        if (status === 403) return t("profile.e_contract_pdf_error_forbidden");
        if (status === 404) return t("profile.e_contract_pdf_error_not_found");
        const d = e.response?.data;
        if (d && typeof d === "object" && "message" in d && typeof (d as { message: string }).message === "string") {
          const m = (d as { message: string }).message.trim();
          if (m) return m;
        }
      }
      if (e instanceof Error && e.message === "MISSING_CONTRACT_ID") {
        return t("profile.e_contract_pdf_error_not_found");
      }
      return t("profile.e_contract_pdf_fetch_error");
    },
    [t],
  );

  const closePdfViewer = useCallback(() => {
    setPdfViewerUrl(null);
  }, []);

  const openContractPdf = useCallback(async () => {
    if (!contractId || pdfLoading) return;
    setPdfLoading(true);
    try {
      const pdfUrl = await getEContractPresignedPdfUrl(contractId);
      /**
       * Android WebView thường không vẽ PDF trực tiếp từ URL S3 → màn trắng.
       * Custom Tabs (expo-web-browser) xử lý PDF ổn định và vẫn là trải nghiệm “trong app”.
       */
      if (Platform.OS === "android" || Platform.OS === "web") {
        await WebBrowser.openBrowserAsync(pdfUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      } else {
        setPdfViewerUrl(pdfUrl);
      }
    } catch (e) {
      Alert.alert(t("common.error"), resolvePdfErrorMessage(e));
    } finally {
      setPdfLoading(false);
    }
  }, [contractId, pdfLoading, resolvePdfErrorMessage, t]);

  const canRequestRelocation = String(contract.status ?? "").toUpperCase() === "COMPLETED";

  const loadRelocationRequests = useCallback(async () => {
    if (!contractId) return;
    try {
      const rows = await getMyContractRelocationRequests();
      setRelocationRequests(rows);
    } catch {
      setRelocationRequests([]);
    }
  }, [contractId]);

  useEffect(() => {
    loadRelocationRequests();
  }, [loadRelocationRequests]);

  const activeRelocation = useMemo(
    () =>
      relocationRequests.find(
        (item) =>
          String(item.oldContractId ?? "") === contractId &&
          isOpenRelocationStatus(item.status)
      ) ?? null,
    [contractId, relocationRequests]
  );

  const relocationStatusLabel = useMemo(() => {
    if (!activeRelocation) return "";
    const key = `profile.relocation_status_${String(activeRelocation.status ?? "").toLowerCase()}`;
    const label = t(key);
    return label !== key ? label : String(activeRelocation.status ?? "");
  }, [activeRelocation, t]);

  const openRelocationModal = useCallback(
    async (prefillHouseId?: string) => {
      if (!canRequestRelocation || relocationLoading) return;
      setRequestedHouseId(prefillHouseId ?? "");
      setRelocationReason("");
      setRelocationSearch("");
      setRelocationVisible(true);
      setRelocationHouseLoading(true);
      try {
        const rows = await getMarketplaceHouses();
        const filtered = rows.filter(
          (h) => String(h.id ?? "") !== String(contract.houseId ?? ""),
        );
        setRelocationHouses(filtered);
        // Re-select prefilled house only if it's actually in the marketplace.
        // If the user navigated from a house that's not (or no longer) bookable,
        // we drop the prefill silently rather than show a phantom selection.
        if (prefillHouseId) {
          const exists = filtered.some(
            (h) => String(h.id ?? "") === String(prefillHouseId),
          );
          if (exists) {
            setRequestedHouseId(prefillHouseId);
          } else {
            setRequestedHouseId("");
          }
        }
      } catch {
        setRelocationHouses([]);
      } finally {
        setRelocationHouseLoading(false);
      }
    },
    [canRequestRelocation, contract.houseId, relocationLoading],
  );

  // Auto-open the relocation modal with a pre-selected house when the screen
  // is mounted with `relocationPrefillHouseId` in route params (i.e. user
  // tapped "Đổi sang nhà này" on a house detail page). Run only once per
  // navigation: clear the param after consumption to avoid re-opening on
  // every re-render or focus.
  const consumedPrefillRef = useRef(false);
  useEffect(() => {
    if (
      relocationPrefillHouseId &&
      !consumedPrefillRef.current &&
      canRequestRelocation &&
      !activeRelocation &&
      !relocationVisible
    ) {
      consumedPrefillRef.current = true;
      openRelocationModal(relocationPrefillHouseId);
      // Strip the param from the route so a back-then-forward navigation
      // doesn't re-trigger this effect.
      navigation.setParams({ relocationPrefillHouseId: undefined } as never);
    }
  }, [
    relocationPrefillHouseId,
    canRequestRelocation,
    activeRelocation,
    relocationVisible,
    openRelocationModal,
    navigation,
  ]);

  const filteredRelocationHouses = useMemo(() => {
    const term = relocationSearch.trim().toLowerCase();
    if (!term) return relocationHouses;
    return relocationHouses.filter((h) => {
      const fields = [h.name, h.address, h.ward, h.commune, h.city]
        .filter((s): s is string => typeof s === "string" && s.length > 0)
        .map((s) => s.toLowerCase());
      return fields.some((f) => f.includes(term));
    });
  }, [relocationHouses, relocationSearch]);

  const selectedHouseSummary = useMemo(() => {
    if (!requestedHouseId) return null;
    return relocationHouses.find((h) => String(h.id ?? "") === requestedHouseId) ?? null;
  }, [relocationHouses, requestedHouseId]);

  const submitRelocationRequest = useCallback(async () => {
    const nextHouseId = requestedHouseId.trim();
    const reason = relocationReason.trim();
    if (!nextHouseId) {
      Alert.alert(t("common.error"), t("profile.relocation_missing_house"));
      return;
    }
    if (nextHouseId === String(contract.houseId ?? "").trim()) {
      Alert.alert(t("common.error"), t("profile.relocation_same_house"));
      return;
    }
    if (!reason) {
      Alert.alert(t("common.error"), t("profile.relocation_missing_reason"));
      return;
    }

    setRelocationLoading(true);
    try {
      // For DEPOSIT_BOOKABLE houses, the new tenant must wait until the
      // current tenant hands over (per business rule). Auto-fill desiredMoveDate
      // from house.availableFrom so the manager can quote handover correctly.
      const desiredMoveDate =
        selectedHouseSummary?.availability === "DEPOSIT_BOOKABLE" &&
        selectedHouseSummary?.availableFrom
          ? selectedHouseSummary.availableFrom
          : null;

      await createContractRelocationRequest(contractId, {
        requestedHouseId: nextHouseId,
        reason,
        activeLease: true,
        desiredMoveDate,
      });
      setRelocationVisible(false);
      await loadRelocationRequests();
      Alert.alert(t("profile.relocation_success_title"), t("profile.relocation_success_message"));
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const message =
          typeof e.response?.data?.message === "string" && e.response.data.message.trim()
            ? e.response.data.message.trim()
            : t("profile.relocation_submit_error");
        Alert.alert(t("common.error"), message);
        return;
      }
      Alert.alert(t("common.error"), t("profile.relocation_submit_error"));
    } finally {
      setRelocationLoading(false);
    }
  }, [contract.houseId, contractId, loadRelocationRequests, relocationReason, requestedHouseId, selectedHouseSummary, t]);

  const acceptRelocationQuote = useCallback(async () => {
    if (!activeRelocation || quoteAccepting) return;
    setQuoteAccepting(true);
    try {
      await acceptContractRelocationQuote(activeRelocation.id);
      await loadRelocationRequests();
      Alert.alert(t("profile.relocation_quote_accepted_title"), t("profile.relocation_quote_accepted_message"));
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const message =
          typeof e.response?.data?.message === "string" && e.response.data.message.trim()
            ? e.response.data.message.trim()
            : t("profile.relocation_quote_accept_error");
        Alert.alert(t("common.error"), message);
      } else {
        Alert.alert(t("common.error"), t("profile.relocation_quote_accept_error"));
      }
    } finally {
      setQuoteAccepting(false);
    }
  }, [activeRelocation, loadRelocationRequests, quoteAccepting, t]);

  const cancelRelocationRequest = useCallback(async () => {
    if (!activeRelocation || relocationCancelling) return;
    Alert.alert(
      t("profile.relocation_cancel_confirm_title"),
      t("profile.relocation_cancel_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.relocation_cancel_confirm_ok"),
          style: "destructive",
          onPress: async () => {
            setRelocationCancelling(true);
            try {
              await cancelContractRelocationRequest(activeRelocation.id);
              await loadRelocationRequests();
              Alert.alert(
                t("profile.relocation_cancel_done_title"),
                t("profile.relocation_cancel_done_message"),
              );
            } catch (e) {
              const message = axios.isAxiosError(e) &&
                typeof e.response?.data?.message === "string" &&
                e.response.data.message.trim()
                  ? e.response.data.message.trim()
                  : t("profile.relocation_cancel_error");
              Alert.alert(t("common.error"), message);
            } finally {
              setRelocationCancelling(false);
            }
          },
        },
      ],
    );
  }, [activeRelocation, loadRelocationRequests, relocationCancelling, t]);

  const statusLabel = formatEContractStatus(contract.status, t);
  const pill = statusPillStyle(contract.status);
  const startFmt = formatTenantContractDay(contract.startAt, locale);
  const endFmt = formatTenantContractDay(contract.endAt, locale);

  /** Đệm đáy: vùng an toàn (home indicator / thanh điều hướng 3 nút) + chừa thêm cho nút PDF. */
  const scrollBottomPad = Math.max(insets.bottom, 20) + 32;

  return (
    <View style={styles.screen}>
      <Modal
        visible={pdfViewerUrl != null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closePdfViewer}
      >
        <View style={styles.pdfModalFill}>
          <SafeAreaView style={styles.pdfModalRoot} edges={["top", "left", "right", "bottom"]}>
            <View style={styles.pdfModalHeader}>
              <View style={styles.pdfModalHeaderSide}>
                <TouchableOpacity
                  onPress={closePdfViewer}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.close")}
                >
                  <Icons.chevronBack size={24} color={neutral.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.pdfModalTitle} numberOfLines={1}>
                {t("profile.e_contract_pdf_viewer_title")}
              </Text>
              <View style={styles.pdfModalHeaderSide} />
            </View>
            {pdfViewerUrl ? (
              <View style={styles.pdfModalWebWrap}>
                <WebView
                  source={{ uri: pdfViewerUrl }}
                  style={styles.pdfModalWeb}
                  startInLoadingState
                  allowsBackForwardNavigationGestures
                  originWhitelist={["https://*", "http://*"]}
                  renderLoading={() => (
                    <View style={[styles.pdfModalLoading, { position: "relative" }]}>
                      <RefreshLogoOverlay visible mode="page" />
                    </View>
                  )}
                  onError={() => {
                    Alert.alert(t("common.error"), t("profile.e_contract_pdf_open_error"), [
                      { text: t("common.close"), onPress: closePdfViewer },
                    ]);
                  }}
                />
              </View>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={relocationVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!relocationLoading) setRelocationVisible(false);
        }}
      >
        <View style={styles.relocationModalRoot}>
          <StackScreenTitleHeaderStrip>
            <View style={stackScreenTitleRowStyle}>
              <View style={stackScreenTitleSideSlotStyle}>
                <TouchableOpacity
                  style={stackScreenTitleBackBtnOnBrand}
                  onPress={() => {
                    if (!relocationLoading) setRelocationVisible(false);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.close")}
                >
                  <Icons.close size={22} color={stackScreenTitleOnBrandIconColor} />
                </TouchableOpacity>
              </View>
              <View style={stackScreenTitleCenterSlotStyle}>
                <StackScreenTitleBadge numberOfLines={1}>
                  {t("profile.relocation_title")}
                </StackScreenTitleBadge>
              </View>
              <StackScreenTitleBarBalance />
            </View>
          </StackScreenTitleHeaderStrip>

          <ScrollView
            style={styles.relocationModalScroll}
            contentContainerStyle={styles.relocationModalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.relocationSummaryCard}>
              <View style={styles.relocationSummaryIcon}>
                <Icons.home size={20} color={brandSecondary} />
              </View>
              <View style={styles.relocationSummaryTextCol}>
                <Text style={styles.relocationSummaryCaption}>
                  {t("profile.relocation_current_house")}
                </Text>
                <Text style={styles.relocationSummaryTitle}>{houseDisplayName}</Text>
              </View>
            </View>

            {relocationHouseLoading ? (
              <View style={styles.relocationLoadingCard}>
                <RefreshLogoInline logoPx={24} />
              </View>
            ) : relocationHouses.length === 0 ? (
              <View style={styles.relocationEmptyCard}>
                <Icons.home size={28} color={neutral.textMuted} />
                <Text style={styles.relocationEmptyTitle}>
                  {t("profile.relocation_no_houses_title")}
                </Text>
                <Text style={styles.relocationEmptyMessage}>
                  {t("profile.relocation_no_houses_message")}
                </Text>
              </View>
            ) : (
              <View style={styles.relocationSection}>
                <Text style={styles.relocationFieldLabel}>
                  {t("profile.relocation_select_house")}
                </Text>
                <View style={styles.relocationSearchBox}>
                  <Icons.search size={16} color={neutral.textMuted} />
                  <TextInput
                    value={relocationSearch}
                    onChangeText={setRelocationSearch}
                    placeholder={t("profile.relocation_search_placeholder")}
                    placeholderTextColor={neutral.textMuted}
                    style={styles.relocationSearchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {filteredRelocationHouses.length === 0 ? (
                  <Text style={styles.relocationEmptyMessage}>
                    {t("profile.relocation_no_match")}
                  </Text>
                ) : (
                  <View style={styles.relocationHouseList}>
                    {filteredRelocationHouses.map((house) => {
                      const houseId = String(house.id ?? "").trim();
                      const selected = houseId === requestedHouseId;
                      const cityLine = [house.ward, house.commune, house.city]
                        .filter(Boolean)
                        .join(" · ");
                      const areaText = house.areaM2 != null
                        ? `${house.areaM2}m²`
                        : null;
                      const floorsText = house.numberOfFloors != null
                        ? `${house.numberOfFloors} ${t("profile.relocation_floors")}`
                        : null;
                      const isBookable = house.availability === "DEPOSIT_BOOKABLE";
                      const availableFromLabel =
                        isBookable && house.availableFrom
                          ? formatTenantContractDay(house.availableFrom, locale)
                          : null;
                      return (
                        <Pressable
                          key={houseId}
                          onPress={() => setRequestedHouseId(houseId)}
                          style={({ pressed }) => [
                            styles.relocationHouseCard,
                            selected && styles.relocationHouseCardSelected,
                            pressed && styles.relocationHouseCardPressed,
                          ]}
                        >
                          <View style={styles.relocationHouseIcon}>
                            <Icons.home
                              size={18}
                              color={selected ? neutral.surface : brandSecondary}
                            />
                          </View>
                          <View style={styles.relocationHouseTextCol}>
                            <View style={styles.relocationHouseTopRow}>
                              <Text
                                style={[
                                  styles.relocationHouseName,
                                  selected && styles.relocationHouseNameSelected,
                                ]}
                                numberOfLines={1}
                              >
                                {houseCardLabel(house)}
                              </Text>
                              <View
                                style={[
                                  styles.relocationAvailabilityBadge,
                                  isBookable
                                    ? styles.relocationAvailabilityBadgeBookable
                                    : styles.relocationAvailabilityBadgeAvailable,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.relocationAvailabilityBadgeText,
                                    isBookable
                                      ? styles.relocationAvailabilityBadgeTextBookable
                                      : styles.relocationAvailabilityBadgeTextAvailable,
                                  ]}
                                >
                                  {isBookable
                                    ? t("profile.relocation_badge_bookable")
                                    : t("profile.relocation_badge_available")}
                                </Text>
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.relocationHouseAddress,
                                selected && styles.relocationHouseAddressSelected,
                              ]}
                              numberOfLines={2}
                            >
                              {house.address || cityLine || t("profile.relocation_no_address")}
                            </Text>
                            {availableFromLabel && (
                              <Text
                                style={[
                                  styles.relocationHouseAvailableFrom,
                                  selected && styles.relocationHouseAddressSelected,
                                ]}
                                numberOfLines={1}
                              >
                                {t("profile.relocation_handover_from", { date: availableFromLabel })}
                              </Text>
                            )}
                            {(areaText || floorsText) && (
                              <View style={styles.relocationHouseChipsRow}>
                                {areaText && (
                                  <View style={styles.relocationHouseChip}>
                                    <Text style={styles.relocationHouseChipText}>{areaText}</Text>
                                  </View>
                                )}
                                {floorsText && (
                                  <View style={styles.relocationHouseChip}>
                                    <Text style={styles.relocationHouseChipText}>{floorsText}</Text>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                          {selected ? <Icons.check size={20} color={brandPrimary} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {selectedHouseSummary && (
              <View style={styles.relocationSelectedCard}>
                <View style={styles.relocationSelectedIcon}>
                  <Icons.check size={18} color={neutral.surface} />
                </View>
                <View style={styles.relocationSelectedTextCol}>
                  <Text style={styles.relocationSelectedCaption}>
                    {t("profile.relocation_selected_caption")}
                  </Text>
                  <Text style={styles.relocationSelectedTitle} numberOfLines={1}>
                    {houseCardLabel(selectedHouseSummary)}
                  </Text>
                  <Text style={styles.relocationSelectedAddress} numberOfLines={2}>
                    {selectedHouseSummary.address ||
                      [selectedHouseSummary.ward, selectedHouseSummary.commune, selectedHouseSummary.city]
                        .filter(Boolean)
                        .join(" · ")}
                  </Text>
                  {selectedHouseSummary.availability === "DEPOSIT_BOOKABLE" &&
                    selectedHouseSummary.availableFrom && (
                      <Text style={styles.relocationSelectedHandover}>
                        {t("profile.relocation_handover_notice", {
                          date: formatTenantContractDay(
                            selectedHouseSummary.availableFrom,
                            locale,
                          ),
                        })}
                      </Text>
                    )}
                </View>
              </View>
            )}

            <View style={styles.relocationSection}>
              <Text style={styles.relocationFieldLabel}>
                {t("profile.relocation_reason")}
              </Text>
              <TextInput
                value={relocationReason}
                onChangeText={setRelocationReason}
                multiline
                textAlignVertical="top"
                maxLength={1000}
                placeholder={t("profile.relocation_reason_placeholder")}
                placeholderTextColor={neutral.textMuted}
                style={[styles.relocationInput, styles.relocationReasonInput]}
              />
            </View>
          </ScrollView>

          <View style={[styles.relocationFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[styles.relocationSecondaryBtn, relocationLoading && styles.pdfBtnDisabled]}
              onPress={() => {
                if (!relocationLoading) setRelocationVisible(false);
              }}
              activeOpacity={0.8}
              disabled={relocationLoading}
            >
              <Text style={styles.relocationSecondaryBtnText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.relocationPrimaryBtn, relocationLoading && styles.pdfBtnDisabled]}
              onPress={submitRelocationRequest}
              activeOpacity={0.86}
              disabled={relocationLoading}
            >
              {relocationLoading ? (
                <RefreshLogoInline logoPx={20} />
              ) : (
                <Icons.check size={20} color={neutral.surface} />
              )}
              <Text style={styles.relocationPrimaryBtnText}>
                {t("profile.relocation_submit")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <StackScreenTitleBadge numberOfLines={1}>
              {t("profile.e_contract_detail_title")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {relocationLink && (() => {
          const isCurrentOld = String(relocationLink.oldContractId ?? "") === contractId;
          const linkedNumber = isCurrentOld
            ? relocationLink.newContractNumber
            : relocationLink.oldContractNumber;
          const linkedShortId = String(
            isCurrentOld ? relocationLink.newContractId : relocationLink.oldContractId,
          )
            .slice(0, 8)
            .toUpperCase();
          const kindLabel = (() => {
            const kind = String(relocationLink.requestKind ?? "");
            if (kind === "ACTIVE_LEASE_TENANT_UPGRADE") return t("profile.relocation_link_kind_active_lease");
            if (kind === "PRE_HANDOVER_TENANT_REQUEST") return t("profile.relocation_link_kind_pre_handover");
            if (kind === "LANDLORD_FAULT_UNINHABITABLE") return t("profile.relocation_link_kind_landlord_fault");
            return kind;
          })();
          return (
            <View style={isCurrentOld ? styles.relocationLinkBannerOld : styles.relocationLinkBannerNew}>
              <View style={styles.relocationLinkBannerIcon}>
                <Icons.home size={20} color={isCurrentOld ? neutral.textSecondary : brandSecondary} />
              </View>
              <View style={styles.relocationLinkBannerTextCol}>
                <Text style={styles.relocationLinkBannerTitle}>
                  {isCurrentOld
                    ? t("profile.relocation_link_old_title")
                    : t("profile.relocation_link_new_title")}
                </Text>
              </View>
            </View>
          );
        })()}

        <View style={styles.detailCard}>
          <View style={styles.detailCardHeaderRow}>
            <Icons.eContract size={22} color={brandSecondary} />
            <Text style={styles.detailCardHeaderLabel}>{t("profile.e_contract_section_detail")}</Text>
          </View>

          <View style={styles.detailFieldRow}>
            <Text style={styles.fieldLabel}>{t("profile.e_contract_field_name")}</Text>
            <Text style={styles.fieldValue}>{contract.name || "—"}</Text>
          </View>
          <View style={styles.detailFieldRow}>
            <Text style={styles.fieldLabel}>{t("profile.e_contract_field_house")}</Text>
            <Text style={styles.fieldValue}>{houseDisplayName}</Text>
            {houseOutsideAccess ? (
              <Text style={[styles.heroMetaDisclaimer, { marginTop: 8 }]}>
                {t("tenant_access.house_not_owned_disclaimer")}
              </Text>
            ) : null}
          </View>
          <View style={styles.detailFieldRow}>
            <Text style={styles.fieldLabel}>{t("profile.e_contract_field_start")}</Text>
            <Text style={styles.fieldValue}>{startFmt}</Text>
          </View>
          <View style={styles.detailFieldRow}>
            <Text style={styles.fieldLabel}>{t("profile.e_contract_field_end")}</Text>
            <Text style={styles.fieldValue}>{endFmt}</Text>
          </View>
          <View style={styles.detailFieldRow}>
            <Text style={styles.fieldLabel}>{t("profile.e_contract_field_status")}</Text>
            <View style={styles.statusPillRow}>
              <StatusPill label={statusLabel} pill={pill} />
            </View>
          </View>
          <View style={[styles.detailFieldRow, styles.detailFieldRowLast]}>
            <Text style={styles.fieldLabel}>{t("profile.e_contract_field_created")}</Text>
            <Text style={styles.fieldValue}>{formatTenantContractDay(contract.createdAt, locale)}</Text>
          </View>
        </View>

        <Pressable
          onPress={openContractPdf}
          disabled={!contractId || pdfLoading}
          style={({ pressed }) => [
            styles.pdfBtn,
            pressed && !pdfLoading && styles.pdfBtnPressed,
            (!contractId || pdfLoading) && styles.pdfBtnDisabled,
          ]}
        >
          {pdfLoading ? (
            <RefreshLogoInline logoPx={20} />
          ) : (
            <Icons.pictureAsPdf size={22} color={neutral.surface} />
          )}
          <Text style={styles.pdfBtnText}>{t("profile.e_contract_open_pdf")}</Text>
        </Pressable>

        {activeRelocation ? (
          <View style={styles.relocationQuoteCard}>
            <View style={styles.relocationQuoteHeader}>
              <View style={styles.relocationQuoteIcon}>
                <Icons.home size={18} color={brandSecondary} />
              </View>
              <View style={styles.relocationEntryTextCol}>
                <Text style={styles.relocationEntryTitle}>
                  {t("profile.relocation_quote_title")}
                </Text>
                <Text style={styles.relocationEntrySubtitle}>{relocationStatusLabel}</Text>
              </View>
            </View>

            <View style={styles.relocationQuoteRows}>
              <QuoteRow
                label={t("profile.relocation_quote_new_deposit")}
                value={formatVndDisplay(activeRelocation.newDepositAmount, locale, t)}
              />
              <QuoteRow
                label={t("profile.relocation_quote_transferred_deposit")}
                value={formatVndDisplay(activeRelocation.transferredDepositAmount, locale, t)}
              />
              <QuoteRow
                label={t("profile.relocation_quote_additional_payment")}
                value={formatVndDisplay(
                  activeRelocation.totalAdditionalPaymentAmount ??
                    activeRelocation.additionalDepositAmount,
                  locale,
                  t
                )}
                emphasized
              />
            </View>

            {activeRelocation.managerNote ? (
              <Text style={styles.relocationQuoteNote}>{activeRelocation.managerNote}</Text>
            ) : null}

            {String(activeRelocation.status ?? "").toUpperCase() === "QUOTED" ? (
              <TouchableOpacity
                style={[styles.relocationQuoteAcceptBtn, quoteAccepting && styles.pdfBtnDisabled]}
                onPress={acceptRelocationQuote}
                disabled={quoteAccepting}
                activeOpacity={0.86}
              >
                {quoteAccepting ? (
                  <RefreshLogoInline logoPx={18} />
                ) : (
                  <Icons.check size={19} color={neutral.surface} />
                )}
                <Text style={styles.relocationQuoteAcceptText}>
                  {t("profile.relocation_quote_accept")}
                </Text>
              </TouchableOpacity>
            ) : null}

            {(() => {
              const s = String(activeRelocation.status ?? "").toUpperCase();
              if (s !== "REQUESTED" && s !== "QUOTED") return null;
              return (
                <TouchableOpacity
                  style={[
                    styles.relocationSecondaryBtn,
                    relocationCancelling && styles.pdfBtnDisabled,
                  ]}
                  onPress={cancelRelocationRequest}
                  disabled={relocationCancelling}
                  activeOpacity={0.86}
                >
                  {relocationCancelling ? (
                    <RefreshLogoInline logoPx={18} />
                  ) : null}
                  <Text style={styles.relocationSecondaryBtnText}>
                    {t("profile.relocation_cancel_btn")}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        ) : null}

        {canRequestRelocation && !activeRelocation ? (
          <Pressable
            onPress={() => {
              void openRelocationModal();
            }}
            disabled={relocationLoading}
            style={({ pressed }) => [
              styles.relocationEntryBtn,
              pressed && !relocationLoading && styles.relocationEntryBtnPressed,
              relocationLoading && styles.pdfBtnDisabled,
            ]}
          >
            <Icons.home size={21} color={brandSecondary} />
            <View style={styles.relocationEntryTextCol}>
              <Text style={styles.relocationEntryTitle}>
                {t("profile.relocation_entry_title")}
              </Text>
              <Text style={styles.relocationEntrySubtitle}>
                {t("profile.relocation_entry_subtitle")}
              </Text>
            </View>
            <Icons.chevronForward size={20} color={neutral.textMuted} />
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
