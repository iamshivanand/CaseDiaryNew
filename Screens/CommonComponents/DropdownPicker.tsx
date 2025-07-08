// Screens/CommonComponents/DropdownPicker.tsx
import React from "react";
import { View, Text, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { DropdownPickerStyles } from "./DropdownPickerStyle";
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
  const pickerOptions = placeholder
    ? [{ label: placeholder, value: "" } as DropdownOption, ...options]
    : options;

  return (
    <View style={DropdownPickerStyles.inputContainer}>
      <Text style={DropdownPickerStyles.label}>{label}</Text>
      <View style={[
        DropdownPickerStyles.pickerContainer,
        error ? { borderColor: 'red' } : {},
        !enabled ? { backgroundColor: '#E5E7EB' } : {} // Disabled style
      ]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          enabled={enabled}
          style={DropdownPickerStyles.picker}
          dropdownIconColor={Platform.OS === 'ios' ? "#D1D5DB" : "#1D4ED8"} // iOS uses a chevron, Android an arrow
          mode="dropdown" // Explicitly set mode, 'dialog' is other option for Android
        >
          {pickerOptions.map((option, index) => (
            <Picker.Item
              key={index.toString()} // Using index for key if values might not be unique before selection
              label={option.label}
              value={option.value}
              color={option.value === "" && placeholder ? "#9CA3AF" : undefined} // Style placeholder differently
            />
          ))}
        </Picker>
      </View>
      {error && <Text style={DropdownPickerStyles.errorText}>{error}</Text>}
    </View>
  );
};

export default DropdownPicker;
