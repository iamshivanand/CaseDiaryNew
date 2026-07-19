// Screens/CommonComponents/FormInput.tsx
import React, { useContext, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardTypeOptions,
  TextInputProps,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFormInputStyles } from "./FormInputStyle";
import { ThemeContext } from "../../Providers/ThemeProvider";
import SuggestionInput from "./SuggestionsInput";
import { getHindiCandidates } from "../../utils/transliterationService";
import * as Contacts from "expo-contacts";

interface FormInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string | null;
  suggestions?: string[];
  allowTransliteration?: boolean;
  showContactPicker?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value = "",
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  multiline = false,
  numberOfLines,
  error,
  style,
  suggestions,
  allowTransliteration: explicitAllowTransliteration,
  showContactPicker = false,
  ...rest
}) => {
  const { theme } = useContext(ThemeContext);
  const styles = getFormInputStyles(theme);

  const [isTransliterationActive, setIsTransliterationActive] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [currentEnglishWord, setCurrentEnglishWord] = useState("");

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Transliteration is allowed on default text/multiline inputs that are not secure
  const allowTransliteration =
    explicitAllowTransliteration !== undefined
      ? explicitAllowTransliteration
      : (keyboardType === "default" && !secureTextEntry && !suggestions);

  if (suggestions !== undefined) {
    return (
      <SuggestionInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        suggestions={suggestions}
        onBlur={() => {}}
        error={error}
      />
    );
  }

  const handleTextChange = async (text: string) => {
    if (!onChangeText) return;

    if (!isTransliterationActive) {
      onChangeText(text);
      return;
    }

    // Call standard change first so user typing is reflected instantly
    onChangeText(text);

    const lastChar = text[text.length - 1];
    const isBackspace = value && text.length < value.length;

    // 1. Commit active word if spacebar is typed and candidates exist
    if (lastChar === " " && !isBackspace && currentEnglishWord) {
      if (candidates.length > 0) {
        const topCandidate = candidates[0];
        const textWithoutSpace = text.substring(0, text.length - 1);
        const index = textWithoutSpace.lastIndexOf(currentEnglishWord);
        if (index !== -1) {
          const newText = textWithoutSpace.substring(0, index) + topCandidate + " ";
          onChangeText(newText);
        }
        setCandidates([]);
        setCurrentEnglishWord("");
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        return;
      }
    }

    // 2. Identify the active trailing English word being typed (continuous letters at the end)
    const wordMatch = text.match(/([a-zA-Z]+)$/);
    const activeWord = wordMatch ? wordMatch[1] : "";

    if (activeWord) {
      setCurrentEnglishWord(activeWord);
      // Trigger debounced suggestion fetch
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(async () => {
        const hindiCandidates = await getHindiCandidates(activeWord);
        setCandidates(hindiCandidates);
      }, 180);
    } else {
      setCurrentEnglishWord("");
      setCandidates([]);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    }
  };

  const handleSelectCandidate = (candidate: string) => {
    if (!onChangeText || !value || !currentEnglishWord) return;

    const index = value.lastIndexOf(currentEnglishWord);
    if (index !== -1) {
      const newText = value.substring(0, index) + candidate + " ";
      onChangeText(newText);
    }
    setCandidates([]);
    setCurrentEnglishWord("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  const handleContactPick = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const contact = await Contacts.presentContactPickerAsync();
        if (contact) {
          const phoneNumbers = contact.phoneNumbers || [];
          if (phoneNumbers.length > 0) {
            let selectedNumber = phoneNumbers[0].number || "";
            // Clean up formatting
            selectedNumber = selectedNumber
              .replace(/\s+/g, "")
              .replace(/-+/g, "")
              .replace(/\(+/g, "")
              .replace(/\)+/g, "");
            if (onChangeText) {
              onChangeText(selectedNumber);
            }
          } else {
            Alert.alert("No Phone Number", "The selected contact does not have a phone number.");
          }
        }
      } else {
        Alert.alert("Permission Denied", "Permission to access contacts is required to use this option.");
      }
    } catch (e) {
      console.error("Error picking contact", e);
      Alert.alert("Error", "Could not load phone contact list.");
    }
  };

  return (
    <View style={styles.inputContainer}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={[styles.label, { marginBottom: 0, flex: 1, marginRight: 8 }]}>{label}</Text>
        {allowTransliteration && (
          <TouchableOpacity
            onPress={() => {
              setIsTransliterationActive(!isTransliterationActive);
              setCandidates([]);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isTransliterationActive ? theme.colors.primary + "15" : "transparent",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isTransliterationActive ? theme.colors.primary : "transparent",
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="language-outline"
              size={14}
              color={isTransliterationActive ? theme.colors.primary : theme.colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "bold",
                color: isTransliterationActive ? theme.colors.primary : theme.colors.textSecondary,
              }}
            >
              {isTransliterationActive ? "Hindi (अ)" : "English"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TextInput
          style={[
            styles.textInput,
            { flex: 1 },
            multiline ? styles.textInputMultiline : { height: 48 },
            error ? { borderColor: theme.colors.danger } : {},
            style,
          ]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines || 4 : 1}
          placeholderTextColor={theme.colors.textSecondary}
          {...rest}
        />
        {showContactPicker && (
          <TouchableOpacity
            onPress={handleContactPick}
            style={{
              paddingHorizontal: 12,
              backgroundColor: theme.colors.primary + "15",
              borderRadius: 8,
              marginLeft: 8,
              borderWidth: 1,
              borderColor: theme.colors.primary,
              height: 48,
              alignItems: "center",
              justifyContent: "center"
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {isTransliterationActive && candidates.length > 0 && (
        <View style={styles.candidatesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.candidatesScroll}
            keyboardShouldPersistTaps="handled"
          >
            {candidates.map((cand, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.candidateChip}
                onPress={() => handleSelectCandidate(cand)}
                activeOpacity={0.6}
              >
                <Text style={styles.candidateText}>{cand}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isTransliterationActive && (
        <Text style={styles.dictationHintText}>
          Tip: You can also tap the keyboard microphone (🎙️) for native English/Hindi dictation.
        </Text>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormInput;
