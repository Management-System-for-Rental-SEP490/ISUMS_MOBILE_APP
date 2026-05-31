import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { brandPrimary, brandTintBg, neutral } from "@shared/theme/color";
import { appTypography } from "@shared/utils/typography";
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
      Alert.alert(t("notif.prefs.saved", "Saved"));
    },
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed"),
  });

  const testMut = useMutation({
    mutationFn: () => fireTestVoice(),
    onSuccess: () =>
      Alert.alert(
        t("notif.prefs.testTitle", "Test call"),
        t("notif.prefs.testQueued", "Your phone will ring shortly.")
      ),
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed"),
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
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed"),
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
    <ScrollView contentContainerStyle={styles.container}>
      {/* Subscription card — full status panel.
          PREMIUM: tier badge + expiry + days-left + voice/sms quota bars + renew CTA.
          FREE: tier badge + value pitch + upgrade CTA. */}
      <SubscriptionCard
        sub={subQ.data}
        upgradePending={upgradeMut.isPending}
        onUpgrade={() => upgradeMut.mutate(1)}
      />

      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.h3}>{t("notif.prefs.language", "Language")}</Text>
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
      <View style={styles.card}>
        <Text style={styles.h3}>{t("notif.prefs.channels", "Channels")}</Text>
        <ChannelRow
          label={t("notif.prefs.email", "Email")}
          desc={t("notif.prefs.emailDesc", "Email digests + alerts")}
          value={draft.emailEnabled}
          onChange={(v) => set("emailEnabled", v)}
        />
        <ChannelRow
          label={t("notif.prefs.push", "Push")}
          desc={t("notif.prefs.pushDesc", "Realtime in-app notifications")}
          value={draft.pushEnabled}
          onChange={(v) => set("pushEnabled", v)}
        />
        <ChannelRow
          label={t("notif.prefs.sms", "SMS")}
          desc={t(
            "notif.prefs.smsDesc",
            "Text messages for CRITICAL/WARNING events"
          )}
          value={draft.smsEnabled}
          onChange={(v) => set("smsEnabled", v)}
          disabled={!isPremium}
          hint={!isPremium ? t("notif.prefs.premiumOnly", "PREMIUM only") : undefined}
        />
        <ChannelRow
          label={t("notif.prefs.voice", "Cuộc gọi tự động")}
          desc={t(
            "notif.prefs.voiceDesc",
            "Bật để chúng tôi gọi điện đọc cảnh báo IoT khẩn cấp bằng giọng nói (gas, cháy, mất điện, rò nước). Tắt bất kỳ lúc nào."
          )}
          value={draft.voiceEnabled}
          onChange={onVoiceToggle}
          disabled={!isPremium || saveMut.isPending}
          hint={
            !isPremium
              ? t("notif.prefs.premiumOnly", "Chỉ dành cho PREMIUM")
              : undefined
          }
        />
      </View>

      {/* Escalation target picker — pin a manager (or auto-resolve via region) */}
      {draft.escalationEnabled && (
        <View style={styles.card}>
          <Text style={styles.h3}>
            {t("notif.prefs.escalationTarget", "Escalation target")}
          </Text>
          <Text style={styles.hint}>
            {t(
              "notif.prefs.escalationTargetHint",
              "Leave 'Auto' to use your region manager. Or pin a specific manager below."
            )}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8, gap: 8 }}
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
                {t("notif.prefs.escalationAuto", "Auto (region manager)")}
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
      )}

      {/* Test voice — voice toggle ON already implies the user agreed to receive
          calls (toggle = consent under our PDPL flow). */}
      {isPremium && draft.voiceEnabled && (
        <View style={styles.card}>
          <Text style={styles.h3}>{t("notif.prefs.testVoice", "Test call")}</Text>
          <Text style={styles.hint}>
            {t(
              "notif.prefs.testVoiceHint",
              "One test call per day. Counts against monthly quota."
            )}
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
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
      )}

      {/* Save */}
      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary, styles.saveBtn]}
        disabled={saveMut.isPending}
        onPress={submit}
      >
        <Text style={styles.btnPrimaryText}>
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
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function ChannelRow({
  label,
  desc,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.channelRow}>
      <View style={styles.channelLabelCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{desc}</Text>
        {hint && <Text style={styles.hintLocked}>🔒 {hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: "#d1d5db", true: brandPrimary }}
      />
    </View>
  );
}

function SubLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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
              {t("notif.prefs.premium_active_title", "PREMIUM đang hoạt động")}
            </Text>
            {untilStr ? (
              <Text style={subCardStyles.premiumSubtitle}>
                {t("notif.prefs.premium_until", "Hết hạn {{date}}", { date: untilStr })}
              </Text>
            ) : null}
          </View>
          {daysLeft != null ? (
            <View style={subCardStyles.daysLeftPill}>
              <Text style={subCardStyles.daysLeftText}>
                {t("notif.prefs.premium_days_left", "Còn {{n}} ngày", { n: daysLeft })}
              </Text>
            </View>
          ) : null}
        </View>

        <QuotaBar
          label={t("notif.prefs.voiceQuota", "Cuộc gọi tháng này")}
          used={sub?.voiceUsedThisMonth ?? 0}
          total={sub?.voiceQuotaMonthly ?? 0}
          color="#7C3AED"
        />
        <QuotaBar
          label={t("notif.prefs.smsQuota", "SMS tháng này")}
          used={sub?.smsUsedThisMonth ?? 0}
          total={sub?.smsQuotaMonthly ?? 0}
          color="#2563EB"
        />

        <TouchableOpacity
          style={[styles.btn, subCardStyles.renewBtn, { marginTop: 14 }]}
          onPress={onUpgrade}
          disabled={upgradePending}
          accessibilityRole="button"
        >
          <Text style={subCardStyles.renewBtnText}>
            {upgradePending
              ? t("notif.prefs.upgrading", "Đang xử lý...")
              : t("notif.prefs.renewBtn", "Gia hạn thêm 1 tháng (19.000đ)")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.h3}>
          {t("notif.prefs.subscription", "Gói đăng ký")}
        </Text>
        <Text style={styles.tierBadge}>FREE</Text>
      </View>
      <Text style={styles.hint}>
        {t(
          "notif.prefs.upgradeHint",
          "Nâng cấp PREMIUM để nhận cuộc gọi và SMS khi có cảnh báo IoT khẩn cấp (ngập, mất điện, gas rò rỉ...)."
        )}
      </Text>
      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary, { marginTop: 12 }]}
        onPress={onUpgrade}
        disabled={upgradePending}
        accessibilityRole="button"
      >
        <Text style={styles.btnPrimaryText}>
          {upgradePending
            ? t("notif.prefs.upgrading", "Đang xử lý...")
            : t("notif.prefs.upgradeBtn", "Mua gói PREMIUM (19.000đ/tháng)")}
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
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: neutral.text, fontWeight: "600" }}>{label}</Text>
        <Text style={{ fontSize: 12, color: neutral.textSecondary }}>
          {used}/{total} · còn {remaining}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 999,
          backgroundColor: "#F3F4F6",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${ratio * 100}%`,
            height: 6,
            backgroundColor: color,
            borderRadius: 999,
          }}
        />
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#92400E",
  },
  premiumSubtitle: {
    fontSize: 12,
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
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  renewBtn: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  renewBtnText: {
    color: "#92400E",
    fontWeight: "700",
  },
});

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 64 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: brandTintBg,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  // Theme map: titleSmall → sectionHeading (16/700), bodyMedium → body (14/400),
  // bodySmall → secondary (13/400). Color tokens: ink → text, muted → textMuted.
  h3: { ...appTypography.sectionHeading, color: neutral.text, marginBottom: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: { ...appTypography.body, color: neutral.text },
  value: { ...appTypography.body, color: neutral.text, fontWeight: "600" },
  hint: { ...appTypography.secondary, color: neutral.textMuted, marginTop: 4 },
  hintLocked: { ...appTypography.secondary, color: "#92400E", marginTop: 2 },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "#F3F4F6",
    color: "#374151",
    overflow: "hidden",
  },
  tierPremium: { backgroundColor: "#FEF3C7", color: "#92400E" },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  channelLabelCol: { flex: 1, paddingRight: 12 },
  langRow: { flexDirection: "row", gap: 8 },
  langChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brandTintBg,
    backgroundColor: "#fff",
  },
  langChipActive: { backgroundColor: brandTintBg, borderColor: brandPrimary },
  langChipText: { color: neutral.text },
  langChipTextActive: { color: brandPrimary, fontWeight: "700" },
  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  btnPrimary: { backgroundColor: brandPrimary },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnSecondary: { backgroundColor: brandTintBg },
  btnSecondaryText: { color: brandPrimary, fontWeight: "700" },
  btnDanger: { backgroundColor: "#FEE2E2" },
  btnDangerText: { color: "#B91C1C", fontWeight: "700" },
  saveBtn: { marginTop: 18 },
});
