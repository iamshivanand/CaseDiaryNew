// Screens/CommonComponents/FormInput.tsx
import React, { useContext } from "react";
import { View, Text, TextInput, KeyboardTypeOptions, TextInputProps } from "react-native";
import { getFormInputStyles } from "./FormInputStyle";
import { ThemeContext } from "../../Providers/ThemeProvider";
import SuggestionInput from "./SuggestionsInput";

interface FormInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string | null;
  suggestions?: string[];
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
  style,
  suggestions,
  ...rest
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = getFormInputStyles(theme);

  if (suggestions) {
    return (
      <SuggestionInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        suggestions={suggestions}
        onBlur={() => {}}
      />
    );
  }

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          error ? { borderColor: theme.colors.errorBorder || 'red' } : {},
          style
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines || 4 : 1}
        placeholderTextColor={theme.colors.placeholderText || "#9CA3AF"}
        {...rest}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormInput;
