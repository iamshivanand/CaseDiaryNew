import React, { useContext } from "react";
import { View, Text, TextInput, KeyboardTypeOptions } from "react-native";

import { getInputStyles } from "./InputTextFieldStyle";
import { ThemeContext } from "../../Providers/ThemeProvider";

interface InputFieldProps<T> {
  placeholder: string;
  inputType: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  value?: T;
  onChange?: (value: T) => void;
}

const InputTextField = <T extends string>({
  placeholder,
  inputType,
  keyboardType,
  label,
  value,
  onChange,
}: InputFieldProps<T>) => {
  const { theme } = useContext(ThemeContext);
  const styles = getInputStyles(theme);

  const handleChange = (text: string) => {
    if (onChange) {
      onChange(text as T);
    }
  };
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry={inputType === "password"}
        keyboardType={keyboardType ? keyboardType : "default"}
        value={value as string}
        onChangeText={handleChange}
      />
    </>
  );
};

export default InputTextField;
