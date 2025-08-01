import { StyleSheet } from 'react-native';
import { Theme } from '../../Providers/ThemeProvider';

export const getProfileScreenStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 15,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    tabContentContainer: {
      padding: 15,
    },
    tabContentText: {
      fontSize: 18,
      textAlign: 'center',
      paddingVertical: 30,
      color: theme.colors.textSecondary,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  });
};
