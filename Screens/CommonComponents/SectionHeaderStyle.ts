// Screens/CommonComponents/SectionHeaderStyle.ts
import { StyleSheet } from "react-native";
import { Theme } from "../../Providers/ThemeProvider"; // Adjust path as needed

export const getSectionHeaderStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 4,
    // Optional border, can use theme.colors.border
    // borderBottomWidth: 1,
    // borderBottomColor: theme.colors.border || "#E5E7EB",
    // paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.sectionHeaderText || theme.colors.text, // Use specific or fallback
  },
});

// Suggested new theme color:
// sectionHeaderText?: string;
