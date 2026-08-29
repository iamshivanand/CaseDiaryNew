import { Ionicons } from "@expo/vector-icons";
import React, { useState, useMemo, useContext, useRef } from "react";
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";

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
  const [isFocused, setIsFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Compute filtered suggestions derived directly from the value and suggestions props
  const filteredSuggestions = useMemo(() => {
    if (!value || isDismissed) return [];
    const trimmedVal = value.trim().toLowerCase();
    if (!trimmedVal) return [];

    return (suggestions || [])
      .filter(
        (suggestion) =>
          suggestion &&
          suggestion.toLowerCase().includes(trimmedVal) &&
          suggestion.toLowerCase() !== trimmedVal
      )
      .slice(0, 6); // Keep top 6 cleanest matches
  }, [value, suggestions, isDismissed]);

  const handleTextChange = (text: string) => {
    setIsDismissed(false);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    if (onChangeText) {
      onChangeText(suggestion);
    }
    setIsDismissed(true);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    if (onChangeText) {
      onChangeText("");
    }
    setIsDismissed(false);
  };

  const hasSuggestions = filteredSuggestions.length > 0 && !isDismissed;
  const styles = getStyles(theme, !!error, isFocused, hasSuggestions);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Main Input Box */}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => {
            setIsFocused(true);
            setIsDismissed(false);
          }}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary || "#94A3B8"}
          style={styles.textInput}
        />

        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Clear input"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textSecondary || "#94A3B8"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* In-Flow Suggestions Box - Never overlaps or clips other fields */}
      {hasSuggestions && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="sparkles"
                size={13}
                color={theme.colors.primary}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.suggestionsHeaderText}>
                Suggestions (Tap to fill)
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsDismissed(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            style={styles.suggestionsList}
          >
            {filteredSuggestions.map((item, index) => (
              <TouchableOpacity
                key={`${item}-${index}`}
                onPress={() => handleSuggestionSelect(item)}
                style={[
                  styles.suggestionItem,
                  index === filteredSuggestions.length - 1 &&
                    styles.lastSuggestionItem,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={theme.colors.primary}
                  style={styles.suggestionIcon}
                />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {item}
                </Text>
                <View style={styles.fillBadge}>
                  <Text style={styles.fillBadgeText}>Use</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default SuggestionInput;

const getStyles = (
  theme: any,
  hasError: boolean,
  isFocused: boolean,
  hasSuggestions: boolean
) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.colors.text,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: hasError
        ? theme.colors.danger || "#EF4444"
        : isFocused
        ? theme.colors.primary
        : theme.colors.border || "#E2E8F0",
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderBottomLeftRadius: hasSuggestions ? 0 : 10,
      borderBottomRightRadius: hasSuggestions ? 0 : 10,
      backgroundColor: theme.colors.inputBackground || theme.colors.background,
      minHeight: 48,
      paddingHorizontal: 12,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
    },
    clearButton: {
      padding: 4,
      marginLeft: 6,
    },
    suggestionsContainer: {
      borderWidth: 1.5,
      borderTopWidth: 0,
      borderColor: isFocused
        ? theme.colors.primary
        : theme.colors.border || "#E2E8F0",
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      backgroundColor:
        theme.colors.cardBackground ||
        (theme.dark ? "#1E293B" : "#F8FAFC"),
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    suggestionsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.dark ? "#0F172A" : "#F1F5F9",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || "#E2E8F0",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    suggestionsHeaderText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    dismissText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.colors.textSecondary || "#64748B",
    },
    suggestionsList: {
      maxHeight: 180,
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border || "#E2E8F0",
    },
    lastSuggestionItem: {
      borderBottomWidth: 0,
    },
    suggestionIcon: {
      marginRight: 8,
      opacity: 0.8,
    },
    suggestionText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: "500",
    },
    fillBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      backgroundColor: `${theme.colors.primary}1A`,
      marginLeft: 8,
    },
    fillBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    errorText: {
      color: theme.colors.danger || "#EF4444",
      fontSize: 12,
      marginTop: 4,
    },
  });
