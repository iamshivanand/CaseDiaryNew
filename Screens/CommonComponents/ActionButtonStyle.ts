// Screens/CommonComponents/ActionButtonStyle.ts
import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Adjust path as needed

export const getActionButtonStyles = (theme: Theme) => StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    minHeight: 50,
    marginVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: 'center',
  },
  iconWrapper: {
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    // Assuming primary button text is light/white on a dark primary color
    color: theme.colors.primaryButtonText || theme.colors.background,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    // For outlined secondary:
    // borderWidth: 1,
    // borderColor: theme.colors.textSecondary || '#6B7280',
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary || theme.colors.primary, // Fallback to primary for secondary text if textSecondary not defined
  },
  dashedButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: "dashed",
    paddingVertical: 12,
  },
  dashedButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  }
});
