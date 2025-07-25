import React, { useContext, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "react-native-paper";
import { ThemeContext } from "../../Providers/ThemeProvider";
import ActionButton from "../../Screens/CommonComponents/ActionButton";

const ThemeSettingsScreen = () => {
  const { theme, updateTheme } = useContext(ThemeContext);
  const [fontFamily, setFontFamily] = useState(theme.fonts.fontFamily);
  const [fontSize, setFontSize] = useState(theme.fonts.fontSize);
  const [buttonColor, setButtonColor] = useState(theme.colors.button);

  const handleSave = () => {
    updateTheme({
      fonts: { fontFamily, fontSize },
      colors: { ...theme.colors, button: buttonColor },
    });
  };

  return (
    <View style={styles.container}>
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
      </Picker>
      <Text style={styles.label}>Button Color</Text>
      <Picker
        selectedValue={buttonColor}
        onValueChange={(itemValue) => setButtonColor(itemValue)}
      >
        <Picker.Item label="Blue" value="#007bff" />
        <Picker.Item label="Green" value="#28a745" />
        <Picker.Item label="Red" value="#dc3545" />
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
