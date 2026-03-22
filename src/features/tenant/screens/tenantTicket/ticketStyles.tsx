import { StyleSheet } from "react-native";
import {
  BRAND_DANGER,
  brandSecondary,
  neutral,
} from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils/typography";

export const ticketStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    ...appTypography.dialogButton,
    color: neutral.text,
  },
  title: {
    ...appTypography.ticketScreenTitle,
    marginBottom: 24,
    color: neutral.text,
  },
  deviceInfoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...appTypography.cardTitle,
    fontWeight: "600",
    marginBottom: 12,
    color: neutral.text,
  },
  deviceInfoCard: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: neutral.border,
  },
  deviceInfoLabel: {
    ...appTypography.labelRow,
    color: neutral.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  deviceInfoValue: {
    ...appTypography.modalListItem,
    fontWeight: "500",
    color: neutral.text,
    marginBottom: 4,
  },
  formSection: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: neutral.border,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...appTypography.dialogButton,
    fontWeight: "500",
    color: neutral.text,
    marginBottom: 8,
  },
  required: {
    color: BRAND_DANGER,
  },
  input: {
    borderWidth: 1,
    borderColor: neutral.inputBorder,
    borderRadius: 8,
    padding: 12,
    ...appTypography.dialogButton,
    fontWeight: "400",
    color: neutral.text,
    backgroundColor: neutral.surface,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  priorityContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: neutral.inputBorder,
    backgroundColor: neutral.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityButtonActive: {
    backgroundColor: brandSecondary,
    borderColor: brandSecondary,
  },
  priorityButtonText: {
    ...appTypography.body,
    fontWeight: "500",
    color: neutral.textSecondary,
    textAlign: "center",
  },
  priorityButtonTextActive: {
    color: neutral.surface,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: brandSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: brandSecondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: neutral.surface,
    ...appTypography.dialogButton,
  },
});
