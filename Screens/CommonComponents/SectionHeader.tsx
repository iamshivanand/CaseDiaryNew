// Screens/CommonComponents/SectionHeader.tsx
import React from "react";
import { View, Text, ViewStyle, TextStyle } from "react-native";
import { getSectionHeaderStyles } from "./SectionHeaderStyle"; // Import function

interface SectionHeaderProps {
  title: string;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, containerStyle, titleStyle }) => {
  const styles = getSectionHeaderStyles(); // Generate styles

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
    </View>
  );
};

export default SectionHeader;
