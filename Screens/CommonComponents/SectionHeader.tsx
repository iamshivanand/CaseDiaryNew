// Screens/CommonComponents/SectionHeader.tsx
import React from "react";
import { View, Text, ViewStyle, TextStyle } from "react-native";
import { SectionHeaderStyles } from "./SectionHeaderStyle";

interface SectionHeaderProps {
  title: string;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, containerStyle, titleStyle }) => {
  return (
    <View style={[SectionHeaderStyles.container, containerStyle]}>
      <Text style={[SectionHeaderStyles.title, titleStyle]}>{title}</Text>
    </View>
  );
};

export default SectionHeader;
