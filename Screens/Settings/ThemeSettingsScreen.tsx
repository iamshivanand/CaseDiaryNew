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
  const [fontFamily, setFontFamily] = useState(theme.fonts.fontFamily);

  const handleSave = () => {
    updateTheme({
      colors: {
        ...theme.colors,
        primary: primaryColor,
        secondary: secondaryColor,
      },
      fonts: { ...theme.fonts, fontFamily },
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
      <Text style={styles.label}>Font Family</Text>
      <Picker
        selectedValue={fontFamily}
        onValueChange={(itemValue) => setFontFamily(itemValue)}
      >
        <Picker.Item label="System" value="System" />
        <Picker.Item label="Helvetica" value="Helvetica" />
        <Picker.Item label="Times New Roman" value="Times New Roman" />
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
