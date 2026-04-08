import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  isHouseIdOutsideTenantAccess,
  shortHouseIdForDisplay,
  tenantAccessibleHouseIdSet,
} from "../../../shared/utils";
import { getEContractPresignedPdfUrl } from "../../../shared/services/econtractApi";
import Icons from "../../../shared/theme/icon";
import {
  brandBlueMutedBg,
  brandFocusBorder,
  brandPrimary,
  brandSecondary,
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

/** Màu badge trạng thái — nền + chữ + viền (token trong color.tsx). */
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
      bg: brandBlueMutedBg,
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

export default function UserContractDetailScreen({ navigation, route }: Props) {
  const { contract } = route.params;
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
                    <View style={styles.pdfModalLoading}>
                      <ActivityIndicator size="large" color={brandPrimary} accessibilityLabel={t("common.loading")} />
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
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Icons.eContract size={28} color={brandSecondary} />
          </View>
          <Text style={styles.heroTitle} numberOfLines={4}>
            {contract.name || "—"}
          </Text>
          <View style={styles.badgeRow}>
            <StatusPill label={statusLabel} pill={pill} />
          </View>

          <View style={styles.heroMetaBlock}>
            <View style={styles.heroMetaRow}>
              <Icons.home size={18} color={neutral.textMuted} />
              <View style={styles.heroMetaTextCol}>
                <Text style={styles.heroMetaCaption}>{t("profile.e_contract_house_caption")}</Text>
                <Text style={styles.heroMetaValue}>{houseDisplayName}</Text>
                {houseOutsideAccess ? (
                  <Text style={styles.heroMetaDisclaimer}>{t("tenant_access.house_not_owned_disclaimer")}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.heroMetaRow}>
              <Icons.calendar size={18} color={neutral.textMuted} />
              <View style={styles.heroMetaTextCol}>
                <Text style={styles.heroMetaCaption}>{t("profile.e_contract_validity_caption")}</Text>
                <Text style={styles.heroMetaValue}>
                  {`${startFmt} — ${endFmt}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailCardHeaderRow}>
            <Icons.infoOutline size={20} color={brandSecondary} />
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
            <ActivityIndicator color={neutral.surface} accessibilityLabel={t("common.loading")} />
          ) : (
            <Icons.pictureAsPdf size={22} color={neutral.surface} />
          )}
          <Text style={styles.pdfBtnText}>{t("profile.e_contract_open_pdf")}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
