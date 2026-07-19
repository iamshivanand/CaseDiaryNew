import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Animated } from 'react-native';
import { ThemeContext } from '../../../Providers/ThemeProvider';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

const InputField: React.FC<InputFieldProps> = ({ label, error, style, ...props }) => {
  const { theme } = useContext(ThemeContext);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      // Perform horizontal shaking animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);
  
  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      <TextInput 
        style={[
          styles.input, 
          { 
            borderColor: error ? theme.colors.danger : theme.colors.border, 
            color: theme.colors.text, 
            backgroundColor: theme.colors.inputBackground 
          },
          style
        ]} 
        placeholderTextColor={theme.colors.textSecondary}
        {...props}
      />
      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
      ) : null}
    </Animated.View>
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
  errorText: {
    marginTop: 4,
    fontSize: 12,
  },
});

export default InputField;
