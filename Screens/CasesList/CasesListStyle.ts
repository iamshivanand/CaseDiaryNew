import { StyleSheet } from 'react-native';
import { colors, fontSizes } from '../../utils/StyleGuide';

export const getCasesListStyles = () => {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
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
      backgroundColor: colors.componentBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      height: 44,
      fontSize: 16,
      color: colors.text,
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
      backgroundColor: colors.primary,
    },
    inactiveButton: {
      backgroundColor: colors.componentBackground,
    },
    activeButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: "600",
    },
    inactiveButtonText: {
      color: colors.text,
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
      color: colors.textSecondary,
    },
  });
};
