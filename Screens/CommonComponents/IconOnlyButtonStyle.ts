// Screens/CommonComponents/IconOnlyButtonStyle.ts
import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Adjust path as needed

export const getIconOnlyButtonStyles = (theme: Theme) => StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    // Example: if you want a themed background on hover/press (more complex for TouchableOpacity)
    // backgroundColor: theme.colors.iconButtonBackground || 'transparent',
  },
  disabled: {
    opacity: 0.5, // Standard way to show disabled for icon buttons
  }
});

// Suggested new theme colors (if background is desired):
// iconButtonBackground?: string;
