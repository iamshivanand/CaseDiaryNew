import { StyleSheet } from 'react-native';
import { Theme } from '../../../Providers/ThemeProvider';

export const getTabSelectorStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
    },
    scrollViewContent: {
      alignItems: 'center',
    },
    tabButton: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 20,
      marginHorizontal: 6,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedTabButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tabButtonText: {
      fontSize: theme.fontSizes.medium,
      fontWeight: "600",
      color: theme.colors.text,
    },
    selectedTabButtonText: {
      color: theme.colors.surface,
    },
  });
};
