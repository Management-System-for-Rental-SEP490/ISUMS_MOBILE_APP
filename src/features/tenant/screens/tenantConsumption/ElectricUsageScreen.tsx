import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { useTranslation } from "react-i18next";
import Header from "../../../../shared/components/header";
import { CustomAlert } from "../../../../shared/components/alert";
import {
  useTenantContext,
  useAreasUsageDistribution,
  useRefreshControlGate,
  useAssetItems,
  asAssetItemArray,
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
  usePowerControl,
} from "../../hooks/useTenantIoT";
import { useTenantForecast } from "../../hooks/useTenantForecast";
import ForecastCard from "./ForecastCard";
import HouseMasterPowerBtn from "./HouseMasterPowerBtn";
import iotCommandApi, { type AreaPowerStateResponse } from "../../../../shared/services/iotCommandApi";
import { iotClient } from "../../../../shared/services/iotClient";
import {
  brandPrimary,
  brandTintBg,
  neutral,
  BRAND_DANGER,
  consumptionAreaDistributionColors,
  consumptionGasCell,
  consumptionPowerEventChip,
  consumptionPowerOnGreen,
  consumptionTelemetryMetric,
  iotConnectionBadge,
} from "../../../../shared/theme/color";
import {
  formatDayMonthNumeric,
  getTenantAccessBlock,
  translateTenantAccessReason,
} from "../../../../shared/utils";
import {
  electricUsageLiveBadgeStyles as lb,
  electricUsageAreaTabStyles as at,
  electricUsageHeroStyles as hc,
  electricUsagePowerBtnStyles as pw,
  electricUsageMetricStyles as mt,
  electricUsageMonitoringSkeletonStyles as sk,
  electricUsageCardStyles as cd,
  electricUsageCardHeaderStyles as ch,
  electricUsageScreenIoTStyles as styles,
  electricUsageGateStyles as gateStyles,
  electricUsageMonthlyCardStyles as mc,
} from "./electricUsageStyles";

const ACCENT = brandPrimary;
const BG = neutral.background;
const T2 = neutral.slate500;
const GAS_WARN = 150;
const GAS_CRIT = 300;
const AREA_COLORS = [...consumptionAreaDistributionColors];
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

const Sparkline = ({
  values, width = 80, height = 28, color,
}: { values: number[]; width?: number; height?: number; color: string }) => {
  if (!values.length || values.every((v) => v === 0)) return null;
  const max = Math.max(...values, 0.001);
  const step = width / Math.max(values.length - 1, 1);
  const pts = values
    .map((v, i) => `${i * step},${height - (v / max) * height}`)
    .join(" ");
  return (
    <Svg width={width} height={height}>
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const STALE_WARN_SECONDS = 30;
const STALE_OFFLINE_SECONDS = 120;

function formatAgoText(seconds: number): string {
  if (seconds < 5) return "…";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

const LiveBadge = ({ on, lastTs }: { on: boolean; lastTs?: number }) => {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    if (!lastTs) {
      setSeconds(null);
      return;
    }
    const tick = () => setSeconds(Math.round((Date.now() - lastTs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastTs]);

  const isStale = seconds != null && seconds >= STALE_WARN_SECONDS;
  const isOffline = !on || (seconds != null && seconds >= STALE_OFFLINE_SECONDS);
  const showLive = on && !isStale;

  let bg: string;
  let dot: string;
  let label: string;
  let labelColor: string;

  if (isOffline) {
    bg = iotConnectionBadge.offBackground;
    dot = iotConnectionBadge.offDot;
    label = t("consumption.iot_offline");
    labelColor = iotConnectionBadge.offLabel;
  } else if (isStale) {
    bg = "rgba(245,158,11,0.15)";
    dot = "#f59e0b";
    label = t("consumption.iot_stale", { defaultValue: "Đang chờ dữ liệu" });
    labelColor = "#b45309";
  } else if (showLive) {
    bg = iotConnectionBadge.onBackground;
    dot = iotConnectionBadge.onDot;
    label = t("consumption.iot_live");
    labelColor = iotConnectionBadge.onLabel;
  } else {
    bg = iotConnectionBadge.offBackground;
    dot = iotConnectionBadge.offDot;
    label = t("consumption.iot_offline");
    labelColor = iotConnectionBadge.offLabel;
  }

  return (
    <View style={lb.row}>
      {seconds != null ? (
        <Text style={[lb.ago, isStale ? { color: "#b45309", fontWeight: "600" } : null]}>
          {formatAgoText(seconds)}
        </Text>
      ) : null}
      <View style={[lb.wrap, { backgroundColor: bg }]}>
        <View style={[lb.dot, { backgroundColor: dot }]} />
        <Text style={[lb.txt, { color: labelColor }]}>{label}</Text>
      </View>
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
  accent,
  loading,
  sparkValues,
  periodDay,
  periodWeek,
  periodMonth,
}: {
  label: string;
  dayVal: number;
  weekVal: number;
  monthVal: number;
  accent: string;
  loading: boolean;
  sparkValues?: number[];
  periodDay: string;
  periodWeek: string;
  periodMonth: string;
}) => (
  <View style={[hc.card, { borderLeftColor: accent }]}>
    <View style={hc.topRow}>
      <Text style={hc.label}>{label}</Text>
      {sparkValues && sparkValues.length > 1 ? (
        <Sparkline values={sparkValues} color={accent} width={72} height={24} />
      ) : null}
    </View>
    <View style={hc.row}>
      {loading && dayVal === 0 && weekVal === 0 && monthVal === 0 ? (
        <>
          <View style={hc.cell}><Skel w={52} h={28} /><Skel w={36} h={11} mt={6} /></View>
          <View style={hc.vDiv} />
          <View style={hc.cell}><Skel w={52} h={28} /><Skel w={36} h={11} mt={6} /></View>
          <View style={hc.vDiv} />
          <View style={hc.cell}><Skel w={52} h={28} /><Skel w={36} h={11} mt={6} /></View>
        </>
      ) : (
        <>
          <View style={hc.cell}>
            <Text style={hc.period}>{periodDay}</Text>
            <Text style={[hc.val, { color: accent }]}>
              {dayVal.toFixed(1)}<Text style={hc.unit}> kWh</Text>
            </Text>
          </View>
          <View style={hc.vDiv} />
          <View style={hc.cell}>
            <Text style={hc.period}>{periodWeek}</Text>
            <Text style={hc.val}>
              {weekVal.toFixed(1)}<Text style={hc.unit}> kWh</Text>
            </Text>
          </View>
          <View style={hc.vDiv} />
          <View style={hc.cell}>
            <Text style={hc.period}>{periodMonth}</Text>
            <Text style={hc.val}>
              {monthVal.toFixed(1)}<Text style={hc.unit}> kWh</Text>
            </Text>
          </View>
        </>
      )}
    </View>
  </View>
);

const MonthlyUsageCard = ({
  monthVal,
  unit,
  loading,
  accent,
}: {
  monthVal: number;
  unit: string;
  loading: boolean;
  accent: string;
}) => {
  const { t, i18n } = useTranslation();
  const monthCaption = useMemo(() => {
    try {
      return new Date().toLocaleDateString(i18n.language, { month: "long", year: "numeric" });
    } catch {
      return new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
    }
  }, [i18n.language]);

  return (
    <View style={[mc.wrap, { borderLeftWidth: 4, borderLeftColor: accent }]}>
      <View style={mc.topRow}>
        <View style={mc.titleBlock}>
          <Text style={mc.kicker}>{t("consumption.monthly_usage_card_title")}</Text>
          <Text style={mc.monthLine}>{monthCaption}</Text>
        </View>
      </View>
      {loading && monthVal === 0 ? (
        <Skel w={140} h={38} r={10} mt={8} />
      ) : (
        <View style={mc.valueRow}>
          <Text style={[mc.value, { color: accent }]}>{monthVal.toFixed(1)}</Text>
          <Text style={mc.unit}>{unit}</Text>
        </View>
      )}
    </View>
  );
};

const PowerBtn = ({
  isPowered, loading, onPress, tOff, tOn,
}: {
  isPowered: boolean;
  loading: boolean;
  onPress: () => void;
  tOff: string;
  tOn: string;
}) => (
  <TouchableOpacity
    style={[
      pw.btn,
      { backgroundColor: isPowered ? BRAND_DANGER : consumptionPowerOnGreen },
    ]}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.85}
  >
    {loading ? (
      <RefreshLogoInline logoPx={18} showLabel={false} />
    ) : (
      <Text style={pw.txt}>{isPowered ? tOff : tOn}</Text>
    )}
  </TouchableOpacity>
);

const Metric = ({
  icon, label, value, color, inCell,
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
  /** Ô trong lưới 2×2 — padding gọn hơn. */
  inCell?: boolean;
}) => (
  <View style={inCell ? mt.wrapInCell : mt.wrap}>
    <Text style={mt.icon}>{icon}</Text>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={mt.label}>{label}</Text>
      <Text style={[mt.val, color ? { color } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

const MonitoringSkeleton = ({ accent }: { accent: string }) => (
  <View style={sk.card}>
    <View style={sk.header}>
      <Skel w={120} h={16} />
      <Skel w={50} h={20} r={999} />
    </View>
    <View style={sk.gridPad}>
      <View style={sk.gridRow}>
        <View style={sk.metricCellSk}>
          <Skel w="70%" h={12} />
          <Skel w="90%" h={22} />
        </View>
        <View style={sk.metricCellSk}>
          <Skel w="70%" h={12} />
          <Skel w="90%" h={22} />
        </View>
      </View>
      <View style={sk.gridRow}>
        <View style={sk.metricCellSk}>
          <Skel w="70%" h={12} />
          <Skel w="90%" h={22} />
        </View>
        <View style={sk.metricCellSk}>
          <Skel w="70%" h={12} />
          <Skel w="90%" h={22} />
        </View>
      </View>
    </View>
  </View>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[cd.card, style]}>{children}</View>
);

const CardHeader = ({
  title, subtitle, right,
}: { title: string; subtitle?: string; right?: React.ReactNode }) => (
  <View style={ch.wrap}>
    <View style={{ flex: 1 }}>
      <Text style={ch.title}>{title}</Text>
      {subtitle ? <Text style={ch.sub}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>
);

export type ElectricUsageScreenProps = { showHeader?: boolean };

const ElectricUsageScreen = ({ showHeader = true }: ElectricUsageScreenProps) => {
  const { t, i18n } = useTranslation();
  const { houseId, functionalAreas, thingId, iotNodes, house } = useTenantContext();
  const accessBlock = useMemo(() => (house ? getTenantAccessBlock(house) : null), [house]);
  const runtimeHouseId = accessBlock ? null : houseId;
  const iotConnected = useTenantIoTConnection(thingId);
  const { scrollAtTop, onScrollForRefreshGate } = useRefreshControlGate();
  const { data: assetItemsData } = useAssetItems({
    houseId: runtimeHouseId ?? undefined,
    enabled: !accessBlock && Boolean(runtimeHouseId),
  });
  const assetItems = useMemo(
    () => asAssetItemArray(assetItemsData?.data),
    [assetItemsData?.data]
  );

  const areasWithNode = useMemo(() => {
    const areas = Array.isArray(functionalAreas) ? functionalAreas : [];
    if (!iotNodes.length) return areas;
    const nodeAssetIds = new Set(
      iotNodes.map((n) => String(n.assetId ?? "").trim()).filter(Boolean)
    );
    const nodeAreaIds = new Set(
      assetItems
        .filter((item) => nodeAssetIds.has(String(item.id ?? "").trim()))
        .map((item) => String(item.functionAreaId ?? "").trim())
        .filter(Boolean)
    );
    if (nodeAreaIds.size > 0) {
      return areas.filter((a) => nodeAreaIds.has(String(a.id ?? "").trim()));
    }
    const textMatched = areas.filter((a) =>
      iotNodes.some(
        (n) => n.areaName?.trim().toLowerCase() === a.name?.trim().toLowerCase()
      )
    );
    return textMatched.length > 0 ? textMatched : areas;
  }, [assetItems, functionalAreas, iotNodes]);

  const areaChips = useMemo(() => {
    const chips = [{ id: "all", label: t("consumption.area_all_house") }];
    areasWithNode.forEach((a) => chips.push({ id: a.id, label: a.name }));
    return chips;
  }, [areasWithNode, t]);

  const [selectedAreaId, setSelectedAreaId] = useState("all");
  const isHouseLevel = selectedAreaId === "all";
  const activeAreaId = isHouseLevel ? null : selectedAreaId;
  const areaLabel = areaChips.find((c) => c.id === selectedAreaId)?.label ?? "";

  const usage = useTenantUsage({
    houseId: runtimeHouseId,
    metric: "electricity",
    areaId: activeAreaId,
  });
  const forecast = useTenantForecast({
    houseId: runtimeHouseId,
    metric: "electricity",
    areaId: activeAreaId,
  });
  const forecastScopeLabel = isHouseLevel
    ? t("consumption.area_all_house")
    : areaLabel || t("consumption.area_all_house");
  const distAreas = useMemo(
    () => areasWithNode.map((a) => ({ id: a.id, name: a.name })),
    [areasWithNode]
  );
  const areaDistribution = useAreasUsageDistribution({
    houseId: runtimeHouseId,
    metric: "electricity",
    areas: distAreas,
  });

  const { power, gas, environment, powerHistory } = useAreaTelemetry(thingId, activeAreaId);
  const powerCtrl = usePowerControl(runtimeHouseId);

  const [powerState, setPowerState] = useState<AreaPowerStateResponse | null>(null);
  const [isAreaLoading, setIsAreaLoading] = useState(false);
  const prevAreaRef = useRef<string | null>(null);
  const powerStateReqRef = useRef(0);

  useEffect(() => {
    if (prevAreaRef.current !== selectedAreaId) {
      prevAreaRef.current = selectedAreaId;
      if (!isHouseLevel) {
        setIsAreaLoading(true);
      }
    }
  }, [selectedAreaId, isHouseLevel]);

  useEffect(() => {
    if (!activeAreaId || !runtimeHouseId) {
      setPowerState(null);
      setIsAreaLoading(false);
      return;
    }
    const reqId = ++powerStateReqRef.current;
    iotCommandApi
      .getAreaPowerState(runtimeHouseId, activeAreaId)
      .then((res) => {
        if (reqId !== powerStateReqRef.current) return;
        setPowerState(res);
        setIsAreaLoading(false);
      })
      .catch(() => {
        if (reqId !== powerStateReqRef.current) return;
        setPowerState(null);
        setIsAreaLoading(false);
      });
  }, [activeAreaId, runtimeHouseId]);

  const isPowered = powerState?.powered ?? true;

  const sparkValues = useMemo(
    () => powerHistory.filter((m) => m.stream === "power").slice(-14).map((m) => m.features?.p ?? 0),
    [powerHistory]
  );

  const handlePowerToggle = useCallback(() => {
    if (!activeAreaId || !powerState) return;
    const action = isPowered ? "OFF" : "ON";
    const title = isPowered ? t("consumption.power_off_title") : t("consumption.power_on_title");
    const msg = isPowered
      ? t("consumption.power_off_message", { area: areaLabel })
      : t("consumption.power_on_message", { area: areaLabel });
    CustomAlert.alert(
      title,
      msg,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: isPowered ? t("consumption.power_off_title") : t("consumption.power_on_title"),
          style: isPowered ? "destructive" : "default",
          onPress: async () => {
            const snapshot = powerState;
            setPowerState({ ...powerState, powered: !isPowered });
            try {
              const res = await powerCtrl.toggle(activeAreaId, action);
              setPowerState(res);
            } catch (err: unknown) {
              setPowerState(snapshot);
              const e = err as { response?: { data?: { message?: string } }; message?: string };
              CustomAlert.alert(
                t("common.error"),
                e?.response?.data?.message ?? e?.message ?? t("common.try_again"),
                [{ text: t("common.close"), style: "default" }],
                { type: "error" }
              );
            }
          },
        },
      ],
      { type: "warning" }
    );
  }, [activeAreaId, areaLabel, isPowered, powerCtrl, powerState, t]);

  const [pullRefreshing, setPullRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    iotClient.forceReconnect();
    const tasks: Promise<unknown>[] = [
      Promise.resolve().then(() => {
        usage.refetch();
      }),
      Promise.resolve().then(() => {
        areaDistribution.refetch();
      }),
      forecast.refetch(),
    ];
    if (activeAreaId && runtimeHouseId) {
      tasks.push(
        iotCommandApi.getAreaPowerState(runtimeHouseId, activeAreaId).then(setPowerState).catch(() => {})
      );
    }
    await Promise.all(tasks);
    setPullRefreshing(false);
  }, [usage.refetch, areaDistribution.refetch, forecast.refetch, activeAreaId, runtimeHouseId]);

  const f = power?.features;

  const g = gas?.features;
  const e = environment?.features;
  const gasLevel: "ok" | "warn" | "critical" = !g?.gas_ppm
    ? "ok"
    : g.gas_ppm >= GAS_CRIT
      ? "critical"
      : g.gas_ppm >= GAS_WARN
        ? "warn"
        : "ok";

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
    ? t("consumption.hero_house_kwh")
    : `${areaLabel.toUpperCase()} · kWh`;

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
        {showHeader ? <Header variant="electric" /> : null}
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
      {showHeader ? <Header variant="electric" /> : null}
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
            tintBg={brandTintBg}
            onSelect={setSelectedAreaId}
          />

          <HeroCard
            label={heroLabel}
            dayVal={usage.dayVal}
            weekVal={usage.weekVal}
            monthVal={usage.monthVal}
            accent={ACCENT}
            loading={usage.loading || isAreaLoading}
            sparkValues={sparkValues}
            periodDay={t("consumption.period_day")}
            periodWeek={t("consumption.period_week")}
            periodMonth={t("consumption.period_month")}
          />

          <MonthlyUsageCard
            monthVal={usage.monthVal}
            unit={usage.unit}
            loading={usage.loading || isAreaLoading}
            accent={ACCENT}
          />

          <ForecastCard
            data={forecast.data}
            loading={forecast.loading}
            error={forecast.error}
            onRetry={forecast.refetch}
            accent={ACCENT}
            displayUnit="kWh"
            scopeLabel={forecastScopeLabel}
          />

          {!isHouseLevel &&
            (isAreaLoading ? (
              <MonitoringSkeleton accent={ACCENT} />
            ) : !isPowered ? (
              <Card style={styles.offCard}>
                <Text style={styles.offTitle}>{t("consumption.area_power_off_title")}</Text>
                <Text style={styles.offSub}>{t("consumption.area_power_off_body")}</Text>
              </Card>
            ) : (
              <Card>
                <CardHeader
                  title={t("consumption.monitoring_electric")}
                  subtitle={
                    f
                      ? new Date(power!.ts).toLocaleTimeString(i18n.language)
                      : undefined
                  }
                  right={<LiveBadge on={iotConnected} lastTs={power?.ts} />}
                />
                {f ? (
                  <>
                    <View style={styles.metricGrid}>
                      <View style={styles.metricGridRow}>
                        <View style={styles.metricCell}>
                          <Metric
                            inCell
                            icon="V"
                            label="V"
                            value={`${fmt(f.v, 0)} V`}
                            color={consumptionTelemetryMetric.voltage}
                          />
                        </View>
                        <View style={styles.metricCell}>
                          <Metric
                            inCell
                            icon="A"
                            label="A"
                            value={`${fmt(f.i, 2)} A`}
                            color={consumptionTelemetryMetric.current}
                          />
                        </View>
                      </View>
                      <View style={styles.metricGridRow}>
                        <View style={styles.metricCell}>
                          <Metric
                            inCell
                            icon="W"
                            label="W"
                            value={`${fmt(f.p, 0)} W`}
                            color={ACCENT}
                          />
                        </View>
                        <View style={styles.metricCell}>
                          <Metric
                            inCell
                            icon="kWh"
                            label="kWh"
                            value={`${fmt(f.kwh, 3)}`}
                          />
                        </View>
                      </View>
                    </View>
                    {(f.power_lost || f.power_restored) && (
                      <View
                        style={[
                          styles.eventChip,
                          {
                            backgroundColor: f.power_restored
                              ? consumptionPowerEventChip.restoredBg
                              : consumptionPowerEventChip.lostBg,
                            borderTopColor: f.power_restored
                              ? consumptionPowerEventChip.restoredBorder
                              : consumptionPowerEventChip.lostBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.eventChipTxt,
                            {
                              color: f.power_restored
                                ? consumptionPowerEventChip.restoredText
                                : consumptionPowerEventChip.lostText,
                            },
                          ]}
                        >
                          {f.power_restored
                            ? t("consumption.power_restored")
                            : t("consumption.power_lost")}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.waitRow}>
                    <RefreshLogoInline logoPx={18} showLabel={false} />
                    <Text style={styles.waitTxt}>{t("consumption.waiting_device")}</Text>
                  </View>
                )}
              </Card>
            ))}

          {!isHouseLevel && !isAreaLoading && (g || e) ? (
            <Card>
              <CardHeader title={t("consumption.env_safety")} />
              <View style={styles.envRow}>
                {g && (
                  <View
                    style={[
                      styles.envCell,
                      {
                        borderColor: consumptionGasCell[gasLevel].border,
                        backgroundColor: consumptionGasCell[gasLevel].bg,
                      },
                    ]}
                  >
                    <Text style={styles.envVal}>{fmt(g.gas_ppm, 0)}</Text>
                    <Text style={styles.envUnit}>ppm</Text>
                    <Text style={styles.envLbl}>{t("consumption.gas_label")}</Text>
                  </View>
                )}
                {e && (
                  <View style={styles.envCell}>
                    <Text style={styles.envVal}>{fmt(e.temp_c, 1)}</Text>
                    <Text style={styles.envUnit}>°C</Text>
                    <Text style={styles.envLbl}>{t("consumption.temp_label")}</Text>
                  </View>
                )}
                {e && (
                  <View style={styles.envCell}>
                    <Text style={styles.envVal}>{fmt(e.humidity_pct, 0)}</Text>
                    <Text style={styles.envUnit}>%</Text>
                    <Text style={styles.envLbl}>{t("consumption.humidity_label")}</Text>
                  </View>
                )}
              </View>
            </Card>
          ) : null}

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
                            {item.value.toFixed(1)} kWh
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

          {isHouseLevel ? (
            <HouseMasterPowerBtn
              houseId={houseId}
              areas={areasWithNode.map((a) => ({ id: a.id, name: a.name }))}
              onAfterToggle={() => {
                // Sau khi toggle tổng: refresh usage + distribution để UI phản ánh
                // đúng tiêu thụ kế tiếp (post-cut → 0 flow, post-on → nhận telemetry lại).
                usage.refetch();
                areaDistribution.refetch();
              }}
            />
          ) : powerState !== null && !isAreaLoading ? (
            <PowerBtn
              isPowered={isPowered}
              loading={powerCtrl.loading}
              onPress={handlePowerToggle}
              tOff={t("consumption.power_off_title")}
              tOn={t("consumption.power_on_title")}
            />
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
};

export default ElectricUsageScreen;
