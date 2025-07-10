import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path as needed

export interface Template {
  label: string;
  value: string;
  icon?: string; // Optional: for an icon on the card
}

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: string | null;
  onSelectTemplate: (value: string) => void;
  theme: any; // Replace 'any' with your actual Theme type
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
  theme,
}) => {
  // Styles are defined inside or imported if they are complex and also use the theme
  const styles = StyleSheet.create({
    container: {
      paddingVertical: 10,
    },
    card: {
      backgroundColor: theme.colors.card,
      paddingVertical: 20,
      paddingHorizontal: 15,
      borderRadius: 8,
      marginRight: 10, // Spacing between cards
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 120, // Ensure cards have a decent width
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    selectedCard: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4,
    },
    cardText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
    // Add styles for icons if you use them
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {templates.map((template) => (
        <TouchableOpacity
          key={template.value}
          style={[
            styles.card,
            selectedTemplate === template.value && styles.selectedCard,
          ]}
          onPress={() => onSelectTemplate(template.value)}
        >
          {/* Optional: Render an icon here if template.icon is provided */}
          <Text style={styles.cardText}>{template.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default TemplateSelector;
