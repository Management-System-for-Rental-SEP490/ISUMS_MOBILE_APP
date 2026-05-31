import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { brandPrimary, brandSecondary, brandTintBg, neutral } from "@shared/theme/color";
import { appTypography } from "@shared/utils/typography";
import Icons from "@shared/theme/icon";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "@shared/components/StackScreenTitleBadge";
import {
  fetchPreferences,
  updatePreferences,
  fetchSubscription,
  fireTestVoice,
  fetchManagers,
  createSubscriptionPaymentLink,
  type NotificationPreferences,
  type UpdatePreferencesPatch,
  type ManagerSummary,
} from "./api";
import InAppPaymentWebView from "@shared/components/InAppPaymentWebView";
import { CustomAlert } from "@shared/components/alert";
import { useAuthStore } from "../../../../store/useAuthStore";

/**
 * Tenant-facing notification preferences. Lets the tenant toggle each
 * delivery channel (email / push / SMS / voice), pick a language, and
 * run a one-off test call.
 *
 * <p>Voice consent is implicit in the Voice toggle: ON = user agrees to
 * receive automated alert calls, OFF = revokes. We persist the toggle
 * change immediately (not on Save) so {@code voice_consent_history} gets
 * an audit row at the moment of intent — required for PDPL audit under
 * Nghị định 13/2023/NĐ-CP without forcing the user through a separate
 * consent button.
 *
 * <p>Voice + SMS are gated behind PREMIUM tier — the screen surfaces the
 * subscription status at the top and disables those toggles when the
 * tenant is on FREE.
 */
const LANGUAGES: { value: NotificationPreferences["language"]; label: string }[] = [
  { value: "vi_VN", label: "Tiếng Việt" },
  { value: "en_US", label: "English" },
  { value: "ja_JP", label: "日本語" },
];

export default function NotificationPreferencesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { houseId } = useAuthStore();

  const prefsQ = useQuery({
    queryKey: ["notif", "prefs"],
    queryFn: fetchPreferences,
  });
  const subQ = useQuery({
    queryKey: ["notif", "subscription", houseId],
    queryFn: () => fetchSubscription(houseId as string),
    enabled: !!houseId,
    refetchOnMount: "always",
    staleTime: 0,
  });
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ["notif", "subscription"] });
    }, [qc])
  );
  const managersQ = useQuery<ManagerSummary[]>({
    queryKey: ["users", "managers"],
    queryFn: fetchManagers,
    staleTime: 5 * 60_000,
  });

  const [draft, setDraft] = useState<NotificationPreferences | null>(null);
  useEffect(() => {
    if (prefsQ.data) setDraft(prefsQ.data);
  }, [prefsQ.data]);

  const isPremium =
    !!houseId &&
    subQ.data?.tier === "PREMIUM" &&
    subQ.data?.houseId === houseId;

  const saveMut = useMutation({
    mutationFn: (patch: UpdatePreferencesPatch) => updatePreferences(patch),
    onSuccess: (fresh) => {
      setDraft(fresh);
      qc.invalidateQueries({ queryKey: ["notif", "prefs"] });
      CustomAlert.alert(
        t("notif.prefs.saved", "Đã lưu cài đặt"),
        undefined,
        [{ text: t("common.close", "Đóng") }],
        { type: "success" }
      );
    },
    onError: (err: any) =>
      CustomAlert.alert(
        t("common.error", "Lỗi"),
        err?.message ?? t("common.unknown_error", "Đã xảy ra lỗi, vui lòng thử lại."),
        [{ text: t("common.close", "Đóng") }],
        { type: "error" }
      ),
  });

  const testMut = useMutation({
    mutationFn: () => fireTestVoice(),
    onSuccess: () =>
      CustomAlert.alert(
        t("notif.prefs.testTitle", "Cuộc gọi thử"),
        t("notif.prefs.testQueued", "Điện thoại của bạn sẽ đổ chuông trong giây lát."),
        [{ text: t("common.close", "Đóng") }],
        { type: "success" }
      ),
    onError: (err: any) =>
      CustomAlert.alert(
        t("common.error", "Lỗi"),
        err?.message ?? t("common.unknown_error", "Đã xảy ra lỗi, vui lòng thử lại."),
        [{ text: t("common.close", "Đóng") }],
        { type: "error" }
      ),
  });

  const [paymentWebViewUrl, setPaymentWebViewUrl] = useState<string | null>(null);
  const upgradeMut = useMutation({
    mutationFn: (months: number) => {
      if (!houseId) {
        throw new Error(t("home.premium_no_house", "Vui lòng chọn nhà trước khi mua gói."));
      }
      return createSubscriptionPaymentLink({ houseId, months });
    },
    onSuccess: (url) => {
      setPaymentWebViewUrl(url);
    },
    onError: (err: any) =>
      CustomAlert.alert(
        t("common.error", "Lỗi"),
        err?.message ?? t("common.unknown_error", "Đã xảy ra lỗi, vui lòng thử lại."),
        [{ text: t("common.close", "Đóng") }],
        { type: "error" }
      ),
  });

  const set = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  /**
   * Voice toggle doubles as PDPL consent: ON = consent granted, OFF = revoked.
   * We persist immediately on flip (instead of waiting for the global Save
   * button) so the BE writes a row in voice_consent_history at the exact
   * moment the user expressed intent — required for legal audit under
   * Nghị định 13/2023/NĐ-CP.
   */
  const onVoiceToggle = (next: boolean) => {
    set("voiceEnabled", next);
    saveMut.mutate({ voiceEnabled: next, voiceConsentGranted: next });
  };

  const submit = () => {
    if (!draft) return;
    saveMut.mutate({
      language: draft.language,
      emailEnabled: draft.emailEnabled,
      pushEnabled: draft.pushEnabled,
      smsEnabled: draft.smsEnabled,
      voiceEnabled: draft.voiceEnabled,
      quietHoursStart: draft.quietHoursStart,
      quietHoursEnd: draft.quietHoursEnd,
      quietHoursOverrideCritical: draft.quietHoursOverrideCritical,
      voiceGender: draft.voiceGender,
      voiceSpeed: draft.voiceSpeed,
      voiceMaxRetries: draft.voiceMaxRetries,
      voiceRetryIntervalSec: draft.voiceRetryIntervalSec,
      voiceRateLimitSec: draft.voiceRateLimitSec,
      dtmfAckEnabled: draft.dtmfAckEnabled,
      escalationEnabled: draft.escalationEnabled,
    });
  };

  if (prefsQ.isLoading || !draft) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={brandPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
            >
              <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>
              {t("settings.notifications_prefs_title")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription card — full status panel.
            PREMIUM: tier badge + expiry + days-left + voice/sms quota bars + renew CTA.
            FREE: tier badge + value pitch + upgrade CTA. */}
        <SubscriptionCard
          sub={subQ.data}
          upgradePending={upgradeMut.isPending}
          onUpgrade={() => upgradeMut.mutate(1)}
        />

        {/* Language */}
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          {t("notif.prefs.language", "Language")}
        </Text>
        <View style={styles.card}>
          <View style={styles.langRow}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.value}
                onPress={() => set("language", l.value)}
                style={[
                  styles.langChip,
                  draft.language === l.value && styles.langChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.langChipText,
                    draft.language === l.value && styles.langChipTextActive,
                  ]}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Channels */}
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          {t("notif.prefs.channels", "Channels")}
        </Text>
        <View style={styles.card}>
          <ChannelRow
            icon={<Icons.mail size={20} color={brandPrimary} />}
            label={t("notif.prefs.email", "Email")}
            desc={t("notif.prefs.emailDesc", "Email digests and alerts")}
            value={draft.emailEnabled}
            onChange={(v) => set("emailEnabled", v)}
          />
          <ChannelRow
            icon={<Icons.notification size={20} color={brandPrimary} />}
            label={t("notif.prefs.push", "In-app push")}
            desc={t("notif.prefs.pushDesc", "Realtime notifications when the app is open")}
            value={draft.pushEnabled}
            onChange={(v) => set("pushEnabled", v)}
          />
          <ChannelRow
            icon={<MaterialIcons name="sms" size={20} color={brandPrimary} />}
            label={t("notif.prefs.sms", "SMS")}
            desc={t("notif.prefs.smsDesc", "Text messages for CRITICAL/WARNING events")}
            value={draft.smsEnabled}
            onChange={(v) => set("smsEnabled", v)}
            disabled={!isPremium}
            hint={!isPremium ? t("notif.prefs.premiumOnly", "PREMIUM only") : undefined}
          />
          <ChannelRow
            icon={<Icons.call size={20} color={brandPrimary} />}
            label={t("notif.prefs.voice", "Voice call")}
            desc={t(
              "notif.prefs.voiceDesc",
              "Phone call reading the alert in your language"
            )}
            value={draft.voiceEnabled}
            onChange={onVoiceToggle}
            disabled={!isPremium || saveMut.isPending}
            hint={
              !isPremium
                ? t("notif.prefs.premiumOnly", "PREMIUM only")
                : undefined
            }
            isLast
          />
        </View>

        {/* Escalation target picker — pin a manager (or auto-resolve via region) */}
        {draft.escalationEnabled && (
          <>
            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
              {t("notif.prefs.escalationTarget", "Escalation target")}
            </Text>
            <View style={styles.card}>
              <Text style={styles.cardDesc}>
                {t(
                  "notif.prefs.escalationTargetHint",
                  "Leave 'Auto' to use your region manager. Or pin a specific manager below."
                )}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                <TouchableOpacity
                  onPress={() => set("escalationTargetUserId", null)}
                  style={[
                    styles.langChip,
                    !draft.escalationTargetUserId && styles.langChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langChipText,
                      !draft.escalationTargetUserId && styles.langChipTextActive,
                    ]}
                  >
                    {t("notif.prefs.escalationAuto", "Auto")}
                  </Text>
                </TouchableOpacity>
                {(managersQ.data ?? []).map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => set("escalationTargetUserId", m.id)}
                    style={[
                      styles.langChip,
                      draft.escalationTargetUserId === m.id && styles.langChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.langChipText,
                        draft.escalationTargetUserId === m.id && styles.langChipTextActive,
                      ]}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* Test voice — voice toggle ON already implies the user agreed to receive
            calls (toggle = consent under our PDPL flow). */}
        {isPremium && draft.voiceEnabled && (
          <>
            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
              {t("notif.prefs.testVoice", "Test call")}
            </Text>
            <View style={styles.card}>
              <Text style={styles.cardDesc}>
                {t(
                  "notif.prefs.testVoiceHint",
                  "One test call per day. Counts against monthly quota."
                )}
              </Text>
              <TouchableOpacity
                style={styles.btnSecondary}
                disabled={testMut.isPending}
                onPress={() => testMut.mutate()}
              >
                <Text style={styles.btnSecondaryText}>
                  {testMut.isPending
                    ? t("notif.prefs.testing", "Calling...")
                    : t("notif.prefs.fireTest", "Call me now")}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Save */}
        <TouchableOpacity
          style={styles.saveBtn}
          disabled={saveMut.isPending}
          onPress={submit}
        >
          <Text style={styles.saveBtnText}>
            {saveMut.isPending
              ? t("common.saving", "Saving...")
              : t("common.save", "Save")}
          </Text>
        </TouchableOpacity>

        {/* In-app VNPay checkout — same UX surface as Home's "Mua gói" sheet:
            gateway URL stays hidden behind a native header. */}
        <InAppPaymentWebView
          visible={paymentWebViewUrl != null}
          url={paymentWebViewUrl}
          onClose={() => setPaymentWebViewUrl(null)}
          onPaymentResult={(result) => {
            setPaymentWebViewUrl(null);
            qc.invalidateQueries({ queryKey: ["notif", "subscription"] });
            if (result.success) {
              CustomAlert.alert(
                t("payment.success_title", "Thanh toán thành công"),
                t(
                  "payment.success_desc",
                  "Gói PREMIUM sẽ được kích hoạt trong vài giây. Cảm ơn bạn!"
                ),
                [{ text: t("common.close", "Đóng") }],
                { type: "success" }
              );
            } else {
              CustomAlert.alert(
                t("payment.failed_title", "Thanh toán không thành công"),
                t(
                  "payment.failed_desc_with_code",
                  "Giao dịch chưa hoàn tất (mã {{code}}). Bạn có thể thử lại.",
                  { code: result.responseCode ?? "?" }
                ),
                [{ text: t("common.close", "Đóng") }],
                { type: "error" }
              );
            }
          }}
        />
      </ScrollView>
    </View>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function ChannelRow({
  icon,
  label,
  desc,
  value,
  onChange,
  disabled,
  hint,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.channelRow, isLast && styles.channelRowLast]}>
      <View style={styles.channelIconWrap}>{icon}</View>
      <View style={styles.channelLabelCol}>
        <Text style={[styles.channelLabel, disabled && styles.channelLabelDisabled]}>
          {label}
        </Text>
        <Text style={styles.channelDesc}>{desc}</Text>
        {hint && <Text style={styles.hintLocked}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: neutral.border, true: brandPrimary }}
      />
    </View>
  );
}

function SubLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.subRow}>
      <Text style={styles.subLabel}>{label}</Text>
      <Text style={styles.subValue}>{value}</Text>
    </View>
  );
}

/**
 * Subscription status card — single-glance summary of the tenant's tier,
 * expiry, remaining days, and quota usage. Splits into two visual modes:
 *
 * <ul>
 *   <li><b>PREMIUM</b>: amber theme + crown badge, dd/MM/yyyy expiry, days-left
 *       chip, voice + SMS usage bars, soft "Gia hạn" secondary button.</li>
 *   <li><b>FREE</b>: neutral theme, hint copy explaining what PREMIUM unlocks,
 *       prominent CTA button.</li>
 * </ul>
 *
 * Pure presentation — caller owns the upgrade mutation + UI feedback.
 */
function SubscriptionCard({
  sub,
  upgradePending,
  onUpgrade,
}: {
  sub: import("./api").SubscriptionInfo | undefined;
  upgradePending: boolean;
  onUpgrade: () => void;
}) {
  const { t } = useTranslation();
  const isPremium = sub?.tier === "PREMIUM";
  const untilStr = useMemo(() => {
    if (!sub?.premiumUntil) return null;
    try {
      const d = new Date(sub.premiumUntil);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}/${d.getFullYear()}`;
    } catch {
      return null;
    }
  }, [sub?.premiumUntil]);
  const daysLeft = useMemo(() => {
    if (!sub?.premiumUntil) return null;
    try {
      const ms = new Date(sub.premiumUntil).getTime() - Date.now();
      return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
    } catch {
      return null;
    }
  }, [sub?.premiumUntil]);

  if (isPremium) {
    return (
      <View style={[styles.card, subCardStyles.premiumCard]}>
        <View style={subCardStyles.premiumHeaderRow}>
          <View style={subCardStyles.premiumCrownCircle}>
            <Text style={{ fontSize: 16 }}>👑</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={subCardStyles.premiumTitle}>
              {t("notif.prefs.premium_active_title", "PREMIUM active")}
            </Text>
            {untilStr ? (
              <Text style={subCardStyles.premiumSubtitle}>
                {t("notif.prefs.premium_until", "Expires {{date}}", { date: untilStr })}
              </Text>
            ) : null}
          </View>
          {daysLeft != null ? (
            <View style={subCardStyles.daysLeftPill}>
              <Text style={subCardStyles.daysLeftText}>
                {t("notif.prefs.premium_days_left", "{{n}} days left", { n: daysLeft })}
              </Text>
            </View>
          ) : null}
        </View>

        <QuotaBar
          label={t("notif.prefs.voiceQuota", "Voice this month")}
          used={sub?.voiceUsedThisMonth ?? 0}
          total={sub?.voiceQuotaMonthly ?? 0}
          color={brandPrimary}
        />
        <QuotaBar
          label={t("notif.prefs.smsQuota", "SMS this month")}
          used={sub?.smsUsedThisMonth ?? 0}
          total={sub?.smsQuotaMonthly ?? 0}
          color={brandSecondary}
        />

        <TouchableOpacity
          style={[subCardStyles.renewBtn, { marginTop: 14 }]}
          onPress={onUpgrade}
          disabled={upgradePending}
          accessibilityRole="button"
        >
          <Text style={subCardStyles.renewBtnText}>
            {upgradePending
              ? t("notif.prefs.upgrading", "Processing...")
              : t("notif.prefs.renewBtn", "Extend by 1 month (19,000 VND)")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.subRow}>
        <Text style={styles.cardTitle}>
          {t("notif.prefs.subscription", "Subscription")}
        </Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierBadgeText}>FREE</Text>
        </View>
      </View>
      <Text style={styles.cardDesc}>
        {t(
          "notif.prefs.upgradeHint",
          "Upgrade to PREMIUM to receive voice calls and SMS for urgent IoT alerts."
        )}
      </Text>
      <TouchableOpacity
        style={[styles.saveBtn, { marginTop: 12 }]}
        onPress={onUpgrade}
        disabled={upgradePending}
        accessibilityRole="button"
      >
        <Text style={styles.saveBtnText}>
          {upgradePending
            ? t("notif.prefs.upgrading", "Processing...")
            : t("notif.prefs.upgradeBtn", "Buy PREMIUM (19,000 VND/month)")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function QuotaBar({
  label,
  used,
  total,
  color,
}: {
  label: string;
  used: number;
  total: number;
  color: string;
}) {
  const safeTotal = Math.max(1, total);
  const ratio = Math.min(1, Math.max(0, used / safeTotal));
  const remaining = Math.max(0, total - used);
  return (
    <View style={styles.quotaBar}>
      <View style={styles.quotaBarHeader}>
        <Text style={styles.quotaLabel}>{label}</Text>
        <Text style={styles.quotaValue}>
          {used}/{total} · {remaining} left
        </Text>
      </View>
      <View style={styles.quotaTrack}>
        <View style={[styles.quotaFill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const subCardStyles = StyleSheet.create({
  premiumCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#F59E0B",
    borderWidth: 1.5,
  },
  premiumHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumCrownCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumTitle: {
    ...appTypography.itemTitle,
    fontWeight: "800",
    color: "#92400E",
  },
  premiumSubtitle: {
    ...appTypography.caption,
    color: "#B45309",
    marginTop: 2,
  },
  daysLeftPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F59E0B",
  },
  daysLeftText: {
    ...appTypography.captionStrong,
    color: "#fff",
  },
  renewBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  renewBtnText: {
    ...appTypography.buttonLabel,
    color: "#92400E",
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 96,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    ...appTypography.captionStrong,
    color: neutral.textSecondary,
    marginBottom: 10,
    marginLeft: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionTitleSpaced: {
    marginTop: 24,
  },
  card: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 16,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    ...appTypography.itemTitle,
    color: neutral.textBody,
    fontWeight: "700",
  },
  cardDesc: {
    ...appTypography.secondary,
    color: neutral.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  subLabel: {
    ...appTypography.body,
    color: neutral.textBody,
  },
  subValue: {
    ...appTypography.body,
    color: neutral.textBody,
    fontWeight: "600",
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: neutral.background,
  },
  tierBadgeText: {
    ...appTypography.captionStrong,
    color: neutral.textSecondary,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: neutral.borderMuted,
  },
  channelRowLast: {
    borderBottomWidth: 0,
  },
  channelIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: brandTintBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  channelLabelCol: {
    flex: 1,
    paddingRight: 12,
    minWidth: 0,
  },
  channelLabel: {
    ...appTypography.itemTitle,
    color: neutral.textBody,
    fontWeight: "700",
  },
  channelLabelDisabled: {
    color: neutral.textMuted,
  },
  channelDesc: {
    ...appTypography.secondary,
    color: neutral.textMuted,
    marginTop: 2,
  },
  hintLocked: {
    ...appTypography.caption,
    color: "#B45309",
    marginTop: 2,
  },
  langRow: {
    flexDirection: "row",
    gap: 8,
  },
  langChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: neutral.border,
    backgroundColor: neutral.surface,
  },
  langChipActive: {
    backgroundColor: brandTintBg,
    borderColor: brandPrimary,
  },
  langChipText: {
    ...appTypography.secondary,
    color: neutral.textBody,
  },
  langChipTextActive: {
    color: brandPrimary,
    fontWeight: "700",
  },
  chipScroll: {
    paddingVertical: 8,
    gap: 8,
  },
  quotaBar: {
    marginTop: 12,
  },
  quotaBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  quotaLabel: {
    ...appTypography.captionStrong,
    color: neutral.textBody,
  },
  quotaValue: {
    ...appTypography.caption,
    color: neutral.textSecondary,
  },
  quotaTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: neutral.background,
    overflow: "hidden",
  },
  quotaFill: {
    height: 6,
    borderRadius: 999,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    marginTop: 24,
    backgroundColor: brandPrimary,
  },
  saveBtnText: {
    ...appTypography.buttonLabel,
    color: neutral.surface,
  },
  btnSecondary: {
    paddingVertical: 12,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: brandTintBg,
  },
  btnSecondaryText: {
    ...appTypography.buttonLabel,
    color: brandPrimary,
  },
});
