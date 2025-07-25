// Screens/CaseDetailsScreen/components/DocumentCardStyle.ts
import { StyleSheet } from "react-native";
import { theme as appTheme } from "../../../styles/theme";

export const getDocumentCardStyles = (theme: typeof appTheme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    documentIconContainer: {
      marginRight: 16,
      padding: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: 22,
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    documentIcon: {
      color: theme.colors.background,
    },
    textInfoContainer: {
      flex: 1,
      marginRight: 12,
    },
    documentName: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.semiBold,
      color: theme.colors.text,
      marginBottom: 3,
    },
    documentDate: {
      fontSize: theme.fontSizes.caption,
      fontFamily: theme.fontStyles.regular,
      color: theme.colors.secondary,
    },
    downloadIconContainer: {},
  });
