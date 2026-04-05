import { StyleSheet } from "react-native";
import { brandPrimary, neutral } from "../theme/color";
import { appTypography } from "../utils/typography";

export const iconStyles = StyleSheet.create({
  iconWrapper: {
    paddingHorizontal: 8,
    flexDirection: "column",
  },
  iconWrapperActive: {
    transform: [{ translateY: -8 }],
  },
  iconCircle: {
    padding: 8,
    borderRadius: 99999,
    backgroundColor: neutral.surface,
    borderColor: "rgba(156, 163, 175, 0.4)",
    alignItems: "center",
  },
  iconCircleActive: {
    borderColor: brandPrimary,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  iconLabel: {
    marginTop: 4,
    ...appTypography.caption,
    color: neutral.textSecondary,
    textAlign: "center",
    width: 72,
  },
  iconLabelActive: {
    ...appTypography.chip,
    color: brandPrimary,
  },
  scanWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  scanCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -30 }],
    shadowColor: brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  scanLabel: {
    display: "none",
    marginTop: -12,
    ...appTypography.caption,
    color: brandPrimary,
    fontWeight: "700",
    textAlign: "center",
  },
});
