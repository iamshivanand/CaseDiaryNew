// Screens/CommonComponents/DatePickerFieldStyle.ts
import { StyleSheet } from "react-native";

export const DatePickerFieldStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  dateTouchable: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FFF",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#111827",
  },
  placeholderText: {
    fontSize: 16,
    color: "#9CA3AF", // Placeholder text color
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
