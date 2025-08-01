import { StyleSheet, Platform } from 'react-native';
import { colors, fontSizes } from '../../utils/StyleGuide';

export const getDashboardStyles = () => {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    welcomeCard: {
      backgroundColor: colors.componentBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      shadowColor: colors.border,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    welcomeTitle: {
      fontSize: fontSizes.title,
      fontWeight: 'bold',
      color: colors.text,
    },
    welcomeSubtitle: {
      fontSize: fontSizes.subtitle,
      color: colors.textSecondary,
      marginTop: 4,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickAction: {
      backgroundColor: colors.componentBackground,
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 16,
      alignItems: 'center',
      shadowColor: colors.border,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    quickActionText: {
      marginTop: 8,
      fontSize: fontSizes.body,
      fontWeight: '600',
      color: colors.text,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    emptyMessage: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 20,
      fontSize: fontSizes.body,
    }
  });
};
