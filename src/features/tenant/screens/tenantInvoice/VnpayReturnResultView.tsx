import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BRAND_DANGER,
  brandDangerBg,
  brandDangerBorder,
  brandPrimary,
  brandTintBg,
  neutral,
} from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils/typography";
import { tenantInvoiceStyles as invStyles } from "./tenantInvoiceStyles";
import { RefreshLogoOverlay } from "@shared/components/RefreshLogoOverlay";

export type VnpayReturnUiPhase = "confirming" | "success" | "verify_skipped" | "failed";

export type VnpayReturnDetailRow = { label: string; value: string };

type Props = {
  phase: VnpayReturnUiPhase;
  title: string;
  message?: string;
  /** Tiêu đề nhóm (vd. i18n); chỉ hiện khi có `detailRows`. */
  detailSectionTitle?: string;
  /** Hàng thông tin đọc từ query VNPay (số tiền, giờ, mã GD…). */
  detailRows?: VnpayReturnDetailRow[];
  onPrimaryPress: () => void;
  primaryLabel: string;
  /**
   * `true`: màn cha đã có `StackScreenTitleHeaderStrip` (+ padding top status).
   * `false`: tự chừa safe area trên (màn độc lập).
   */
  omitTopInset?: boolean;
};

/** Màn kết quả thanh toán VNPay trong app (ngắn gọn, thân thiện). */
export function VnpayReturnResultView({
  phase,
  title,
  message,
  detailSectionTitle,
  detailRows,
  onPrimaryPress,
  primaryLabel,
  omitTopInset = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const isConfirming = phase === "confirming";
  const isFailed = phase === "failed";
  const iconColor = isFailed ? BRAND_DANGER : brandPrimary;
  const iconName = isFailed ? "close-circle" : "checkmark-circle";

  const bodyText = message?.trim() ?? "";
  const detailHeading = detailSectionTitle?.trim() ?? "";
  const rows = detailRows?.filter((r) => r.label?.trim() && r.value?.trim()) ?? [];
  const topPad = omitTopInset ? 12 : insets.top + 12;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: topPad,
          paddingBottom: isConfirming ? insets.bottom + 16 : 0,
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={invStyles.detailSummaryCard}>
          {isConfirming ? (
            <View style={[styles.heroInCard, { position: "relative", minHeight: 100 }]}>
              <RefreshLogoOverlay visible mode="page" />
            </View>
          ) : (
            <View style={styles.heroInCard}>
              <View
                style={[
                  styles.iconRing,
                  isFailed ? styles.iconRingError : styles.iconRingOk,
                ]}
              >
                <Ionicons name={iconName} size={56} color={iconColor} />
              </View>
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          {bodyText.length > 0 ? <Text style={styles.body}>{bodyText}</Text> : null}
        </View>
        {!isConfirming && rows.length > 0 ? (
          <View style={[invStyles.paymentFlowCard, styles.detailsCardBelow]}>
            {detailHeading.length > 0 ? (
              <View style={invStyles.paymentFlowTitleRow}>
                <View style={invStyles.sectionAccent} />
                <Text style={[invStyles.paymentFlowTitle, styles.paymentFlowTitleAligned]}>
                  {detailHeading}
                </Text>
              </View>
            ) : null}
            {rows.map((row, i) => (
              <View
                key={`${row.label}-${i}`}
                style={[
                  invStyles.paymentAttemptRow,
                  i === 0 && detailHeading.length === 0 ? invStyles.paymentAttemptRowFirst : null,
                ]}
              >
                <Text
                  style={[invStyles.detailLabel, i === 0 ? styles.detailLabelFirstInBlock : null]}
                >
                  {row.label}
                </Text>
                <Text style={invStyles.detailValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {!isConfirming ? (
        <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
          <Pressable
            onPress={onPrimaryPress}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          >
            <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: neutral.background,
    paddingHorizontal: 20,
  },
  heroInCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  iconRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  iconRingOk: {
    backgroundColor: brandTintBg,
    borderColor: "rgba(59, 181, 130, 0.35)",
  },
  iconRingError: {
    backgroundColor: brandDangerBg,
    borderColor: brandDangerBorder,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8, flexGrow: 1 },
  /** Tách khối tóm tắt và khối chi tiết (đồng bộ `paymentFlowCard` trong tenant invoice). */
  detailsCardBelow: {
    marginTop: 12,
  },
  /** `paymentFlowTitle` mặc định có marginBottom — bỏ trong hàng có `sectionAccent` để căn giữa theo trục dọc. */
  paymentFlowTitleAligned: {
    marginBottom: 0,
    paddingBottom: 0,
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
  detailLabelFirstInBlock: {
    marginTop: 0,
  },
  title: {
    ...appTypography.dialogTitle,
    fontSize: 22,
    fontWeight: "800",
    color: neutral.text,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    ...appTypography.body,
    fontSize: 16,
    lineHeight: 24,
    color: neutral.textSecondary,
    textAlign: "center",
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: neutral.border,
    backgroundColor: neutral.surface,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brandPrimary,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnPressed: { opacity: 0.92 },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: neutral.surface,
  },
});
