// Screens/CommonComponents/SectionHeader.tsx
import React, { useContext } from "react"; // Added useContext
import { View, Text, ViewStyle, TextStyle } from "react-native";
import { getSectionHeaderStyles } from "./SectionHeaderStyle"; // Import function
import { ThemeContext } from "../../Providers/ThemeProvider"; // Adjust path

interface SectionHeaderProps {
  title: string;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, containerStyle, titleStyle }) => {
  const { theme } = useContext(ThemeContext);
  const styles = getSectionHeaderStyles(theme); // Generate styles

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
    </View>
  );
};

export default SectionHeader;
