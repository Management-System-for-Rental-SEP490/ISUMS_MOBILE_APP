import { StyleSheet } from "react-native";
import { brandPrimary, brandTintBg, neutral } from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils";

const tenantHouseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: neutral.border,
    shadowColor: neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  houseName: {
    ...appTypography.cardTitle,
    color: neutral.text,
    marginBottom: 8,
  },
  houseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  houseLabel: {
    ...appTypography.labelRow,
    minWidth: 110,
    flexShrink: 0,
    color: neutral.textSecondary,
  },
  houseValue: {
    ...appTypography.labelRowValue,
    flex: 1,
    color: neutral.text,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
    alignItems: "stretch",
  },
  setMainButton: {
    flex: 1,
    minWidth: 120,
    backgroundColor: brandPrimary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  setMainButtonText: {
    ...appTypography.caption,
    color: neutral.surface,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  mainHouseBadge: {
    flex: 1,
    minWidth: 120,
    backgroundColor: brandTintBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mainHouseBadgeOnly: {
    flexGrow: 1,
  },
  mainHouseBadgeText: {
    ...appTypography.caption,
    color: brandPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  contractsSectionTitle: {
    ...appTypography.cardTitle,
    color: neutral.text,
    marginTop: 20,
    marginBottom: 10,
  },
  contractLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: neutral.border,
  },
  contractLinkRowLast: {
    borderBottomWidth: 0,
  },
  contractLinkText: {
    ...appTypography.modalListItem,
    flex: 1,
    color: brandPrimary,
    fontWeight: "600",
  },
  paymentBanner: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  paymentBannerText: {
    ...appTypography.labelRowValue,
    color: neutral.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  paymentBannerBtn: {
    alignSelf: "flex-start",
    backgroundColor: brandPrimary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  paymentBannerBtnText: {
    ...appTypography.dialogButton,
    color: neutral.surface,
    fontWeight: "700",
  },
  housePlanSectionWrap: {
    marginTop: 16,
  },
  housePlanEmptyText: {
    ...appTypography.caption,
    color: neutral.textSecondary,
    textAlign: "center",
    marginVertical: 14,
    paddingHorizontal: 8,
  },
  // "Đổi sang nhà này" CTA — appears just below the main house-info card
  // when the user has at least one COMPLETED contract on a different house.
  relocateHereCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    backgroundColor: brandPrimary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: brandPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  relocateHereCardPressed: {
    opacity: 0.92,
  },
  relocateHereIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  relocateHereTextCol: {
    flex: 1,
    minWidth: 0,
  },
  relocateHereTitle: {
    color: neutral.surface,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  relocateHereSubtitle: {
    ...appTypography.caption,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default tenantHouseStyles;
