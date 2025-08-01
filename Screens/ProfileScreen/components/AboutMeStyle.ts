import { StyleSheet } from 'react-native';
import { Theme } from '../../../Providers/ThemeProvider';

export const getAboutMeStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      padding: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginVertical: 10,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    heading: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    editIcon: {
      padding: 5,
    },
    descriptionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    textInput: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 6,
      padding: 10,
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 15,
      backgroundColor: theme.colors.background,
    },
    editControlsContainer: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      marginTop: 10,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 25,
      minWidth: 120,
      justifyContent: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    saveButton: {
      backgroundColor: theme.colors.success,
    },
    cancelButton: {
      backgroundColor: theme.colors.error,
    },
    buttonText: {
      color: "#FFFFFF",
      marginLeft: 8,
      fontWeight: '600',
      fontSize: 15,
    },
  });
};
