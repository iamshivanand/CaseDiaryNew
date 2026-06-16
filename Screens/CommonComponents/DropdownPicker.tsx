import React, { useContext, useState } from "react";
import { View, Text, Platform, TextInput, LayoutAnimation, UIManager } from "react-native";
import { Picker } from "@react-native-picker/picker";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { getDropdownPickerStyles } from "./DropdownPickerStyle";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { DropdownOption } from "../../Types/appTypes";

interface DropdownPickerProps {
  label: string;
  selectedValue: string | number | undefined;
  onValueChange: (itemValue: string | number, itemIndex: number) => void;
  options: DropdownOption[];
  enabled?: boolean;
  error?: string | null;
  placeholder?: string;
  onOtherValueChange?: (text: string) => void;
  otherValue?: string;
  testID?: string;
}

const DropdownPicker: React.FC<DropdownPickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  options,
  enabled = true,
  error,
  placeholder,
  onOtherValueChange,
  otherValue,
  testID,
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = getDropdownPickerStyles(theme);
  const [localOtherValue, setLocalOtherValue] = useState("");

  const displayOtherValue = otherValue !== undefined ? otherValue : localOtherValue;

  const pickerOptions = placeholder
    ? [{ label: placeholder, value: "" } as DropdownOption, ...options]
    : options;

  const handleValueChange = (itemValue: string | number, itemIndex: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onValueChange(itemValue, itemIndex);
    if (itemValue !== "Other") {
      setLocalOtherValue("");
      if (onOtherValueChange) {
        onOtherValueChange("");
      }
    }
  };

  const handleOtherTextChange = (text: string) => {
    setLocalOtherValue(text);
    if (onOtherValueChange) {
      onOtherValueChange(text);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.pickerContainer,
          error ? { borderColor: theme.colors.errorBorder || "red" } : {},
          !enabled ? styles.disabledPickerContainer : {},
        ]}
      >
        <Picker
          testID={testID}
          selectedValue={selectedValue}
          onValueChange={handleValueChange}
          enabled={enabled}
          style={styles.picker}
          dropdownIconColor={
            Platform.OS === "ios"
              ? theme.colors.textSecondary || "#D1D5DB"
              : theme.colors.primary || "#1D4ED8"
          }
          mode="dropdown"
        >
          {pickerOptions.map((option, index) => (
            <Picker.Item
              key={option.value?.toString() || index.toString()}
              label={option.label}
              value={option.value}
              color={
                option.value === "" && placeholder
                  ? theme.colors.placeholderText || "#9CA3AF"
                  : styles.picker.color
              }
            />
          ))}
        </Picker>
      </View>
      {selectedValue === "Other" && (
        <TextInput
          style={styles.otherInput}
          placeholder="Please specify"
          value={displayOtherValue}
          onChangeText={handleOtherTextChange}
        />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default DropdownPicker;
