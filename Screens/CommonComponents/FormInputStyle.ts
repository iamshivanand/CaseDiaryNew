// Screens/CommonComponents/FormInputStyle.ts
import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Adjust path as needed

export const getFormInputStyles = (theme: Theme) => StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: theme.colors.text,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border || "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.inputBackground || theme.colors.background,
    fontSize: 16,
    color: theme.colors.text,
  },
  textInputMultiline: {
    height: undefined, // Clear height restriction for multiline
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  candidatesContainer: {
    marginTop: 6,
    paddingVertical: 4,
  },
  candidatesScroll: {
    flexDirection: "row",
    alignItems: "center",
  },
  candidateChip: {
    backgroundColor: theme.colors.border || "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  candidateText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "600",
  },
  dictationHintText: {
    fontSize: 11,
    color: theme.colors.textSecondary || "#64748B",
    marginTop: 4,
    fontStyle: "italic",
  }
});
