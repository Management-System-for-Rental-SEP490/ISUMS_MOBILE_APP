import { StyleSheet } from "react-native";
import {
  brandPrimary,
  brandSecondary,
  brandTintBg,
  neutral,
} from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils/typography";

export const notificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
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
    paddingVertical: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: neutral.slate200,
    marginRight: 10,
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
    paddingHorizontal: 20,
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
  alertCard: {
    backgroundColor: neutral.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: neutral.slate200,
    borderLeftWidth: 4,
  },
  alertBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
  },
  alertBadgeText: {
    ...appTypography.badge,
    fontWeight: "800",
  },
  alertBadgeStream: {
    ...appTypography.badge,
    fontWeight: "600",
  },
  alertTitle: {
    ...appTypography.listTitle,
    fontWeight: "800",
    marginBottom: 6,
    lineHeight: 20,
  },
  alertDetail: {
    ...appTypography.secondary,
    color: neutral.slate600,
    lineHeight: 18,
    marginBottom: 10,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  areaBadge: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: neutral.slate200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: "70%",
  },
  areaText: {
    ...appTypography.badge,
    fontWeight: "700",
    color: neutral.slate500,
  },
  alertTime: {
    ...appTypography.badge,
    color: neutral.slate400,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: neutral.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
  emptyText: {
    ...appTypography.dialogMessage,
    color: neutral.slate400,
    textAlign: "center",
  },
  emptyStateWrap: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingBlock: {
    paddingVertical: 30,
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
