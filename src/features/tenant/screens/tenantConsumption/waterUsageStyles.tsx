import { StyleSheet, Dimensions } from "react-native";
import { neutral, waterAccent } from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
    paddingHorizontal: 20,
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
