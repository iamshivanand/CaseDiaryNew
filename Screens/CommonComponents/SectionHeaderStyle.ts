// Screens/CommonComponents/SectionHeaderStyle.ts
import { StyleSheet } from "react-native";
import { colors, fontSizes } from "../../utils/StyleGuide";

export const getSectionHeaderStyles = () => StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 4,
    // Optional border, can use theme.colors.border
    // borderBottomWidth: 1,
    // borderBottomColor: colors.border || "#E5E7EB",
    // paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text, // Use specific or fallback
  },
});
