// Screens/CommonComponents/ActionButtonStyle.ts
import { StyleSheet } from "react-native";

const PRIMARY_COLOR = "#1D4ED8"; // Blue
const SECONDARY_COLOR = "#6B7280"; // Gray
const WHITE_COLOR = "#FFFFFF";
const LIGHT_GRAY_BORDER = "#D1D5DB";

export const ActionButtonStyle = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row', // To accommodate icon + text
    minHeight: 50,
    marginVertical: 8, // Margin between buttons if stacked
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: 'center',
  },
  iconWrapper: {
    marginRight: 8, // Space between icon and text
  },
  // Primary Button (Solid)
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  primaryButtonText: {
    color: WHITE_COLOR,
  },
  // Secondary Button (Ghost/Outlined) - Cancel button style
  secondaryButton: {
    backgroundColor: "transparent", // Ghost style
    // borderWidth: 1, // Uncomment for outlined style
    // borderColor: SECONDARY_COLOR, // Uncomment for outlined style
  },
  secondaryButtonText: {
    color: SECONDARY_COLOR, // Default gray for secondary actions
  },
  // Dashed Button (for "Add New...")
  dashedButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: PRIMARY_COLOR, // Use primary color for border
    borderStyle: "dashed",
    paddingVertical: 12, // Slightly less padding for dashed
  },
  dashedButtonText: {
    color: PRIMARY_COLOR,
    fontWeight: "600", // Slightly less bold than primary/secondary
  },
  disabledButton: {
    opacity: 0.6,
  }
});
