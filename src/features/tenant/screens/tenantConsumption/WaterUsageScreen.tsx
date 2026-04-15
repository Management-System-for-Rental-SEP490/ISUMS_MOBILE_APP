import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Header from "../../../../shared/components/header";
import {
  useTenantContext,
  useAreasUsageDistribution,
  useRefreshControlGate,
} from "../../../../shared/hooks";
import {
  PullToRefreshControl,
  RefreshLogoInline,
  RefreshLogoOverlay,
} from "@shared/components/RefreshLogoOverlay";
import {
  useTenantIoTConnection,
  useAreaTelemetry,
  useTenantUsage,
} from "../../hooks/useTenantIoT";
import {
  waterAccent,
  waterTintBg,
  neutral,
  BRAND_DANGER,
  consumptionAreaDistributionColorsWater,
  consumptionTelemetryMetric,
  iotConnectionBadge,
} from "../../../../shared/theme/color";
import {
  formatDayMonthNumeric,
  getTenantAccessBlock,
  translateTenantAccessReason,
} from "../../../../shared/utils";
import {
  waterUsageLiveBadgeStyles as lb,
  waterUsageAreaTabStyles as at,
  waterUsageHeroStyles as hc,
  waterUsageMetricStyles as met,
  waterUsageCardStyles as cd,
  waterUsageCardHeaderStyles as ch,
  waterUsageMonitoringSkeletonStyles as sk,
  waterUsageScreenIoTStyles as styles,
  waterUsageGateStyles as gateStyles,
} from "./waterUsageStyles";

const ACCENT = waterAccent;
const BG = neutral.background;
const T2 = neutral.slate500;
const BDR = neutral.borderMuted;
const AREA_COLORS = [...consumptionAreaDistributionColorsWater];
const DIST_PAGE_SIZE = 5;

function fmt(v?: number | null, d = 1) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toFixed(d);
}

function usePulse() {
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

const Skel = ({
  w, h, r = 8, mt = 0,
}: { w: number | `${number}%`; h: number; r?: number; mt?: number }) => {
  const op = usePulse();
  return (
    <Animated.View
      style={{
        width: w,
        height: h,
        borderRadius: r,
        backgroundColor: neutral.slate200,
        opacity: op,
        marginTop: mt,
      }}
    />
  );
};

const LiveBadge = ({ on }: { on: boolean }) => {
  const { t } = useTranslation();
  return (
    <View
      style={[
        lb.wrap,
        {
          backgroundColor: on
            ? iotConnectionBadge.onBackground
            : iotConnectionBadge.offBackground,
        },
      ]}
    >
      <View
        style={[
          lb.dot,
          { backgroundColor: on ? iotConnectionBadge.onDot : iotConnectionBadge.offDot },
        ]}
      />
      <Text
        style={[
          lb.txt,
          { color: on ? iotConnectionBadge.onLabel : iotConnectionBadge.offLabel },
        ]}
      >
        {on ? t("consumption.iot_live") : t("consumption.iot_offline")}
      </Text>
    </View>
  );
};

const AreaTabs = ({
  chips,
  selected,
  accent,
  tintBg,
  onSelect,
}: {
  chips: { id: string; label: string }[];
  selected: string;
  accent: string;
  tintBg: string;
  onSelect: (id: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <View style={at.cardWrap}>
      <Text style={at.sectionLabel}>{t("consumption.area_filter_section")}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={at.scroll}
        contentContainerStyle={at.content}
      >
        {chips.map((c) => {
          const active = selected === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[
                at.chip,
                active && {
                  backgroundColor: tintBg,
                  borderColor: accent,
                },
              ]}
              onPress={() => onSelect(c.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  at.chipText,
                  { color: active ? accent : T2, fontWeight: active ? "800" : "600" },
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const HeroCard = ({
  label,
  dayVal,
  weekVal,
  monthVal,
  unit,
  accent,
  loading,
  periodDay,
  periodWeek,
  periodMonth,
}: {
  label: string;
  dayVal: number;
  weekVal: number;
  monthVal: number;
  unit: string;
  accent: string;
  loading: boolean;
  periodDay: string;
  periodWeek: string;
  periodMonth: string;
}) => (
  <View style={[hc.card, { borderLeftColor: accent }]}>
    <Text style={hc.label}>{label}</Text>
    <View style={hc.row}>
      {loading ? (
        <>
          <View style={hc.cell}><Skel w={52} h={28} /><Skel w={36} h={11} mt={6} /></View>
          <View style={hc.divider} />
          <View style={hc.cell}><Skel w={52} h={28} /><Skel w={36} h={11} mt={6} /></View>
          <View style={hc.divider} />
          <View style={hc.cell}><Skel w={52} h={28} /><Skel w={36} h={11} mt={6} /></View>
        </>
      ) : (
        <>
          <View style={hc.cell}>
            <Text style={hc.period}>{periodDay}</Text>
            <Text style={[hc.val, { color: accent }]}>
              {dayVal.toFixed(1)}<Text style={hc.unit}> {unit}</Text>
            </Text>
          </View>
          <View style={hc.divider} />
          <View style={hc.cell}>
            <Text style={hc.period}>{periodWeek}</Text>
            <Text style={hc.val}>
              {weekVal.toFixed(1)}<Text style={hc.unit}> {unit}</Text>
            </Text>
          </View>
          <View style={hc.divider} />
          <View style={hc.cell}>
            <Text style={hc.period}>{periodMonth}</Text>
            <Text style={hc.val}>
              {monthVal.toFixed(1)}<Text style={hc.unit}> {unit}</Text>
            </Text>
          </View>
        </>
      )}
    </View>
  </View>
);

const Metric = ({
  icon, label, value, valueColor,
}: { icon: string; label: string; value: string; valueColor?: string }) => (
  <View style={met.wrap}>
    <Text style={met.icon}>{icon}</Text>
    <View style={met.body}>
      <Text style={met.label}>{label}</Text>
      <Text style={[met.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  </View>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={cd.card}>{children}</View>
);

const CardHeader = ({
  title, subtitle, right,
}: { title: string; subtitle?: string; right?: React.ReactNode }) => (
  <View style={ch.wrap}>
    <View style={ch.left}>
      <Text style={ch.title}>{title}</Text>
      {subtitle ? <Text style={ch.sub}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>
);

export type WaterUsageScreenProps = { showHeader?: boolean };

const WaterUsageScreen = ({ showHeader = true }: WaterUsageScreenProps) => {
  const { t, i18n } = useTranslation();
  const { houseId, functionalAreas, thingId, iotNodes, house } = useTenantContext();
  const accessBlock = useMemo(() => (house ? getTenantAccessBlock(house) : null), [house]);
  const iotConnected = useTenantIoTConnection(thingId);
  const { scrollAtTop, onScrollForRefreshGate } = useRefreshControlGate();

  const areasWithNode = useMemo(() => {
    const areas = Array.isArray(functionalAreas) ? functionalAreas : [];
    if (!iotNodes.length) return areas;
    return areas.filter((a) =>
      iotNodes.some(
        (n) => n.areaName?.trim().toLowerCase() === a.name?.trim().toLowerCase()
      )
    );
  }, [functionalAreas, iotNodes]);

  const areaChips = useMemo(() => {
    const chips = [{ id: "all", label: t("consumption.area_all_house") }];
    areasWithNode.forEach((a) => chips.push({ id: a.id, label: a.name }));
    return chips;
  }, [areasWithNode, t]);

  const [selectedAreaId, setSelectedAreaId] = useState("all");
  const isHouseLevel = selectedAreaId === "all";
  const activeAreaId = isHouseLevel ? null : selectedAreaId;

  const usage = useTenantUsage({ houseId, metric: "water", areaId: activeAreaId });
  const [isAreaLoading, setIsAreaLoading] = useState(false);
  const prevAreaRef = useRef("all");
  useEffect(() => {
    if (prevAreaRef.current !== selectedAreaId) {
      prevAreaRef.current = selectedAreaId;
      if (!isHouseLevel) setIsAreaLoading(true);
      else setIsAreaLoading(false);
    }
  }, [selectedAreaId, isHouseLevel]);

  const distAreas = useMemo(
    () => areasWithNode.map((a) => ({ id: a.id, name: a.name })),
    [areasWithNode]
  );
  const areaDistribution = useAreasUsageDistribution({
    houseId,
    metric: "water",
    areas: distAreas,
  });

  const { water } = useAreaTelemetry(thingId, activeAreaId);
  useEffect(() => {
    if (water != null) setIsAreaLoading(false);
  }, [water]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [pullRefreshing, setPullRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    await Promise.all([usage.refetch(), areaDistribution.refetch()]);
    setPullRefreshing(false);
  }, [usage.refetch, areaDistribution.refetch]);

  const w = water?.features;
  const isFlowing = (w?.w_lpm ?? 0) > 0.1;
  const leakSuspected = !!w?.water_leak_suspected;
  const flowColor = leakSuspected ? BRAND_DANGER : isFlowing ? ACCENT : "#22C55E";
  const flowLabel = leakSuspected
    ? t("consumption.flow_leak")
    : isFlowing
      ? t("consumption.flow_running")
      : t("consumption.flow_idle");

  const [distSort, setDistSort] = useState<"value" | "name">("value");
  const [distPage, setDistPage] = useState(1);
  const sortedDist = useMemo(() => {
    const raw = [...areaDistribution.items];
    if (distSort === "value") raw.sort((a, b) => b.value - a.value);
    else raw.sort((a, b) => (a.areaName || "").localeCompare(b.areaName || "", i18n.language));
    return raw;
  }, [areaDistribution.items, distSort, i18n.language]);
  const distPages = Math.max(1, Math.ceil(sortedDist.length / DIST_PAGE_SIZE));
  const distSlice = useMemo(() => {
    const p = Math.min(distPage, distPages);
    const start = (p - 1) * DIST_PAGE_SIZE;
    return sortedDist.slice(start, start + DIST_PAGE_SIZE);
  }, [sortedDist, distPage, distPages]);

  useEffect(() => {
    setDistPage(1);
  }, [sortedDist.length, distSort]);

  const heroLabel = isHouseLevel
    ? t("consumption.hero_house_water")
    : `${(areaChips.find((c) => c.id === selectedAreaId)?.label ?? "").toUpperCase()} · L`;

  const unit = t("consumption.unit_L");

  if (accessBlock) {
    const title =
      accessBlock === "handover"
        ? t("home.access.handover_title")
        : t("home.access.deposit_title");
    const accessReasonText = translateTenantAccessReason(
      house?.accessReason,
      house?.accessStatus,
      t
    );
    const body =
      accessBlock === "handover"
        ? accessReasonText ||
          t("home.access.handover_body", {
            date: house?.handoverDate
              ? formatDayMonthNumeric(new Date(house.handoverDate), i18n.language)
              : "—",
          })
        : accessReasonText || t("home.access.deposit_body");
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        {showHeader ? <Header variant="water" /> : null}
        <View style={gateStyles.gateWrap}>
          <View style={gateStyles.gateBox}>
            <Text style={gateStyles.gateTitle}>{title}</Text>
            <Text style={gateStyles.gateBody}>{body}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {showHeader ? <Header variant="water" /> : null}
      <View style={{ flex: 1, position: "relative" }}>
        <RefreshLogoOverlay visible={pullRefreshing} />
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          onScroll={onScrollForRefreshGate}
          scrollEventThrottle={16}
          refreshControl={
            <PullToRefreshControl
              refreshing={pullRefreshing}
              onRefresh={onRefresh}
              scrollAtTop={scrollAtTop}
            />
          }
        >
          <AreaTabs
            chips={areaChips}
            selected={selectedAreaId}
            accent={ACCENT}
            tintBg={waterTintBg}
            onSelect={setSelectedAreaId}
          />

          <HeroCard
            label={heroLabel}
            dayVal={usage.dayVal}
            weekVal={usage.weekVal}
            monthVal={usage.monthVal}
            unit={unit}
            accent={ACCENT}
            loading={usage.loading || isAreaLoading}
            periodDay={t("consumption.period_day")}
            periodWeek={t("consumption.period_week")}
            periodMonth={t("consumption.period_month")}
          />

          {!isHouseLevel &&
            (isAreaLoading ? (
              <View style={sk.card}>
                <View style={sk.header}>
                  <Skel w={120} h={16} />
                  <Skel w={50} h={20} r={999} />
                </View>
                {[0, 1].map((i) => (
                  <View
                    key={i}
                    style={[sk.row, i > 0 ? { borderTopWidth: 1, borderTopColor: BDR } : null]}
                  >
                    <View style={sk.cell}><Skel w={60} h={14} /><Skel w={80} h={22} mt={6} /></View>
                    <View style={sk.vDiv} />
                    <View style={sk.cell}><Skel w={60} h={14} /><Skel w={80} h={22} mt={6} /></View>
                  </View>
                ))}
              </View>
            ) : (
              <Card>
                <CardHeader
                  title={t("consumption.monitoring_water")}
                  subtitle={now.toLocaleTimeString(i18n.language)}
                  right={<LiveBadge on={iotConnected} />}
                />
                {w ? (
                  <>
                    <View
                      style={[
                        styles.flowStrip,
                        { backgroundColor: `${flowColor}12`, borderBottomColor: `${flowColor}30` },
                      ]}
                    >
                      <View style={[styles.flowDot, { backgroundColor: flowColor }]} />
                      <View style={styles.flowBody}>
                        <Text style={[styles.flowStatus, { color: flowColor }]}>{flowLabel}</Text>
                        <Text style={styles.flowSub}>
                          {fmt(w.w_lpm, 2)} L/min
                        </Text>
                      </View>
                      {leakSuspected ? (
                        <View style={[styles.leakBadge, { backgroundColor: BRAND_DANGER }]}>
                          <Text style={styles.leakBadgeTxt}>!</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.metricRow}>
                      <Metric
                        icon="L"
                        label="L/min"
                        value={`${fmt(w.w_lpm, 2)}`}
                        valueColor={ACCENT}
                      />
                      <View style={styles.metricVDiv} />
                      <Metric
                        icon="d"
                        label="Δ"
                        value={`${fmt(w.d_w_tot, 2)} L`}
                        valueColor={consumptionTelemetryMetric.current}
                      />
                    </View>
                    <View style={styles.metricHDiv} />
                    <View style={styles.metricRow}>
                      <Metric icon="Σ" label="Σ" value={`${fmt(w.w_tot, 1)} L`} />
                      <View style={styles.metricVDiv} />
                      <Metric
                        icon="?"
                        label="OK"
                        value={leakSuspected ? "!" : "OK"}
                        valueColor={
                          leakSuspected ? BRAND_DANGER : consumptionTelemetryMetric.voltage
                        }
                      />
                    </View>
                    {leakSuspected ? (
                      <View style={styles.leakBanner}>
                        <Text style={styles.leakBannerTxt}>{t("consumption.leak_banner")}</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.waitRow}>
                    <RefreshLogoInline logoPx={18} showLabel={false} />
                    <Text style={styles.waitTxt}>{t("consumption.waiting_device")}</Text>
                  </View>
                )}
              </Card>
            ))}

          {isHouseLevel ? (
            <Card>
              <CardHeader title={t("consumption.chart_title_pie")} />
              <View style={styles.distSortRow}>
                <TouchableOpacity onPress={() => setDistSort("value")}>
                  <Text style={[styles.sortTxt, distSort === "value" && styles.sortActive]}>
                    {t("consumption.sort_by_value")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDistSort("name")}>
                  <Text style={[styles.sortTxt, distSort === "name" && styles.sortActive]}>
                    {t("consumption.sort_by_name")}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.distBody}>
                {!distSlice.length ? (
                  <Text style={styles.emptyTxt}>{t("consumption.no_area_month_data")}</Text>
                ) : (
                  distSlice.map((item, idx) => {
                    const maxV = Math.max(...sortedDist.map((i) => i.value), 0.001);
                    const col = AREA_COLORS[idx % AREA_COLORS.length];
                    return (
                      <View key={item.areaId} style={styles.distRow}>
                        <View style={styles.distL}>
                          <View style={[styles.distDot, { backgroundColor: col }]} />
                          <Text style={styles.distLbl} numberOfLines={1}>
                            {item.areaName || item.areaId}
                          </Text>
                        </View>
                        <View style={styles.distR}>
                          <Text style={[styles.distVal, { color: col }]}>
                            {item.value.toFixed(1)} L
                          </Text>
                          <View style={styles.distTrack}>
                            <View
                              style={[
                                styles.distFill,
                                {
                                  width: `${Math.max(5, (item.value / maxV) * 100)}%`,
                                  backgroundColor: col,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
              {distPages > 1 ? (
                <View style={styles.pager}>
                  <TouchableOpacity
                    disabled={distPage <= 1}
                    onPress={() => setDistPage((p) => Math.max(1, p - 1))}
                  >
                    <Text style={styles.pagerTxt}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.pagerMid}>
                    {distPage}/{distPages}
                  </Text>
                  <TouchableOpacity
                    disabled={distPage >= distPages}
                    onPress={() => setDistPage((p) => Math.min(distPages, p + 1))}
                  >
                    <Text style={styles.pagerTxt}>›</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </Card>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
};

export default WaterUsageScreen;
