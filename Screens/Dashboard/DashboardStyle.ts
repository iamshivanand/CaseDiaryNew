import { StyleSheet, Platform } from 'react-native';
import { Theme } from '../../Providers/ThemeProvider';

export const getDashboardStyles = (theme: Theme) => {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    welcomeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    welcomeTitle: {
      fontSize: theme?.fontSizes?.title,
      fontWeight: 'bold',
      color: theme?.colors?.text,
    },
    welcomeSubtitle: {
      fontSize: theme?.fontSizes?.large,
      color: theme?.colors?.textSecondary,
      marginTop: 4,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickAction: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 16,
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    quickActionText: {
      marginTop: 8,
      fontSize: theme?.fontSizes?.medium,
      fontWeight: '600',
      color: theme?.colors?.text,
    },
    sectionTitle: {
      fontSize: (theme?.fontSizes?.large || 16) + 2,
      fontWeight: 'bold',
      color: theme?.colors?.text,
      marginBottom: 12,
    },
    emptyMessage: {
      color: theme?.colors?.textSecondary,
      textAlign: 'center',
      marginTop: 20,
      fontSize: theme?.fontSizes?.medium,
    }
  });
};
