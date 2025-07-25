// Screens/CaseDetailsScreen/components/DateRowStyle.ts
import { StyleSheet } from "react-native";
import { theme as appTheme } from "../../../styles/theme";

export const getDateRowStyles = (theme: typeof appTheme) =>
  StyleSheet.create({
    rowContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    icon: {
      marginRight: 8,
      color: theme.colors.secondary,
    },
    label: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.regular,
      color: theme.colors.secondary,
      marginRight: 4,
    },
    value: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.semiBold,
      color: theme.colors.text,
    },
    valueNotSet: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.italic,
      color: theme.colors.secondary,
    },
  });
