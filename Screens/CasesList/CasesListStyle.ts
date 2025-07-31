import { StyleSheet } from 'react-native';
import { Theme } from '../../Providers/ThemeProvider';

export const getCasesListStyles = (theme: Theme) => {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    addButton: {
      padding: 6,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      height: 44,
      fontSize: 16,
      color: theme.colors.text,
    },
    toggleContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 8,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: "center",
      marginHorizontal: 5,
    },
    activeButton: {
      backgroundColor: theme.colors.primary,
    },
    inactiveButton: {
      backgroundColor: theme.colors.disabledInputBackground,
    },
    activeButtonText: {
      color: theme.colors.surface,
      fontSize: 15,
      fontWeight: "600",
    },
    inactiveButtonText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    listContentContainer: {
      paddingBottom: 16,
    },
    emptyListContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 50,
    },
    emptyListText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
  });
};
