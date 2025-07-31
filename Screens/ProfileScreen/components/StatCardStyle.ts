import { StyleSheet } from 'react-native';
import { Theme } from '../../../Providers/ThemeProvider';

export const getStatCardStyles = (theme: Theme) => {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingVertical: 15,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      marginHorizontal: 5,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
    },
    valueText: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.primary,
      marginBottom: 5,
    },
    unitText: {
      fontSize: 12,
      fontWeight: "normal",
      color: theme.colors.primary,
    },
    labelText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
};
