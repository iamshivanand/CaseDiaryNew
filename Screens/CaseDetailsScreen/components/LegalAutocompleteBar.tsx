// Screens/CaseDetailsScreen/components/LegalAutocompleteBar.tsx
import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../../Providers/ThemeProvider";

interface LegalAutocompleteBarProps {
  suggestions: string[];
  theme: Theme;
  onSelectSuggestion: (phrase: string) => void;
}

export const LegalAutocompleteBar: React.FC<LegalAutocompleteBarProps> = ({
  suggestions,
  theme,
  onSelectSuggestion,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.headerLabel}>
        <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
        <Text style={styles.headerText}>Legal Suggestions:</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((phrase, idx) => (
          <TouchableOpacity
            key={`${phrase}-${idx}`}
            style={styles.pill}
            onPress={() => onSelectSuggestion(phrase)}
            testID={`autocomplete-pill-${idx}`}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              {phrase}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.inputBackground,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    headerLabel: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 8,
      gap: 4,
    },
    headerText: {
      fontSize: 11,
      fontWeight: "bold",
      color: theme.colors.primary,
      textTransform: "uppercase",
    },
    scrollContent: {
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
    },
    pill: {
      backgroundColor: theme.colors.cardBackground,
      borderColor: theme.colors.border,
      borderWidth: 1,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 14,
      maxWidth: 240,
    },
    pillText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.text,
    },
  });
