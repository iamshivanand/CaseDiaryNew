import React, { useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { ThemeContext } from '../../../Providers/ThemeProvider';

interface InputFieldProps extends TextInputProps {
  label: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, style, ...props }) => {
  const { theme } = useContext(ThemeContext);
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      <TextInput 
        style={[
          styles.input, 
          { 
            borderColor: theme.colors.border, 
            color: theme.colors.text, 
            backgroundColor: theme.colors.inputBackground 
          },
          style
        ]} 
        placeholderTextColor={theme.colors.textSecondary}
        {...props} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
});

export default InputField;
