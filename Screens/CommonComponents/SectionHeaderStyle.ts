// Screens/CommonComponents/SectionHeaderStyle.ts
import { StyleSheet } from "react-native";
import { theme as appTheme } from "../../styles/theme";

export const getSectionHeaderStyles = (theme: typeof appTheme) =>
  StyleSheet.create({
    container: {
      marginTop: 24,
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    title: {
      fontSize: theme.fontSizes.heading,
      fontFamily: theme.fontStyles.bold,
      color: theme.colors.text,
    },
  });

// Suggested new theme color:
// sectionHeaderText?: string;
