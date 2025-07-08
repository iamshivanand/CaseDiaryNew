// Screens/CommonComponents/FormInput.tsx
import React from "react";
import { View, Text, TextInput, KeyboardTypeOptions, TextInputProps } from "react-native";
import { FormInputStyles } from "./FormInputStyle";

interface FormInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void; // Make sure this is included
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string | null;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  multiline = false,
  numberOfLines,
  error,
  style, // Allow overriding or extending styles
  ...rest
}) => {
  return (
    <View style={FormInputStyles.inputContainer}>
      <Text style={FormInputStyles.label}>{label}</Text>
      <TextInput
        style={[
          FormInputStyles.textInput,
          multiline && FormInputStyles.textInputMultiline,
          error ? { borderColor: 'red' } : {},
          style // Apply custom styles passed via props
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines || 4 : 1}
        placeholderTextColor="#9CA3AF"
        {...rest}
      />
      {error && <Text style={FormInputStyles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormInput;
