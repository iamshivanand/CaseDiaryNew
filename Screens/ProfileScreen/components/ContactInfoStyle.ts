import { StyleSheet } from 'react-native';
import { Theme } from '../../../Providers/ThemeProvider';

export const getContactInfoStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 15,
      paddingVertical: 10,
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
    editControlsContainer: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      marginTop: 20,
      paddingBottom: 5,
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
