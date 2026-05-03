/**
 * Card dự báo AI cuối tháng — phong cách AWS Cost Forecast: 1 con số headline là
 * tổng dự kiến cuối tháng, không chart theo ngày/tuần.
 *
 * Narrative (production-grade):
 *   1. Headline = tổng cuối tháng dự kiến (số lớn), label "Dự kiến cuối tháng".
 *   2. Lead line = "Còn dùng thêm X (±Y) trong Z ngày" — dự báo thật sự.
 *   3. Stacked bar used + forecast remaining — minh hoạ 2 đoạn cấu thành total,
 *      không phải progress bar/budget.
 *   4. Insight: so với ngày trung bình đầu tháng (nếu chênh ≥10%).
 *   5. Info collapsible: method + trainingRows + confidence range + updated time.
 *
 * State: loading / error / empty / month-ended / ready.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { neutral } from "../../../../shared/theme/color";
import type { ForecastScopeDto } from "../../../../shared/types/api";
import { tenantSoftCard } from "../../../../shared/styles/tenantSoftCard";

export type ForecastCardProps = {
  /** Dữ liệu từ BE. null = chưa có dự báo (empty). */
  data: ForecastScopeDto | null;
  loading: boolean;
  /** Lỗi fetch (network/5xx/parse). null → không lỗi. */
  error?: string | null;
  /** Gọi khi user tap "thử lại" ở error state. */
  onRetry?: () => void;
  /** Màu chủ đạo theo metric (Electric = brandPrimary, Water = waterAccent). */
  accent: string;
  /** "kWh" / "L" — dùng cho UI, khác `data.unit` ("kwh"/"liters"). */
  displayUnit: string;
  /** Tên scope để hiển thị — "Toàn nhà" hoặc tên khu vực đang chọn. */
  scopeLabel: string;
};

/** Forecast cũ hơn ngưỡng này → badge "outdated". Prophet job thường chạy 1x/ngày. */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function usePulseOpacity(): Animated.Value {
  const op = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0.7, duration: 650, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.3, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  return op;
}

function safeFiniteNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function fmtNum(v: number | null | undefined, d = 1): string {
  if (v == null || Number.isNaN(v) || !Number.isFinite(v)) return "—";
  return v.toFixed(d);
}

type TFn = ReturnType<typeof useTranslation>["t"];

function fmtAgo(ts: number | null | undefined, t: TFn): string {
  if (!ts || ts <= 0) return "";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return t("consumption.forecast_updated_seconds", { n: s });
  const m = Math.round(s / 60);
  if (m < 60) return t("consumption.forecast_updated_minutes", { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t("consumption.forecast_updated_hours", { n: h });
  const d = Math.round(h / 24);
  return t("consumption.forecast_updated_days", { n: d });
}

/**
 * Quality tier cho tenant — gộp 5 method BE thành 3 nhóm user-friendly:
 *  - "reliable" (Prophet week/month): dot xanh.
 *  - "provisional" (estimate_b/run_rate): dot vàng, "ước tính".
 *  - "warmup" (naive_mtd): dot cam/đỏ, "đang học dữ liệu".
 */
type TierQuality = "reliable" | "provisional" | "warmup";
function tierQuality(status: string | undefined, method: string | undefined): TierQuality {
  const s = (status ?? "").toUpperCase();
  const m = (method ?? "").toLowerCase();
  if (s === "MODEL_MONTHLY" || s === "MODEL_WEEKLY" || m.startsWith("prophet_")) return "reliable";
  if (s === "ESTIMATE" || s === "RUN_RATE" || m === "estimate_b" || m === "run_rate") return "provisional";
  return "warmup";
}

const SkelBar = ({
  width,
  height,
  op,
  mt = 0,
}: {
  width: number | `${number}%`;
  height: number;
  op?: Animated.Value;
  mt?: number;
}) => (
  <Animated.View
    style={[
      {
        width,
        height,
        borderRadius: 8,
        backgroundColor: neutral.slate200,
        marginTop: mt,
      },
      op ? { opacity: op } : null,
    ]}
  />
);

const ForecastCard = ({
  data,
  loading,
  error,
  onRetry,
  accent,
  displayUnit,
  scopeLabel,
}: ForecastCardProps) => {
  const { t, i18n } = useTranslation();
  const pulseOpacity = usePulseOpacity();

  const [showDetails, setShowDetails] = useState<boolean>(false);
  const toggleDetails = useCallback(() => setShowDetails((s) => !s), []);

  const monthCaption = useMemo(() => {
    try {
      return new Date().toLocaleDateString(i18n.language, { month: "long", year: "numeric" });
    } catch {
      return new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
    }
  }, [i18n.language]);

  // ── Loading
  if (loading) {
    return (
      <View
        style={[styles.card, { borderLeftColor: accent }]}
        accessibilityRole="summary"
        accessibilityLabel={t("consumption.forecast_title")}
        accessibilityState={{ busy: true }}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{t("consumption.forecast_title")}</Text>
            <SkelBar width={140} height={14} op={pulseOpacity} mt={6} />
          </View>
          <SkelBar width={70} height={20} op={pulseOpacity} />
        </View>
        <SkelBar width="45%" height={14} op={pulseOpacity} mt={14} />
        <SkelBar width="60%" height={38} op={pulseOpacity} mt={6} />
        <SkelBar width="90%" height={13} op={pulseOpacity} mt={12} />
        <SkelBar width="100%" height={10} op={pulseOpacity} mt={14} />
      </View>
    );
  }

  // ── Error
  if (error) {
    return (
      <View
        style={[styles.card, { borderLeftColor: accent }]}
        accessibilityRole="alert"
        accessibilityLabel={t("consumption.forecast_error")}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{t("consumption.forecast_title")}</Text>
            <Text style={styles.scopeLine} numberOfLines={1}>
              {scopeLabel} · {monthCaption}
            </Text>
          </View>
        </View>
        <Text style={styles.errorTxt}>{t("consumption.forecast_error")}</Text>
        <Text style={styles.mutedBody}>{t("consumption.forecast_error_hint")}</Text>
        {onRetry ? (
          <TouchableOpacity
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={t("consumption.forecast_retry")}
            style={styles.retryTouch}
          >
            <Text style={[styles.retryTxt, { color: accent }]}>
              {t("consumption.forecast_retry")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  // ── Empty (BE 404 hoặc trainingRows=0)
  const isEmpty =
    !data ||
    (data.trainingRows ?? 0) < 1 ||
    (!Number.isFinite(data.totalEstimate) && !Number.isFinite(data.forecastRemaining));
  if (isEmpty) {
    return (
      <View
        style={[styles.card, { borderLeftColor: accent }]}
        accessibilityRole="summary"
        accessibilityLabel={t("consumption.forecast_empty")}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{t("consumption.forecast_title")}</Text>
            <Text style={styles.scopeLine}>
              {scopeLabel} · {monthCaption}
            </Text>
          </View>
        </View>
        <Text style={styles.emptyTxt}>{t("consumption.forecast_empty")}</Text>
        <Text style={styles.mutedBody}>{t("consumption.forecast_empty_hint")}</Text>
      </View>
    );
  }

  // ── Numeric guards
  const used = Math.max(0, safeFiniteNumber(data.usedSoFar));
  const remaining = Math.max(0, safeFiniteNumber(data.forecastRemaining));
  const total = Math.max(used + remaining, safeFiniteNumber(data.totalEstimate, used + remaining));
  const confLower = Math.max(0, safeFiniteNumber(data.confidenceLower, used));
  const confUpper = Math.max(confLower, safeFiniteNumber(data.confidenceUpper, total));
  const band = Math.max(0, confUpper - confLower);
  const plusMinus = band / 2;
  const daysLeft = Math.max(0, Math.round(safeFiniteNumber(data.daysLeft)));
  const trainingRows = Math.max(0, Math.round(safeFiniteNumber(data.trainingRows)));
  const forecastedAt = safeFiniteNumber(data.forecastedAt);
  const isStale = forecastedAt > 0 && Date.now() - forecastedAt > STALE_THRESHOLD_MS;
  const ago = fmtAgo(forecastedAt, t);

  // ── Month-ended: chỉ show tổng đã dùng
  if (daysLeft === 0) {
    return (
      <View style={[styles.card, { borderLeftColor: accent }]} accessibilityRole="summary">
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>{t("consumption.forecast_title")}</Text>
            <Text style={styles.scopeLine} numberOfLines={1}>
              {scopeLabel} · {monthCaption}
            </Text>
          </View>
        </View>
        <Text style={styles.headlineLabel}>{t("consumption.forecast_actual_label")}</Text>
        <View style={styles.headlineRow}>
          <Text
            style={[styles.headlineNum, { color: accent }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {fmtNum(used, 1)}
          </Text>
          <Text style={styles.headlineUnit}>{displayUnit}</Text>
        </View>
        <Text style={styles.mutedBody}>{t("consumption.forecast_month_ended")}</Text>
      </View>
    );
  }

  // Quality (để gate insight line — không render chip nữa theo yêu cầu UI). Trend: chỉ show khi BE thực trả up/down.
  const quality = tierQuality(data.status, data.method);
  const trendRaw = (data.trend ?? "").toLowerCase();
  const showTrend = trendRaw === "up" || trendRaw === "down";

  // ── Daily averages so sánh
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const observedDays = Math.max(1, daysInMonth - daysLeft);
  const dailyAvgSoFar = used / observedDays;
  const dailyAvgForecast = daysLeft > 0 ? remaining / daysLeft : 0;
  const dailyDeltaPct =
    dailyAvgSoFar > 0 ? ((dailyAvgForecast - dailyAvgSoFar) / dailyAvgSoFar) * 100 : 0;

  // ── Stacked bar: used + remaining (2 đoạn cấu thành total — không phải budget)
  const usedPct = total > 0 ? (used / total) * 100 : 100;
  const remainingPct = Math.max(0, 100 - usedPct);

  const a11yLabel = [
    t("consumption.forecast_title"),
    scopeLabel,
    monthCaption,
    t("consumption.forecast_projected_total_a11y", {
      total: fmtNum(total, 1),
      unit: displayUnit,
    }),
    t("consumption.forecast_remaining_a11y", {
      remaining: fmtNum(remaining, 1),
      unit: displayUnit,
      n: daysLeft,
    }),
  ].join(". ");

  return (
    <View
      style={[styles.card, { borderLeftColor: accent }]}
      accessibilityRole="summary"
      accessibilityLabel={a11yLabel}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.kicker}>{t("consumption.forecast_title")}</Text>
          <Text style={styles.scopeLine} numberOfLines={1}>
            {scopeLabel} · {monthCaption}
          </Text>
        </View>
        {isStale ? (
          <View style={styles.staleBadge} accessibilityLabel={t("consumption.forecast_stale")}>
            <Text style={styles.staleTxt}>{t("consumption.forecast_stale")}</Text>
          </View>
        ) : null}
      </View>

      {/* Headline: tổng cuối tháng dự kiến */}
      <Text style={styles.headlineLabel}>{t("consumption.forecast_projected_label")}</Text>
      <View style={styles.headlineRow}>
        <Text
          style={[styles.headlineNum, { color: accent }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {fmtNum(total, 1)}
        </Text>
        <Text style={styles.headlineUnit}>{displayUnit}</Text>
        {showTrend ? (
          <View style={styles.trendPill}>
            <Text
              style={[
                styles.trendArrow,
                { color: trendRaw === "up" ? "#DC2626" : "#16A34A" },
              ]}
            >
              {trendRaw === "up" ? "↑" : "↓"}
            </Text>
            <Text
              style={[
                styles.trendTxt,
                { color: trendRaw === "up" ? "#DC2626" : "#16A34A" },
              ]}
            >
              {t(
                trendRaw === "up"
                  ? "consumption.forecast_trend.up"
                  : "consumption.forecast_trend.down"
              )}
            </Text>
          </View>
        ) : null}
      </View>
      {plusMinus > 0.05 ? (
        <Text style={styles.uncertaintyLine}>
          {t("consumption.forecast_uncertainty", {
            pm: fmtNum(plusMinus, 1),
            unit: displayUnit,
          })}
        </Text>
      ) : null}

      {/* Lead: "Còn dùng thêm X trong N ngày" */}
      <Text style={styles.leadLine}>
        {t("consumption.forecast_lead", {
          remaining: fmtNum(remaining, 1),
          unit: displayUnit,
          n: daysLeft,
        })}
      </Text>

      {/* Stacked bar: used + remaining (2 đoạn, không phải progress) */}
      <View
        style={styles.stackTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: Math.round(total * 10) / 10,
          now: Math.round(used * 10) / 10,
        }}
      >
        <View style={[styles.stackUsed, { width: `${usedPct}%`, backgroundColor: accent }]} />
        <View
          style={[
            styles.stackRemaining,
            { width: `${remainingPct}%`, backgroundColor: `${accent}4D` },
          ]}
        />
      </View>
      <View style={styles.stackLegend}>
        <View style={styles.stackLegendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: accent }]} />
          <Text style={styles.legendSwatchTxt}>
            {t("consumption.forecast_used_label", {
              n: fmtNum(used, 1),
              unit: displayUnit,
            })}
          </Text>
        </View>
        <View style={styles.stackLegendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: `${accent}4D` }]} />
          <Text style={styles.legendSwatchTxt}>
            {t("consumption.forecast_remaining_label", {
              n: fmtNum(remaining, 1),
              unit: displayUnit,
            })}
          </Text>
        </View>
      </View>

      {/* Insight ngày trung bình — chỉ show khi đáng chú ý + chất lượng đủ tin cậy */}
      {dailyAvgSoFar > 0.01 && Math.abs(dailyDeltaPct) >= 10 && quality !== "warmup" ? (
        <Text style={styles.insightLine}>
          {dailyDeltaPct > 0
            ? t("consumption.forecast_insight_higher", {
                pct: Math.abs(dailyDeltaPct).toFixed(0),
                avg: fmtNum(dailyAvgSoFar, 1),
                unit: displayUnit,
              })
            : t("consumption.forecast_insight_lower", {
                pct: Math.abs(dailyDeltaPct).toFixed(0),
                avg: fmtNum(dailyAvgSoFar, 1),
                unit: displayUnit,
              })}
        </Text>
      ) : null}

      {/* Info toggle — tech details thu gọn */}
      <TouchableOpacity
        onPress={toggleDetails}
        accessibilityRole="button"
        accessibilityState={{ expanded: showDetails }}
        accessibilityLabel={t("consumption.forecast_details_toggle")}
        style={styles.detailsToggle}
      >
        <Text style={styles.detailsToggleTxt}>
          {showDetails
            ? t("consumption.forecast_hide_details")
            : t("consumption.forecast_show_details")}
        </Text>
      </TouchableOpacity>

      {showDetails ? (
        <View style={styles.detailsBlock}>
          <DetailRow
            label={t("consumption.forecast_detail_method")}
            value={t(`consumption.forecast_method.${data.method}`, {
              defaultValue: data.method,
            })}
          />
          <DetailRow
            label={t("consumption.forecast_detail_training")}
            value={t("consumption.forecast_training_rows", { n: trainingRows })}
          />
          <DetailRow
            label={t("consumption.forecast_detail_confidence")}
            value={`${fmtNum(confLower, 1)} – ${fmtNum(confUpper, 1)} ${displayUnit}`}
          />
          {ago ? (
            <DetailRow label={t("consumption.forecast_detail_updated")} value={ago} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderLeftWidth: 4,
    ...tenantSoftCard,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: neutral.slate500,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  scopeLine: {
    fontSize: 13,
    fontWeight: "600",
    color: neutral.slate900,
    marginTop: 4,
  },
  staleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  staleTxt: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400E",
    letterSpacing: 0.25,
  },
  headlineLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: neutral.slate500,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 14,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  headlineNum: { fontSize: 34, fontWeight: "900", letterSpacing: -0.6, flexShrink: 1 },
  headlineUnit: { fontSize: 16, fontWeight: "700", color: neutral.slate500 },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: neutral.backgroundElevated,
    borderWidth: 1,
    borderColor: neutral.borderMuted,
  },
  trendArrow: { fontSize: 13, fontWeight: "900" },
  trendTxt: { fontSize: 11, fontWeight: "700" },
  uncertaintyLine: {
    fontSize: 12,
    fontWeight: "600",
    color: neutral.slate500,
    marginTop: 4,
  },
  leadLine: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.slate900,
    marginTop: 12,
    lineHeight: 20,
  },
  stackTrack: {
    flexDirection: "row",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: neutral.slate200,
    marginTop: 14,
  },
  stackUsed: { height: "100%" },
  stackRemaining: { height: "100%" },
  stackLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 8,
  },
  stackLegendItem: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendSwatchTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: neutral.slate700,
    flexShrink: 1,
  },
  insightLine: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
    marginTop: 12,
    lineHeight: 18,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  detailsToggle: { marginTop: 14, alignSelf: "flex-start" },
  detailsToggleTxt: {
    fontSize: 12,
    fontWeight: "700",
    color: neutral.slate500,
    letterSpacing: 0.25,
  },
  detailsBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: neutral.borderMuted,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: neutral.slate500,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "700",
    color: neutral.slate900,
    flexShrink: 1,
    textAlign: "right",
  },
  emptyTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: neutral.slate900,
    marginTop: 12,
  },
  mutedBody: {
    fontSize: 12,
    fontWeight: "500",
    color: neutral.slate500,
    marginTop: 4,
    lineHeight: 18,
  },
  errorTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: "#991B1B",
    marginTop: 12,
  },
  retryTouch: { marginTop: 10, alignSelf: "flex-start" },
  retryTxt: {
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});

export default React.memo(ForecastCard);
