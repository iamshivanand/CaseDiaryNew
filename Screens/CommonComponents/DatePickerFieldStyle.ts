// Screens/CommonComponents/DatePickerFieldStyle.ts
import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Adjust path as needed

export const getDatePickerFieldStyles = (theme: Theme) => StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: theme.colors.text,
  },
  dateTouchable: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.inputBackground,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  modalContainer: {
      backgroundColor: theme.colors.cardBackground,
      borderTopRightRadius: 24,
      borderTopLeftRadius: 24,
      padding: 20,
  },
  buttonContainer: { // For Done/Cancel buttons in iOS modal
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
  }
});
