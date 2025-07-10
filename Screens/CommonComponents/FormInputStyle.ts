// Screens/CommonComponents/FormInputStyle.ts
import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Adjust path as needed

export const getFormInputStyles = (theme: Theme) => StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: theme.colors.labelText || theme.colors.text, // Assuming labelText or fallback to text
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border || "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.inputBackground || theme.colors.background, // Assuming inputBackground or background
    fontSize: 16,
    color: theme.colors.inputText || theme.colors.text, // Assuming inputText or text
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
    color: theme.colors.errorText || 'red', // Assuming errorText color in theme
    fontSize: 12,
    marginTop: 4,
  }
});

// Add to Theme interface if new specific colors are used:
// labelText?: string;
// inputBackground?: string;
// inputText?: string;
// errorText?: string;
