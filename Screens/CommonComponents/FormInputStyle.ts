// Screens/CommonComponents/FormInputStyle.ts
import { StyleSheet } from "react-native";
import { theme as appTheme } from "../../styles/theme";

export const getFormInputStyles = (theme: typeof appTheme) =>
  StyleSheet.create({
    label: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.bold,
      marginBottom: 8,
      color: theme.colors.text,
    },
    textInput: {
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.secondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.background,
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fontStyles.regular,
      color: theme.colors.text,
    },
    textInputMultiline: {
      minHeight: 100,
      textAlignVertical: "top",
      paddingTop: 12,
    },
    inputContainer: {
      marginBottom: 20,
    },
    errorText: {
      color: "red",
      fontSize: theme.fontSizes.caption,
      fontFamily: theme.fontStyles.regular,
      marginTop: 4,
    },
  });

// Add to Theme interface if new specific colors are used:
// labelText?: string;
// inputBackground?: string;
// inputText?: string;
// errorText?: string;
