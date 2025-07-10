// Screens/CommonComponents/DropdownPickerStyle.ts
import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Adjust path as needed

export const getDropdownPickerStyles = (theme: Theme) => StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: theme.colors.labelText || theme.colors.text,
  },
  pickerContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border || "#D1D5DB",
    borderRadius: 8,
    backgroundColor: theme.colors.inputBackground || theme.colors.background,
    justifyContent: "center",
  },
  picker: {
    color: theme.colors.inputText || theme.colors.text,
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.errorText || 'red',
    fontSize: 12,
    marginTop: 4,
  },
  disabledPickerContainer: { // Style for when the picker is disabled
    backgroundColor: theme.colors.disabledInputBackground || '#E5E7EB', // Example disabled color
    borderColor: theme.colors.disabledBorder || '#D1D5DB',
  }
});

// Add to Theme interface if new specific colors are used:
// labelText?: string; (already suggested for FormInput)
// inputBackground?: string; (already suggested for FormInput)
// inputText?: string; (already suggested for FormInput)
// errorText?: string; (already suggested for FormInput)
// disabledInputBackground?: string;
// disabledBorder?: string;
