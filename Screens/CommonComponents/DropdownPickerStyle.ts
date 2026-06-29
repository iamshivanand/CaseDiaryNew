// Screens/CommonComponents/DropdownPickerStyle.ts
import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Adjust path as needed

export const getDropdownPickerStyles = (theme: Theme) => StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: theme.colors.text,
  },
  pickerContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.inputBackground,
    justifyContent: "center",
  },
  picker: {
    color: theme.colors.text,
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  disabledPickerContainer: { // Style for when the picker is disabled
    backgroundColor: theme.colors.border,
    borderColor: theme.colors.border,
  },
  otherInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    marginTop: 10,
    fontSize: 16,
  },
});
