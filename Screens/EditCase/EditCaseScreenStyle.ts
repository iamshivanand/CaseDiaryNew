// Screens/EditCase/EditCaseScreenStyle.ts
import { StyleSheet, Dimensions } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Import Theme type

const { width } = Dimensions.get("window");

export const getEditCaseScreenStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.screenBackground || theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
      paddingBottom: 60, // Padding at bottom to prevent floating tab bar overlaps
    },
    formContainer: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 20,
    },
    listContainer: {
      marginBottom: 20,
    },
    addNewButtonContainer: {
      marginTop: 8,
    },
    fullWidthDashedButton: {
      width: "100%",
    },
    bottomButtonContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border || "#E5E7EB",
    },
    buttonWrapper: {
      flex: 1,
      marginHorizontal: 6,
    },
    centeredMessageContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
    },
    emptyListText: {
      textAlign: "center",
      color: theme.colors.textSecondary || "#6B7280",
      fontSize: 14,
      paddingVertical: 20,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    loader: {
      marginVertical: 20,
    },
  });
