// Screens/CaseDetailsScreen/components/TimelineEventItemStyle.ts
import { StyleSheet } from "react-native";
import { theme as appTheme } from "../../../styles/theme";

export const getTimelineEventItemStyles = (theme: typeof appTheme) =>
  StyleSheet.create({
    rowContainer: {
      flexDirection: "row",
      marginBottom: 16,
    },
    indicatorContainer: {
      alignItems: "center",
      marginRight: 12,
      width: 20,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
      zIndex: 1,
      marginTop: 4,
    },
    line: {
      flex: 1,
      width: 2,
      backgroundColor: theme.colors.secondary,
    },
    contentBox: {
      flex: 1,
      padding: 14,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
    },
    dateText: {
      fontSize: theme.fontSizes.caption,
      fontFamily: theme.fontStyles.bold,
      color: theme.colors.text,
      marginBottom: 6,
    },
    descriptionText: {
      fontSize: theme.fontSizes.body,
      lineHeight: 21,
      fontFamily: theme.fontStyles.regular,
      color: theme.colors.secondary,
    },
  });
