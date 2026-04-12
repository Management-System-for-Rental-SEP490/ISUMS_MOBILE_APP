import { StyleSheet } from "react-native";
import {
  brandPrimary,
  brandSecondary,
  brandTintBg,
  neutral,
} from "../../../../shared/theme/color";
import { tenantSoftCard } from "../../../../shared/styles/tenantSoftCard";
import { appTypography } from "../../../../shared/utils/typography";

export const notificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  /** Bọc nhãn + chip ngày — cùng token card với Home / Tiêu thụ. */
  dateFilterCard: {
    ...tenantSoftCard,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  dateFilterLabel: {
    ...appTypography.micro,
    fontWeight: "700",
    color: neutral.slate500,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    ...appTypography.dialogTitle,
    color: neutral.slate900,
    marginBottom: 16,
  },
  sectionTabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: neutral.slate200,
    backgroundColor: neutral.surface,
  },
  sectionTabActive: {
    borderColor: brandPrimary,
    backgroundColor: brandTintBg,
  },
  sectionTabText: {
    ...appTypography.chip,
    fontWeight: "700",
    color: neutral.slate700,
  },
  sectionTabTextActive: {
    color: brandSecondary,
  },
  dateRow: {
    gap: 10,
    paddingBottom: 0,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: neutral.borderMuted,
    marginRight: 10,
    backgroundColor: neutral.canvasMuted,
  },
  dateChipText: {
    ...appTypography.caption,
    fontWeight: "700",
    color: neutral.slate600,
  },
  filterRow: {
    paddingBottom: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: neutral.slate200,
    backgroundColor: neutral.surface,
    marginRight: 10,
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterCount: {
    ...appTypography.cardTitle,
    fontWeight: "800",
  },
  filterLabel: {
    ...appTypography.micro,
    color: neutral.slate500,
    fontWeight: "700",
  },
  paginationRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: neutral.slate200,
    backgroundColor: neutral.surface,
    marginRight: 10,
  },
  pageBtnActive: {
    borderColor: brandPrimary,
    backgroundColor: brandTintBg,
  },
  pageBtnText: {
    ...appTypography.chip,
    fontWeight: "800",
    color: neutral.slate700,
  },
  pageBtnTextActive: {
    color: brandSecondary,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    marginBottom: 12,
    ...tenantSoftCard,
  },
  itemCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: brandPrimary,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconWrapperTicket: {
    backgroundColor: brandTintBg,
  },
  iconWrapperElectric: {
    backgroundColor: brandTintBg,
  },
  iconWrapperWater: {
    backgroundColor: brandTintBg,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    ...appTypography.listTitle,
    color: neutral.slate900,
    marginBottom: 4,
  },
  itemMessage: {
    ...appTypography.secondary,
    color: neutral.slate500,
    lineHeight: 18,
  },
  itemTime: {
    ...appTypography.badge,
    color: neutral.slate400,
    marginTop: 6,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateWrap: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
  },
  emptyIconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: neutral.surface,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderCurve: "continuous",
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyText: {
    ...appTypography.dialogMessage,
    color: neutral.slate700,
    textAlign: "center",
    fontWeight: "700",
  },
  emptyHint: {
    ...appTypography.secondary,
    color: neutral.slate400,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingBlock: {
    paddingVertical: 36,
  },
  loadingMoreBlock: {
    paddingVertical: 16,
  },
  footerHint: {
    ...appTypography.dialogMessage,
    color: neutral.slate400,
    textAlign: "center",
    paddingVertical: 10,
  },
});
