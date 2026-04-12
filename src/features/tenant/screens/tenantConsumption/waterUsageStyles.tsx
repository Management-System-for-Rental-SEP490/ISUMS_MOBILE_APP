import { StyleSheet, Dimensions } from "react-native";
import { tenantSoftCard } from "../../../../shared/styles/tenantSoftCard";
import {
  BRAND_DANGER,
  consumptionDangerBannerBg,
  consumptionDangerBannerBorder,
  neutral,
  waterAccent,
} from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Token dùng cho màn IoT nước (WaterUsageScreen). */
const WU_CARD = neutral.surface;
const WU_T1 = neutral.slate900;
const WU_T2 = neutral.slate500;
const WU_BDR = neutral.borderMuted;

/**
 * Styles cho màn hình tiêu thụ nước.
 * Nền / card / viền: neutral; accent nước: waterAccent.
 */
export const waterUsageStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  title: {
    ...appTypography.dialogTitle,
    color: neutral.slate900,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 2,
    marginTop: 0,
  },
  areaSelectorWrapper: {
    marginBottom: 12,
  },
  areaDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: neutral.surface,
    borderWidth: 1,
    borderColor: neutral.slate200,
    marginTop: 6,
  },
  areaDropdownLabel: {
    ...appTypography.hint,
    color: neutral.slate400,
    marginBottom: 1,
  },
  areaDropdownValue: {
    ...appTypography.chip,
    color: neutral.slate700,
  },
  areaChipScroll: {
    marginTop: 8,
    marginBottom: 4,
  },
  areaChipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 16,
  },
  areaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: neutral.backgroundElevated,
    borderWidth: 1,
    borderColor: neutral.slate200,
    minHeight: 32,
    justifyContent: "center",
  },
  areaChipActive: {
    backgroundColor: waterAccent,
    borderColor: waterAccent,
  },
  areaChipText: {
    ...appTypography.caption,
    fontWeight: "500",
    color: neutral.slate500,
  },
  areaChipTextActive: {
    color: neutral.surface,
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: neutral.surface,
    borderWidth: 1,
    borderColor: neutral.slate200,
    minHeight: 32,
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: waterAccent,
    borderColor: waterAccent,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: neutral.slate500,
  },
  categoryChipTextActive: {
    color: neutral.surface,
  },
  chartCard: {
    backgroundColor: neutral.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chartTitle: {
    ...appTypography.sectionHeading,
    fontWeight: "600",
    color: neutral.slate700,
    marginBottom: 16,
  },
  /** Card realtime (các stat đo nước + biểu đồ sparkline). */
  realtimeCard: {
    backgroundColor: neutral.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  realtimeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  realtimeTitle: {
    ...appTypography.listTitle,
    color: neutral.slate700,
  },
  realtimeTimestamp: {
    ...appTypography.hint,
    color: neutral.slate500,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: neutral.slate200,
    padding: 12,
    marginBottom: 12,
  },
  statLabel: {
    ...appTypography.caption,
    fontWeight: "600",
    color: neutral.slate500,
    marginBottom: 6,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  statUnit: {
    ...appTypography.hint,
    fontWeight: "700",
    color: neutral.slate400,
  },
  /** Sparkline card realtime. */
  sparkCard: {
    backgroundColor: neutral.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sparkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sparkTitle: {
    ...appTypography.captionStrong,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: neutral.slate700,
  },
  sparkCurrent: {
    fontSize: 18,
    fontWeight: "900",
  },
  chartWrapper: {
    width: SCREEN_WIDTH - 80,
    alignSelf: "center",
    height: 220,
  },
  chartBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    marginHorizontal: 2,
  },
  barLabel: {
    ...appTypography.micro,
    color: neutral.slate500,
    marginTop: 6,
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
    marginBottom: 16,
  },
  pieLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 12,
  },
  pieLegendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  pieLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  pieLegendText: {
    ...appTypography.caption,
    color: neutral.slate500,
  },
});

// ── IoT WaterUsageScreen ────────────────────────────────────────────────────

export const waterUsageLiveBadgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  txt: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
});

export const waterUsageAreaTabStyles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...tenantSoftCard,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: WU_T2,
    letterSpacing: 0.45,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  scroll: {},
  content: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: WU_BDR,
    backgroundColor: neutral.canvasMuted,
  },
  chipText: {
    fontSize: 13,
  },
});

export const waterUsageHeroStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderLeftWidth: 4,
    ...tenantSoftCard,
  },
  label: { fontSize: 10, fontWeight: "800", color: WU_T2, letterSpacing: 1, marginBottom: 14 },
  row: { flexDirection: "row", alignItems: "center" },
  cell: { flex: 1, alignItems: "center" },
  divider: { width: 1, height: 40, backgroundColor: WU_BDR },
  period: { fontSize: 11, color: WU_T2, fontWeight: "600", marginBottom: 4 },
  val: { fontSize: 22, fontWeight: "900", color: WU_T1 },
  unit: { fontSize: 11, fontWeight: "600", color: WU_T2 },
});

export const waterUsageMetricStyles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12 },
  icon: { fontSize: 16, width: 24, textAlign: "center", marginRight: 8 },
  body: { flex: 1 },
  label: { fontSize: 10, color: WU_T2, fontWeight: "700", letterSpacing: 0.4, marginBottom: 3 },
  value: { fontSize: 17, fontWeight: "800", color: WU_T1 },
});

export const waterUsageCardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    overflow: "hidden",
    ...tenantSoftCard,
  },
});

export const waterUsageCardHeaderStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: WU_BDR,
  },
  left: { flex: 1 },
  title: { fontSize: 14, fontWeight: "800", color: WU_T1 },
  sub: { fontSize: 11, color: WU_T2, fontWeight: "600", marginTop: 2 },
});

export const waterUsageMonitoringSkeletonStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: WU_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: WU_BDR,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: WU_BDR,
  },
  row: { flexDirection: "row" },
  cell: { flex: 1, paddingVertical: 13, paddingHorizontal: 14 },
  vDiv: { width: 1, backgroundColor: WU_BDR },
});

export const waterUsageScreenIoTStyles = StyleSheet.create({
  flowStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  flowDot: { width: 8, height: 8, borderRadius: 99, marginRight: 10 },
  flowBody: { flex: 1 },
  flowStatus: { fontSize: 14, fontWeight: "800" },
  flowSub: { fontSize: 12, color: WU_T2, fontWeight: "600" },
  leakBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  leakBadgeTxt: { color: neutral.surface, fontWeight: "900", fontSize: 12 },
  metricRow: { flexDirection: "row" },
  metricVDiv: { width: 1, backgroundColor: WU_BDR },
  metricHDiv: { height: 1, backgroundColor: WU_BDR },
  leakBanner: {
    padding: 14,
    backgroundColor: consumptionDangerBannerBg,
    borderTopWidth: 1,
    borderTopColor: consumptionDangerBannerBorder,
  },
  leakBannerTxt: { fontSize: 12, color: BRAND_DANGER, fontWeight: "700", lineHeight: 18 },
  waitRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  waitTxt: { fontSize: 13, color: WU_T2, fontWeight: "600" },
  distSortRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sortTxt: { fontSize: 12, color: WU_T2, fontWeight: "600" },
  sortActive: { color: waterAccent, fontWeight: "800" },
  distBody: { padding: 16, paddingTop: 6 },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: neutral.canvasMuted,
  },
  distL: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 },
  distDot: { width: 8, height: 8, borderRadius: 99, marginRight: 9 },
  distLbl: { fontSize: 13, color: WU_T1, fontWeight: "700", flex: 1 },
  distR: { width: 115, alignItems: "flex-end" },
  distVal: { fontSize: 13, fontWeight: "800", marginBottom: 5 },
  distTrack: {
    width: "100%",
    height: 4,
    backgroundColor: WU_BDR,
    borderRadius: 999,
    overflow: "hidden",
  },
  distFill: { height: "100%", borderRadius: 999 },
  emptyTxt: { fontSize: 13, color: WU_T2, fontWeight: "600", paddingVertical: 8 },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingBottom: 14,
  },
  pagerTxt: { fontSize: 22, color: waterAccent, fontWeight: "800" },
  pagerMid: { fontSize: 13, fontWeight: "700", color: WU_T2 },
});

export const waterUsageGateStyles = StyleSheet.create({
  gateWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: "center",
  },
  gateBox: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: neutral.surface,
    borderWidth: 1,
    borderColor: neutral.borderMuted,
  },
  gateTitle: { fontSize: 18, fontWeight: "800", color: WU_T1, marginBottom: 8 },
  gateBody: { fontSize: 14, color: WU_T2, lineHeight: 22 },
});
