import { StyleSheet } from "react-native";
import { neutral } from "../../../../shared/theme/color";
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
});

export default tenantHouseStyles;
