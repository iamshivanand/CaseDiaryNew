// Screens/CommonComponents/DropdownPickerStyle.ts
import { StyleSheet } from "react-native";

export const DropdownPickerStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  pickerContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FFF",
    justifyContent: "center", // Center the picker item vertically
  },
  picker: {
    // The Picker component itself can be tricky to style universally.
    // Height here might be needed for Android, iOS might ignore.
    // Color is for the selected item text.
    color: "#111827",
    width: "100%", // Ensure picker takes full width of container
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  }
});
