import React, { useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext, Theme } from '../../Providers/ThemeProvider';
import ColorPalette from './components/ColorPalette';

const availableColors = {
  primary: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE'],
  secondary: ['#FFC107', '#8E8E93', '#00C7BE', '#E52D65', '#32ADE6', '#E5A62D'],
  background: ['#F9FAFB', '#FFFFFF', '#E5E5EA', '#F2F2F7', '#000000'],
  text: ['#1F2937', '#000000', '#FFFFFF'],
};

const fontSizesOptions: { label: string; sizes: Theme['fontSizes'] }[] = [
  { label: 'Small', sizes: { small: 11, medium: 13, large: 15, title: 22 } },
  { label: 'Medium', sizes: { small: 12, medium: 14, large: 16, title: 24 } },
  { label: 'Large', sizes: { small: 14, medium: 16, large: 18, title: 26 } },
];

const ThemeSettingsScreen = () => {
  const { theme, updateTheme } = useContext(ThemeContext);

  const handleColorChange = (key: keyof Theme['colors'], color: string) => {
    updateTheme({ colors: { ...theme.colors, [key]: color } });
  };

  const handleFontSizeChange = (sizes: Theme['fontSizes']) => {
    updateTheme({ fontSizes: sizes });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Theme Settings</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Primary Color</Text>
        <ColorPalette
          colors={availableColors.primary}
          selectedColor={theme.colors.primary}
          onSelectColor={(color) => handleColorChange('primary', color)}
          theme={theme}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Secondary Color</Text>
        <ColorPalette
          colors={availableColors.secondary}
          selectedColor={theme.colors.secondary}
          onSelectColor={(color) => handleColorChange('secondary', color)}
          theme={theme}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Background Color</Text>
        <ColorPalette
          colors={availableColors.background}
          selectedColor={theme.colors.background}
          onSelectColor={(color) => handleColorChange('background', color)}
          theme={theme}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Text Color</Text>
        <ColorPalette
          colors={availableColors.text}
          selectedColor={theme.colors.text}
          onSelectColor={(color) => handleColorChange('text', color)}
          theme={theme}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Font Size</Text>
        <View style={styles.fontButtonsContainer}>
          {fontSizesOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.fontButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                theme.fontSizes.medium === option.sizes.medium && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleFontSizeChange(option.sizes)}
            >
              <Text style={[styles.fontButtonText, { color: theme.fontSizes.medium === option.sizes.medium ? theme.colors.surface : theme.colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fontButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fontButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  fontButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ThemeSettingsScreen;
