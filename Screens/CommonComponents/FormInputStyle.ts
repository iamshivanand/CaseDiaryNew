// Screens/CommonComponents/FormInputStyle.ts
import { StyleSheet } from "react-native";

export const FormInputStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333", // Darker text for labels
  },
  textInput: {
    height: 48, // Slightly taller for better touch target
    borderWidth: 1,
    borderColor: "#D1D5DB", // Softer gray border
    borderRadius: 8, // Softer rounding
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    fontSize: 16,
    color: "#111827", // Input text color
  },
  textInputMultiline: {
    minHeight: 100, // Min height for multiline, can grow
    textAlignVertical: "top", // Align text to the top for multiline
    paddingTop: 12, // Match paddingHorizontal for consistency
  },
  inputContainer: {
    marginBottom: 20, // Space below each input field
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  }
});
