import { StyleSheet, Dimensions } from "react-native";
import { brandPrimary } from "../../../../shared/theme/color";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Styles cho màn hình tiêu thụ điện.
 * Đồng bộ với hệ thống: nền #F5F7FA, card trắng, bo góc, shadow nhẹ.
 */
export const electricUsageStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 6,
  },
  areaDropdownLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 1,
  },
  areaDropdownValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
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
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    color: "#64748b",
  },
  areaChipTextActive: {
    color: "#fff",
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    color: "#64748b",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  /** Card chứa biểu đồ */
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 16,
  },
  /** Card realtime (các stat đo điện + biểu đồ sparkline). */
  realtimeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
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
    color: "#334155",
  },
  realtimeTimestamp: {
    fontSize: 11,
    color: "#64748b",
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
    borderColor: "#e2e8f0",
    padding: 12,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
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
    color: "#94a3b8",
  },
  /** Sparkline card realtime. */
  sparkCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
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
    color: "#334155",
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
    color: "#64748b",
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
    color: "#64748b",
  },
});
