import { StyleSheet, Dimensions } from "react-native";
import { tenantSoftCard } from "../../../../shared/styles/tenantSoftCard";
import { brandPrimary, neutral } from "../../../../shared/theme/color";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Token dùng cho màn IoT điện (ElectricUsageScreen). */
const EU_CARD = neutral.surface;
const EU_T1 = neutral.slate900;
const EU_T2 = neutral.slate500;
const EU_BDR = neutral.borderMuted;

/**
 * Styles cho màn hình tiêu thụ điện.
 * Nền / card / chữ: token `neutral` + `color.tsx` (quy tắc 010).
 */
export const electricUsageStyles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: "700",
    color: neutral.slate900,
    marginBottom: 8,
  },
  /** Thanh chọn tầng — gọn, sát sơ đồ nhà bên dưới */
  categoryScroll: {
    marginBottom: 2,
    marginTop: 0,
  },
  /** Wrapper thanh chọn khu vực – cách xa sơ đồ bên dưới */
  areaSelectorWrapper: {
    marginBottom: 12,
  },
  /** Nút dropdown chọn khu vực – thu nhỏ, gọn */
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
    fontSize: 11,
    color: neutral.slate400,
    marginBottom: 1,
  },
  areaDropdownValue: {
    fontSize: 13,
    fontWeight: "600",
    color: neutral.slate700,
  },
  /** Chip khu vực khi mở – nhỏ, gọn */
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
    backgroundColor: brandPrimary,
    borderColor: brandPrimary,
  },
  areaChipText: {
    fontSize: 12,
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
    backgroundColor: brandPrimary,
    borderColor: brandPrimary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: neutral.slate500,
  },
  categoryChipTextActive: {
    color: neutral.surface,
  },
  /** Card chứa biểu đồ */
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
    fontSize: 16,
    fontWeight: "600",
    color: neutral.slate700,
    marginBottom: 16,
  },
  /** Card realtime (các stat đo điện + biểu đồ sparkline). */
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
    fontSize: 15,
    fontWeight: "700",
    color: neutral.slate700,
  },
  realtimeTimestamp: {
    fontSize: 11,
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
    fontSize: 12,
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
    fontSize: 11,
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
    fontSize: 12,
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
    fontSize: 10,
    color: neutral.slate500,
    marginTop: 6,
  },
  /** Biểu đồ tròn: vùng chứa + chú thích */
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
    fontSize: 12,
    color: neutral.slate500,
  },
});

// ── IoT ElectricUsageScreen (tab khu vực, hero, relay, phân bổ) ─────────────

export const electricUsageLiveBadgeStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  ago: { fontSize: 10, color: EU_T2, fontWeight: "600" },
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

export const electricUsageAreaTabStyles = StyleSheet.create({
  /** Card bọc chip chọn khu (Tổng nhà, tầng, …). */
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
    color: EU_T2,
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
    borderColor: EU_BDR,
    backgroundColor: neutral.canvasMuted,
  },
  chipText: {
    fontSize: 13,
  },
});

export const electricUsageHeroStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderLeftWidth: 4,
    ...tenantSoftCard,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  label: { fontSize: 10, fontWeight: "800", color: EU_T2, letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  cell: { flex: 1, alignItems: "center" },
  vDiv: { width: 1, height: 40, backgroundColor: EU_BDR },
  period: { fontSize: 11, color: EU_T2, fontWeight: "600", marginBottom: 4 },
  val: { fontSize: 22, fontWeight: "900", color: EU_T1 },
  unit: { fontSize: 11, fontWeight: "600", color: EU_T2 },
});

/** Card tóm tắt tiêu thụ điện theo tháng. */
export const electricUsageMonthlyCardStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    ...tenantSoftCard,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: EU_T2,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  monthLine: {
    fontSize: 13,
    fontWeight: "600",
    color: EU_T1,
    marginTop: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  value: { fontSize: 30, fontWeight: "900", color: EU_T1 },
  unit: { fontSize: 15, fontWeight: "700", color: EU_T2 },
});

export const electricUsagePowerBtnStyles = StyleSheet.create({
  btn: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: neutral.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  txt: { fontSize: 15, fontWeight: "800", color: neutral.surface, letterSpacing: 0.3 },
});

export const electricUsageMetricStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
  },
  /** Dùng trong ô lưới — gọn padding, căn giữa theo chiều dọc. */
  wrapInCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  icon: { fontSize: 17, width: 22, textAlign: "center" },
  label: { fontSize: 10, color: EU_T2, fontWeight: "700", letterSpacing: 0.4, marginBottom: 3 },
  val: { fontSize: 17, fontWeight: "800", color: EU_T1, letterSpacing: -0.3 },
});

export const electricUsageMonitoringSkeletonStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: EU_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: EU_BDR,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: EU_BDR,
  },
  row: { flexDirection: "row" },
  cell: { flex: 1, paddingVertical: 13, paddingHorizontal: 14 },
  vDiv: { width: 1, backgroundColor: EU_BDR },
  gridPad: { paddingHorizontal: 12, paddingBottom: 14, paddingTop: 4, gap: 10 },
  gridRow: { flexDirection: "row", gap: 10 },
  metricCellSk: {
    flex: 1,
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EU_BDR,
    backgroundColor: neutral.backgroundElevated,
    padding: 12,
    justifyContent: "center",
    gap: 8,
  },
});

export const electricUsageCardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    overflow: "hidden",
    ...tenantSoftCard,
  },
});

export const electricUsageCardHeaderStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: EU_BDR,
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: "800", color: EU_T1, letterSpacing: -0.2 },
  sub: { fontSize: 12, color: EU_T2, fontWeight: "600", marginTop: 3 },
});

export const electricUsageScreenIoTStyles = StyleSheet.create({
  mRow: { flexDirection: "row" },
  mVDiv: { width: 1, backgroundColor: EU_BDR },
  mHDiv: { height: 1, backgroundColor: EU_BDR },
  /** Lưới 2×2 — ô tách bạch, dễ đọc hơn thanh chia kẻ. */
  metricGrid: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 10,
  },
  metricGridRow: { flexDirection: "row", gap: 10 },
  metricCell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: neutral.backgroundElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EU_BDR,
    overflow: "hidden",
  },
  eventChip: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  eventChipTxt: { fontSize: 13, fontWeight: "700" },
  waitRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  waitTxt: { fontSize: 13, color: EU_T2, fontWeight: "600" },
  offCard: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
  offTitle: { fontSize: 16, fontWeight: "800", color: neutral.slate600, marginBottom: 6 },
  offSub: { fontSize: 13, color: EU_T2, fontWeight: "600", textAlign: "center", lineHeight: 20 },
  envRow: { flexDirection: "row", gap: 10, padding: 14, flexWrap: "wrap" },
  envCell: {
    flex: 1,
    minWidth: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    alignItems: "center",
    borderColor: EU_BDR,
    backgroundColor: neutral.backgroundElevated,
  },
  envVal: { fontSize: 18, fontWeight: "800" },
  envUnit: { fontSize: 10, fontWeight: "600", color: EU_T2 },
  envLbl: { fontSize: 10, color: EU_T2, fontWeight: "600" },
  distSortRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sortTxt: { fontSize: 12, color: EU_T2, fontWeight: "600" },
  sortActive: { color: brandPrimary, fontWeight: "800" },
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
  distLbl: { fontSize: 13, color: EU_T1, fontWeight: "700", flex: 1 },
  distR: { width: 115, alignItems: "flex-end" },
  distVal: { fontSize: 13, fontWeight: "800", marginBottom: 5 },
  distTrack: {
    width: "100%",
    height: 4,
    backgroundColor: EU_BDR,
    borderRadius: 999,
    overflow: "hidden",
  },
  distFill: { height: "100%", borderRadius: 999 },
  emptyTxt: { fontSize: 13, color: EU_T2, fontWeight: "600", paddingVertical: 8 },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingBottom: 14,
  },
  pagerTxt: { fontSize: 22, color: brandPrimary, fontWeight: "800" },
  pagerMid: { fontSize: 13, fontWeight: "700", color: EU_T2 },
});

export const electricUsageGateStyles = StyleSheet.create({
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
  gateTitle: { fontSize: 18, fontWeight: "800", color: EU_T1, marginBottom: 8 },
  gateBody: { fontSize: 14, color: EU_T2, lineHeight: 22 },
});
