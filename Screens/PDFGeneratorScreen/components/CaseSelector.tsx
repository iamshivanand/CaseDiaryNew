import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemeContext } from '../../../Providers/ThemeProvider'; // Adjust path as needed

export interface CaseOption {
  label: string; // e.g., "Case Title - Case Number"
  value: string; // e.g., Case ID
}

interface CaseSelectorProps {
  cases: CaseOption[];
  selectedCase: string | null;
  onSelectCase: (value: string) => void;
  theme: any; // Replace 'any' with your actual Theme type
  placeholder?: string;
}

const CaseSelector: React.FC<CaseSelectorProps> = ({
  cases,
  selectedCase,
  onSelectCase,
  theme,
  placeholder = "Select a case",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = cases.find(item => item.value === selectedCase)?.label || placeholder;

  // Reusing styles from PDFGeneratorScreenStyles as they are quite generic for dropdowns
  // Or, define specific styles here or import from a shared location if they become complex
  const styles = StyleSheet.create({
    dropdownContainer: {
      backgroundColor: theme.colors.inputBackground || theme.colors.card,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      marginBottom: 12,
      justifyContent: 'center',
    },
    dropdownText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    dropdownPlaceholder: {
      fontSize: 16,
      color: theme.colors.textMuted || '#888',
    },
    dropdownScrollView: {
        maxHeight: 200, // Limit height of the dropdown list
    },
    dropdownItem: {
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.card, // Ensure items have background
    },
    dropdownItemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    listContainer: { // Container for the scrollable list
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 2,
        backgroundColor: theme.colors.card, // Background for the list area
    }
  });

  return (
    <View>
      <TouchableOpacity style={styles.dropdownContainer} onPress={() => setIsOpen(!isOpen)}>
        <Text style={selectedCase ? styles.dropdownText : styles.dropdownPlaceholder}>
          {selectedLabel}
        </Text>
        {/* TODO: Add an icon for dropdown arrow if desired, e.g., a MaterialIcon */}
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.listContainer}>
            <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
            {cases.map((item) => (
                <TouchableOpacity
                key={item.value}
                style={styles.dropdownItem}
                onPress={() => {
                    onSelectCase(item.value);
                    setIsOpen(false);
                }}
                >
                <Text style={styles.dropdownItemText}>{item.label}</Text>
                </TouchableOpacity>
            ))}
            {cases.length === 0 && (
                <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownPlaceholder}>No cases available.</Text>
                </View>
            )}
            </ScrollView>
        </View>
      )}
    </View>
  );
};

export default CaseSelector;
