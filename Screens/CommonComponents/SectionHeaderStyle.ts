// Screens/CommonComponents/SectionHeaderStyle.ts
import { StyleSheet } from "react-native";

export const SectionHeaderStyles = StyleSheet.create({
  container: {
    marginTop: 24, // Space above the section header
    marginBottom: 16, // Space below the header, before the content
    paddingHorizontal: 4, // Slight horizontal padding if needed, adjust based on screen layout
    // borderBottomWidth: 1, // Optional: add a line under the header
    // borderBottomColor: "#E5E7EB",
    // paddingBottom: 8,
  },
  title: {
    fontSize: 20, // Larger font for section titles
    fontWeight: "bold",
    color: "#1F2937", // A slightly softer black
  },
});
