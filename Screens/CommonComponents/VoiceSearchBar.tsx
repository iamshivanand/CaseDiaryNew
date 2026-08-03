import React, { useState, useContext } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import speechRecognitionService from "../../utils/speechRecognitionService";

interface VoiceSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
}

export const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search cases, CNR, client name...",
  onClear,
  autoFocus = false,
  onFocus,
  onSubmitEditing,
}) => {
  const { theme } = useContext(ThemeContext);
  const { locale } = useTranslation();
  const [isListening, setIsListening] = useState(false);

  const handleToggleVoiceSearch = async () => {
    if (isListening) {
      await speechRecognitionService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      const dictationLocale = locale === "hi" ? "hi-IN" : "en-IN";
      const started = await speechRecognitionService.startListening(
        dictationLocale,
        {
          onStart: () => setIsListening(true),
          onResult: (text) => {
            if (text) {
              onChangeText(text.trim());
            }
          },
          onError: (err) => {
            setIsListening(false);
            console.warn("Voice search error:", err);
          },
          onEnd: () => setIsListening(false),
        }
      );

      if (!started) {
        setIsListening(false);
        Alert.alert(
          "Permission Required",
          "Microphone permission is required for voice search."
        );
      }
    }
  };

  const handleClear = () => {
    onChangeText("");
    if (onClear) onClear();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: isListening ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Icon
        name="magnify"
        size={22}
        color={theme.colors.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.input, { color: theme.colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        returnKeyType="search"
        autoFocus={autoFocus}
        onFocus={onFocus}
        onSubmitEditing={onSubmitEditing}
      />
      {value ? (
        <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
          <Icon
            name="close-circle"
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      ) : null}

      {/* VOICE SEARCH MIC BUTTON */}
      <TouchableOpacity
        onPress={handleToggleVoiceSearch}
        style={[
          styles.micButton,
          {
            backgroundColor: isListening
              ? "#FF3B3015"
              : `${theme.colors.primary}12`,
            borderColor: isListening ? "#FF3B30" : "transparent",
          },
        ]}
      >
        {isListening ? (
          <View style={styles.listeningContainer}>
            <ActivityIndicator size="small" color="#FF3B30" />
            <Text style={styles.listeningText}>Rec</Text>
          </View>
        ) : (
          <Icon name="microphone" size={20} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 4,
    marginLeft: 4,
  },
  micButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  listeningContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  listeningText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FF3B30",
    marginLeft: 4,
  },
});

export default VoiceSearchBar;
