import { StyleSheet } from "react-native";
import { brandPrimary, neutral } from "../../../../shared/theme/color";
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
    paddingBottom: 24,
  },
  card: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
    width: 90,
    color: neutral.textSecondary,
  },
  houseValue: {
    ...appTypography.labelRowValue,
    flex: 1,
    color: neutral.text,
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
});

export default tenantHouseStyles;
