import { StyleSheet } from "react-native";
import {
  BRAND_DANGER,
  brandDangerBg,
  brandDangerBorder,
  neutral,
  statusBadgeBg,
} from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils/typography";

export const tenantItemDescriptionStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: neutral.backgroundSubtle },
  scrollContent: { padding: 16, paddingTop: 12 },
  descriptionCard: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    padding: 16,
  },
  descriptionTitle: {
    ...appTypography.cardTitle,
    fontWeight: "600",
    color: neutral.text,
    marginBottom: 16,
  },
  descriptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.background,
  },
  descriptionRowLast: { borderBottomWidth: 0 },
  descriptionLabel: {
    ...appTypography.labelRow,
    color: neutral.textSecondary,
    flex: 0.35,
  },
  descriptionValue: {
    ...appTypography.labelRowValue,
    color: neutral.text,
    flex: 0.65,
  },
  descriptionStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  descriptionStatusAvailable: { backgroundColor: statusBadgeBg.available },
  descriptionStatusInUse: { backgroundColor: statusBadgeBg.inUse },
  descriptionStatusDisposed: { backgroundColor: statusBadgeBg.disposed },
  descriptionStatusOther: { backgroundColor: neutral.background },
  descriptionEditBtn: {
    marginTop: 20,
    backgroundColor: BRAND_DANGER,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  descriptionEditBtnContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  descriptionEditBtnText: {
    ...appTypography.dialogButton,
    color: neutral.surface,
  },
  errorBanner: {
    backgroundColor: brandDangerBg,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brandDangerBorder,
  },
  errorBannerText: {
    ...appTypography.secondary,
    color: BRAND_DANGER,
    fontWeight: "500",
  },
});
