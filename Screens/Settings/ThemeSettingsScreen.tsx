import React, { useContext, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "react-native-paper";
import { ThemeContext } from "../../Providers/ThemeProvider";
import ActionButton from "../../Screens/CommonComponents/ActionButton";

const ThemeSettingsScreen = () => {
  const { theme, updateTheme } = useContext(ThemeContext);
  const [primaryColor, setPrimaryColor] = useState(theme.colors.primary);
  const [secondaryColor, setSecondaryColor] = useState(theme.colors.secondary);
  const [accentColor, setAccentColor] = useState(theme.colors.accent);
  const [textColor, setTextColor] = useState(theme.colors.text);
  const [backgroundColor, setBackgroundColor] = useState(
    theme.colors.background
  );
  const [fontFamily, setFontFamily] = useState(
    theme.fonts?.fontFamily || "System"
  );
  const [fontSize, setFontSize] = useState(theme.fonts?.fontSize || 16);

  const handleSave = () => {
    updateTheme({
      colors: {
        ...theme.colors,
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        text: textColor,
        background: backgroundColor,
      },
      fonts: { ...theme.fonts, fontFamily, fontSize },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Primary Color</Text>
      <Picker
        selectedValue={primaryColor}
        onValueChange={(itemValue) => setPrimaryColor(itemValue)}
      >
        <Picker.Item label="Blue" value="#007bff" />
        <Picker.Item label="Green" value="#28a745" />
        <Picker.Item label="Red" value="#dc3545" />
      </Picker>
      <Text style={styles.label}>Secondary Color</Text>
      <Picker
        selectedValue={secondaryColor}
        onValueChange={(itemValue) => setSecondaryColor(itemValue)}
      >
        <Picker.Item label="Gray" value="#6c757d" />
        <Picker.Item label="Yellow" value="#ffc107" />
        <Picker.Item label="Cyan" value="#17a2b8" />
      </Picker>
      <Text style={styles.label}>Accent Color</Text>
      <Picker
        selectedValue={accentColor}
        onValueChange={(itemValue) => setAccentColor(itemValue)}
      >
        <Picker.Item label="Cyan" value="#17a2b8" />
        <Picker.Item label="Magenta" value="#e83e8c" />
        <Picker.Item label="Orange" value="#fd7e14" />
      </Picker>
      <Text style={styles.label}>Text Color</Text>
      <Picker
        selectedValue={textColor}
        onValueChange={(itemValue) => setTextColor(itemValue)}
      >
        <Picker.Item label="Black" value="#000" />
        <Picker.Item label="Dark Gray" value="#343a40" />
        <Picker.Item label="Gray" value="#6c757d" />
      </Picker>
      <Text style={styles.label}>Background Color</Text>
      <Picker
        selectedValue={backgroundColor}
        onValueChange={(itemValue) => setBackgroundColor(itemValue)}
      >
        <Picker.Item label="White" value="#fff" />
        <Picker.Item label="Light Gray" value="#f8f9fa" />
        <Picker.Item label="Dark Gray" value="#343a40" />
      </Picker>
      <Text style={styles.label}>Font Family</Text>
      <Picker
        selectedValue={fontFamily}
        onValueChange={(itemValue) => setFontFamily(itemValue)}
      >
        <Picker.Item label="System" value="System" />
        <Picker.Item label="Helvetica" value="Helvetica" />
        <Picker.Item label="Times New Roman" value="Times New Roman" />
      </Picker>
      <Text style={styles.label}>Font Size</Text>
      <Picker
        selectedValue={fontSize}
        onValueChange={(itemValue) => setFontSize(itemValue)}
      >
        <Picker.Item label="Small" value={12} />
        <Picker.Item label="Medium" value={16} />
        <Picker.Item label="Large" value={20} />
        <Picker.Item label="X-Large" value={24} />
        <Picker.Item label="XX-Large" value={32} />
      </Picker>
      <ActionButton title="Save" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
  },
});

export default ThemeSettingsScreen;
