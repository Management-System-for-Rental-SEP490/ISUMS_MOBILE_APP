import { StyleSheet, Dimensions } from "react-native";

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
    marginBottom: 16,
  },
  /** Thanh category chọn khu vực (horizontal scroll) – không giới hạn chiều cao để chữ không bị cắt */
  categoryScroll: {
    marginBottom: 20,
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 44,
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: "#82A762",
    borderColor: "#82A762",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
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
