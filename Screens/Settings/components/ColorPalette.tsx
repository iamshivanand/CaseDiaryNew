import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Theme } from '../../../Providers/ThemeProvider';

interface ColorPaletteProps {
  colors: string[];
  onSelectColor: (color: string) => void;
  selectedColor: string;
  theme: Theme;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ colors, onSelectColor, selectedColor, theme }) => {
  return (
    <View style={styles.paletteContainer}>
      {colors.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedColor === color && { borderColor: theme.colors.primary, borderWidth: 2 },
          ]}
          onPress={() => onSelectColor(color)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  paletteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 8,
  },
});

export default ColorPalette;
