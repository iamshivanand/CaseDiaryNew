// Screens/CommonComponents/DropdownPicker.tsx
import React, { useContext } from "react"; // Added useContext
import { View, Text, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getDropdownPickerStyles } from "./DropdownPickerStyle"; // Import function
import { ThemeContext } from "../../Providers/ThemeProvider"; // Adjust path
import { DropdownOption } from "../../Types/appTypes";

interface DropdownPickerProps {
  label: string;
  selectedValue: string | number | undefined;
  onValueChange: (itemValue: string | number, itemIndex: number) => void;
  options: DropdownOption[];
  enabled?: boolean;
  error?: string | null;
  placeholder?: string; // Optional placeholder text for the first item
}

const DropdownPicker: React.FC<DropdownPickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  options,
  enabled = true,
  error,
  placeholder,
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = getDropdownPickerStyles(theme);

  const pickerOptions = placeholder
    ? [{ label: placeholder, value: "" } as DropdownOption, ...options]
    : options;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.pickerContainer,
        error ? { borderColor: theme.colors.errorBorder || 'red' } : {},
        !enabled ? styles.disabledPickerContainer : {}
      ]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          enabled={enabled}
          style={styles.picker}
          dropdownIconColor={Platform.OS === 'ios' ? (theme.colors.textSecondary || "#D1D5DB") : (theme.colors.primary || "#1D4ED8")}
          mode="dropdown"
        >
          {pickerOptions.map((option, index) => (
            <Picker.Item
              key={option.value?.toString() || index.toString()} // Prefer option.value for key
              label={option.label}
              value={option.value}
              color={(option.value === "" && placeholder) ? (theme.colors.placeholderText || "#9CA3AF") : styles.picker.color}
            />
          ))}
        </Picker>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default DropdownPicker;
