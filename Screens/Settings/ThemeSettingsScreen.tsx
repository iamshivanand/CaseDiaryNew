import React, { useContext, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import ColorPalette from "react-native-color-palette";
import { useTheme } from "react-native-paper";
import { ThemeContext } from "../../Providers/ThemeProvider";
import ActionButton from "../../Screens/CommonComponents/ActionButton";
import ConfirmationPopup from "../../Screens/CommonComponents/Popup";

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
  const [isPopupVisible, setIsPopupVisible] = useState(false);

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
    setIsPopupVisible(true);
  };

  return (
    <View style={styles.container}>
      <ConfirmationPopup
        isVisible={isPopupVisible}
        message="Theme settings saved successfully!"
        onCancel={() => setIsPopupVisible(false)}
        onConfirm={() => setIsPopupVisible(false)}
      />
      <Text style={styles.label}>Primary Color</Text>
      <ColorPalette
        onChange={(color) => setPrimaryColor(color)}
        value={primaryColor}
        colors={["#007bff", "#28a745", "#dc3545"]}
        title={""}
        icon={<Text>✔</Text>}
      />
      <Text style={styles.label}>Secondary Color</Text>
      <ColorPalette
        onChange={(color) => setSecondaryColor(color)}
        value={secondaryColor}
        colors={["#6c757d", "#ffc107", "#17a2b8"]}
        title={""}
        icon={<Text>✔</Text>}
      />
      <Text style={styles.label}>Accent Color</Text>
      <ColorPalette
        onChange={(color) => setAccentColor(color)}
        value={accentColor}
        colors={["#17a2b8", "#e83e8c", "#fd7e14"]}
        title={""}
        icon={<Text>✔</Text>}
      />
      <Text style={styles.label}>Text Color</Text>
      <ColorPalette
        onChange={(color) => setTextColor(color)}
        value={textColor}
        colors={["#000", "#343a40", "#6c757d"]}
        title={""}
        icon={<Text>✔</Text>}
      />
      <Text style={styles.label}>Background Color</Text>
      <ColorPalette
        onChange={(color) => setBackgroundColor(color)}
        value={backgroundColor}
        colors={["#fff", "#f8f9fa", "#343a40"]}
        title={""}
        icon={<Text>✔</Text>}
      />
      <Text style={styles.label}>Font Family</Text>
      <Picker
        selectedValue={fontFamily}
        onValueChange={(itemValue) => setFontFamily(itemValue)}
      >
        <Picker.Item
          label="Roboto"
          value="Roboto-Regular"
          style={{ fontFamily: "Roboto-Regular" }}
        />
        <Picker.Item
          label="Roboto Bold"
          value="Roboto-Bold"
          style={{ fontFamily: "Roboto-Bold" }}
        />
        <Picker.Item
          label="Roboto Italic"
          value="Roboto-Italic"
          style={{ fontFamily: "Roboto-Italic" }}
        />
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
