// Screens/CommonComponents/FormInput.tsx
import React, { useContext } from "react"; // Added useContext
import { View, Text, TextInput, KeyboardTypeOptions, TextInputProps } from "react-native";
import { getFormInputStyles } from "./FormInputStyle"; // Import function
import { ThemeContext } from "../../Providers/ThemeProvider"; // Adjust path

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
  style,
  ...rest
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = getFormInputStyles(theme); // Generate styles

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          error ? { borderColor: theme.colors.errorBorder || 'red' } : {}, // Use theme error border color
          style
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines || 4 : 1}
        placeholderTextColor={theme.colors.placeholderText || "#9CA3AF"} // Use theme placeholder color
        {...rest}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormInput;
