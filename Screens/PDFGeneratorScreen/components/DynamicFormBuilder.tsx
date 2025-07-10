import React from 'react';
import { View, TextInput, Text } from 'react-native';
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path as needed
import { getStyles } from '../PDFGeneratorScreenStyles'; // Assuming styles are general enough or create specific ones

export interface FormField {
  name: string;
  placeholder: string;
  type?: 'text' | 'textarea' | 'date' | 'dropdown'; // Add more types as needed
  options?: { label: string; value: string }[]; // For dropdowns
}

interface DynamicFormBuilderProps {
  templateFields: FormField[];
  formValues: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
  theme: any; // Replace 'any' with your actual Theme type
}

const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  templateFields,
  formValues,
  onInputChange,
  theme,
}) => {
  const styles = getStyles(theme); // Use existing styles or create specific ones for the form builder

  if (!templateFields || templateFields.length === 0) {
    return <Text style={styles.placeholderText}>Select a template to see input fields, or no fields are defined for this template.</Text>;
  }

  return (
    <View>
      {templateFields.map((field) => {
        switch (field.type) {
          case 'textarea':
            return (
              <TextInput
                key={field.name}
                placeholder={field.placeholder}
                style={[styles.input, styles.inputMultiline]} // Assuming inputMultiline is defined in getStyles
                value={formValues[field.name] || ''}
                onChangeText={(text) => onInputChange(field.name, text)}
                placeholderTextColor={theme.colors.textMuted || '#888'}
                multiline
                numberOfLines={4} // Default number of lines for textarea
              />
            );
          case 'date':
            // Placeholder for DatePicker component integration
            // For now, it will be a simple TextInput.
            // You would replace this with a <DatePickerField /> or similar.
            return (
              <View key={field.name}>
                <Text style={{ color: theme.colors.text, marginBottom: 5, fontSize: 12 }}>{field.placeholder} (YYYY-MM-DD)</Text>
                <TextInput
                  placeholder={`Enter ${field.placeholder}`}
                  style={styles.input}
                  value={formValues[field.name] || ''}
                  onChangeText={(text) => onInputChange(field.name, text)}
                  placeholderTextColor={theme.colors.textMuted || '#888'}
                  keyboardType="numeric" // Basic type, validation needed
                />
              </View>
            );
          // Add cases for 'dropdown', etc.
          // case 'dropdown':
          //   return (
          //     <DropdownPicker
          //       key={field.name}
          //       items={field.options || []}
          //       selectedValue={formValues[field.name]}
          //       onValueChange={(value) => onInputChange(field.name, value as string)}
          //       placeholder={{ label: field.placeholder, value: null }}
          //       // You'll need to pass theme or styles to DropdownPicker if it's custom
          //     />
          //   );
          case 'text':
          default:
            return (
              <TextInput
                key={field.name}
                placeholder={field.placeholder}
                style={styles.input}
                value={formValues[field.name] || ''}
                onChangeText={(text) => onInputChange(field.name, text)}
                placeholderTextColor={theme.colors.textMuted || '#888'}
              />
            );
        }
      })}
    </View>
  );
};

export default DynamicFormBuilder;
