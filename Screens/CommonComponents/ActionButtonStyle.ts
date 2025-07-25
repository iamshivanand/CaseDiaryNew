// Screens/CommonComponents/ActionButtonStyle.ts
import { StyleSheet } from "react-native";
import { theme as appTheme } from "../../styles/theme";

export const getActionButtonStyles = (theme: typeof appTheme) =>
  StyleSheet.create({
    button: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      minHeight: 50,
      marginVertical: 8,
    },
    buttonText: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.bold,
      textAlign: "center",
    },
    iconWrapper: {
      marginRight: 8,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    primaryButtonText: {
      color: theme.colors.background,
    },
    secondaryButton: {
      backgroundColor: "transparent",
    },
    secondaryButtonText: {
      color: theme.colors.primary,
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
      fontFamily: theme.fontStyles.semiBold,
    },
    disabledButton: {
      opacity: 0.6,
    },
  });
