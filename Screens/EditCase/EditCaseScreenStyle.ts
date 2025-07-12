// Screens/EditCase/EditCaseScreenStyle.ts
import { StyleSheet, Dimensions } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Import Theme type

const { width } = Dimensions.get("window");

export const getEditCaseScreenStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.screenBackground || theme.colors.background, // Use a specific screenBg or fallback
    },
    scrollContainer: {
      // This style is for the ScrollView component itself
      flexGrow: 1,
    },
    // If you need styles for the contentContainer of ScrollView, define it separately
    // e.g., scrollContentContainer: { paddingBottom: 20 }
    formContainer: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 20,
    },
    listContainer: {
      // No specific styles needed here if items handle their own background/padding
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
    // Styles for empty list text and centered loader, if used directly in EditCaseScreen
    centeredMessageContainer: {
      // For centering "No documents/timeline" text or loader
      flex: 1, // If it needs to fill space
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
    },
    emptyListText: {
      textAlign: "center",
      color: theme.colors.textSecondary || "#6B7280",
      fontSize: 14,
    },
    loader: {
      // For ActivityIndicator
      marginVertical: 20,
    },
  });
