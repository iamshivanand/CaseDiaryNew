import React, { useState, useMemo, useContext } from "react";
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import { ThemeContext } from "../../Providers/ThemeProvider";

interface SuggestionInputProps {
  label: string;
  placeholder?: string;
  value?: string;
  suggestions?: string[];
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  error?: string | null;
}

const SuggestionInput: React.FC<SuggestionInputProps> = ({
  label,
  placeholder,
  value = "",
  suggestions = [],
  onChangeText,
  onBlur,
  error,
}) => {
  const { theme } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);

  // Compute filtered suggestions derived directly from the value and suggestions props
  const filteredSuggestions = useMemo(() => {
    if (!value) return [];
    return (suggestions || []).filter(
      (suggestion) =>
        suggestion &&
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        suggestion.toLowerCase() !== value.toLowerCase() // Hide suggestion if it matches input exactly
    );
  }, [value, suggestions]);

  const handleTextChange = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }
    setIsOpen(!!text);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    if (onChangeText) {
      onChangeText(suggestion);
    }
    setIsOpen(false);
  };

  const styles = getStyles(theme, !!error);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.autocompleteWrapper}>
        <Autocomplete
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.dropdownContainer}
          inputContainerStyle={styles.inputContainer}
          data={
            isOpen && filteredSuggestions.length > 0 ? filteredSuggestions : []
          }
          defaultValue={value}
          onChangeText={handleTextChange}
          onBlur={() => {
            if (onBlur) onBlur();
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary || "#9CA3AF"}
          style={styles.textInput}
          renderResultList={(props: any) => (
            <ScrollView {...props} style={styles.resultList} keyboardShouldPersistTaps="handled">
              {filteredSuggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSuggestionSelect(item)}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default SuggestionInput;

const getStyles = (theme: any, hasError: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
      color: theme.colors.text,
    },
    autocompleteWrapper: {
      // Autocomplete requires a stable position context to render results absolute/dropdown-style
      position: "relative",
      zIndex: 5,
    },
    dropdownContainer: {
      width: "100%",
    },
    inputContainer: {
      borderWidth: 1,
      borderColor: hasError
        ? (theme.colors.danger || "red")
        : (theme.colors.border || "#E5E7EB"),
      borderRadius: 8,
      backgroundColor: theme.colors.inputBackground || theme.colors.background,
      padding: 0,
    },
    textInput: {
      height: 48,
      paddingHorizontal: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    resultList: {
      maxHeight: 200,
      borderWidth: 1,
      borderColor: theme.colors.border || "#E5E7EB",
      borderRadius: 8,
      backgroundColor: theme.colors.cardBackground || "#FFFFFF",
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      zIndex: 10,
    },
    suggestionItem: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || "#E5E7EB",
    },
    suggestionText: {
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    errorText: {
      color: theme.colors.danger || "red",
      fontSize: 12,
      marginTop: 4,
    },
  });
