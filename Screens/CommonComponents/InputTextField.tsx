import React from "react";
import { View, Text, TextInput, KeyboardTypeOptions } from "react-native";

import { InputStyles } from "./InputTextFieldStyle";

interface InputFieldProps<T> {
  // Add your prop types here
  placeholder: string;
  inputType: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  value?: T; // Use TypeScript generics for value
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
  const handleChange = (text: string) => {
    if (onChange) {
      onChange(text as T);
    }
  };
  return (
    <>
      <Text style={InputStyles.label}>{label}</Text>
      <TextInput
        style={InputStyles.textInput}
        placeholder={placeholder}
        secureTextEntry={inputType === "password"}
        keyboardType={keyboardType ? keyboardType : "default"}
        value={value as string}
        onChangeText={handleChange}
      />
    </>
  );
};

export default InputTextField;
