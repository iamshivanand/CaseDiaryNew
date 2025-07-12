// Screens/CommonComponents/DatePickerFieldStyle.ts
import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Adjust path as needed

export const getDatePickerFieldStyles = (theme: Theme) => StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: theme.colors.labelText || theme.colors.text,
  },
  dateTouchable: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border || "#D1D5DB",
    borderRadius: 8,
    backgroundColor: theme.colors.inputBackground || theme.colors.background,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.inputText || theme.colors.text,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.placeholderText || "#9CA3AF",
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.errorText || 'red',
    fontSize: 12,
    marginTop: 4,
  },
  // Styles for iOS Picker Modal (can also be themed)
  modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.modalOverlayBg || 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
      backgroundColor: theme.colors.modalBackground || theme.colors.background,
      borderTopRightRadius: 20,
      borderTopLeftRadius: 20,
      padding: 20,
  },
  buttonContainer: { // For Done/Cancel buttons in iOS modal
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
  }
});

// Suggested new theme colors:
// modalOverlayBg?: string;
// modalBackground?: string;
// errorBorder?: string; (already suggested)
// placeholderText?: string; (already suggested)
