// Screens/CommonComponents/IconOnlyButtonStyle.ts
import { StyleSheet } from "react-native";

export const IconOnlyButtonStyle = StyleSheet.create({
  button: {
    padding: 8, // Adequate touch area
    borderRadius: 20, // Circular or rounded square, adjust as needed
    justifyContent: "center",
    alignItems: "center",
    // Example: specify a min width/height if icons vary a lot in size
    // minWidth: 36,
    // minHeight: 36,
  },
  disabled: {
    opacity: 0.5,
  }
});
