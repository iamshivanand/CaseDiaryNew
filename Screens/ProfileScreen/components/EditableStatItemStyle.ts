import { StyleSheet } from 'react-native';
import { Theme } from '../../../Providers/ThemeProvider';

export const getEditableStatItemStyles = (theme: Theme) => {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingVertical: 15,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginHorizontal: 5,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
      position: 'relative',
    },
    editingCard: {
      paddingVertical: 20,
    },
    editIcon: {
      position: 'absolute',
      top: 8,
      right: 8,
      padding: 4,
    },
    valueText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 5,
    },
    unitText: {
      fontSize: 12,
      fontWeight: 'normal',
      color: theme.colors.primary,
    },
    labelText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    labelEditing: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      fontWeight: '600',
    },
    textInput: {
      fontSize: 18,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      width: '80%',
      textAlign: 'center',
      marginBottom: 15,
      backgroundColor: theme.colors.background,
    },
    editControlsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      width: '100%',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      minWidth: 90,
      justifyContent: 'center',
    },
    saveButton: {
      backgroundColor: theme.colors.success,
    },
    cancelButton: {
      backgroundColor: theme.colors.error,
    },
    buttonText: {
      color: '#FFFFFF',
      marginLeft: 5,
      fontWeight: '500',
      fontSize: 13,
    },
  });
};
