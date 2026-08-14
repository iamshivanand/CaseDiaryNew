import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Clipboard,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { ThemeContext } from "../../../Providers/ThemeProvider";
import {
  formatOcrTextForDocument,
  extractTextFromImages,
  TextRecognitionScript,
} from "../../../utils/ocrService";

interface OcrReviewModalProps {
  visible: boolean;
  imageUri?: string | null;
  extractedText: string;
  onClose: () => void;
  onImport: (finalText: string) => void;
}

const OcrReviewModal: React.FC<OcrReviewModalProps> = ({
  visible,
  imageUri,
  extractedText,
  onClose,
  onImport,
}) => {
  const { theme } = useContext(ThemeContext);
  const [text, setText] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedScript, setSelectedScript] = useState<TextRecognitionScript>(
    TextRecognitionScript.LATIN
  );

  useEffect(() => {
    if (visible) {
      setText(extractedText || "");
    }
  }, [visible, extractedText]);

  const handleAutoFormat = () => {
    const formatted = formatOcrTextForDocument(text);
    setText(formatted);
    Alert.alert(
      "Auto-Formatted",
      "Paragraphs and line endings cleaned for legal document layout."
    );
  };

  const handleReExtract = async (
    targetScript: TextRecognitionScript = selectedScript
  ) => {
    if (!imageUri) return;
    setIsEnhancing(true);
    try {
      const freshText = await extractTextFromImages([imageUri], targetScript);
      if (freshText && freshText.trim().length > 0) {
        setText(freshText);
        Alert.alert(
          "OCR Refreshed",
          targetScript === TextRecognitionScript.DEVANAGARI
            ? "Re-extracted text using Hindi (Devanagari) model."
            : "Re-extracted text using English (Latin) model."
        );
      } else {
        Alert.alert(
          "OCR Notice",
          "Re-scan finished, but no additional text found."
        );
      }
    } catch (err) {
      console.error("Re-extract OCR error:", err);
      Alert.alert("Error", "Could not re-extract text from image.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleScriptToggle = (script: TextRecognitionScript) => {
    setSelectedScript(script);
    handleReExtract(script);
  };

  const handleCopy = () => {
    if (text) {
      Clipboard.setString(text);
      Alert.alert("Copied", "Extracted text copied to clipboard.");
    }
  };

  const handleImport = () => {
    if (!text || text.trim().length === 0) {
      Alert.alert(
        "Empty Text",
        "There is no text to import into your document. Would you like to proceed or write text first?",
        [
          { text: "Go Back", style: "cancel" },
          {
            text: "Close Modal",
            onPress: onClose,
          },
        ]
      );
      return;
    }
    onImport(text.trim());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER BAR */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.cardBackground,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Review & Edit OCR Text
          </Text>
          <TouchableOpacity
            onPress={handleImport}
            style={styles.importHeaderBtn}
          >
            <Icon
              name="check"
              size={22}
              color="#FFF"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.importHeaderBtnText}>Import</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* IMAGE PREVIEW BOX (If available) */}
          {imageUri ? (
            <View
              style={[
                styles.imageContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.imageLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                📷 Scanned Document Preview
              </Text>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* TOOLBAR ACTIONS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarRow}
          >
            {/* LANGUAGE SCRIPT SELECTOR */}
            <TouchableOpacity
              onPress={() => handleScriptToggle(TextRecognitionScript.LATIN)}
              style={[
                styles.toolChip,
                {
                  backgroundColor:
                    selectedScript === TextRecognitionScript.LATIN
                      ? `${theme.colors.primary}25`
                      : `${theme.colors.cardBackground}`,
                  borderColor:
                    selectedScript === TextRecognitionScript.LATIN
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.toolChipText,
                  {
                    color:
                      selectedScript === TextRecognitionScript.LATIN
                        ? theme.colors.primary
                        : theme.colors.text,
                  },
                ]}
              >
                🇬🇧 English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                handleScriptToggle(TextRecognitionScript.DEVANAGARI)
              }
              style={[
                styles.toolChip,
                {
                  backgroundColor:
                    selectedScript === TextRecognitionScript.DEVANAGARI
                      ? `${theme.colors.primary}25`
                      : `${theme.colors.cardBackground}`,
                  borderColor:
                    selectedScript === TextRecognitionScript.DEVANAGARI
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.toolChipText,
                  {
                    color:
                      selectedScript === TextRecognitionScript.DEVANAGARI
                        ? theme.colors.primary
                        : theme.colors.text,
                  },
                ]}
              >
                🇮🇳 हिंदी (Devanagari)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAutoFormat}
              style={[
                styles.toolChip,
                {
                  backgroundColor: `${theme.colors.primary}18`,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <Icon
                name="auto-fix"
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[styles.toolChipText, { color: theme.colors.primary }]}
              >
                Auto-Format
              </Text>
            </TouchableOpacity>

            {imageUri ? (
              <TouchableOpacity
                onPress={() => handleReExtract(selectedScript)}
                disabled={isEnhancing}
                style={[
                  styles.toolChip,
                  {
                    backgroundColor: `${theme.colors.success}18`,
                    borderColor: theme.colors.success,
                  },
                ]}
              >
                {isEnhancing ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.success}
                    style={{ marginRight: 4 }}
                  />
                ) : (
                  <Icon
                    name="contrast-box"
                    size={16}
                    color={theme.colors.success}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[styles.toolChipText, { color: theme.colors.success }]}
                >
                  Enhance Contrast
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={handleCopy}
              style={[
                styles.toolChip,
                {
                  backgroundColor: `${theme.colors.textSecondary}18`,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon
                name="content-copy"
                size={16}
                color={theme.colors.text}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.toolChipText, { color: theme.colors.text }]}>
                Copy Text
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* EDITABLE TEXT AREA */}
          <Text
            style={[styles.inputLabel, { color: theme.colors.textSecondary }]}
          >
            Extracted Document Text (Edit or type text below):
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="No text recognized. Type your court document content here..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.cardBackground,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
          >
            <Text
              style={[
                styles.cancelBtnText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleImport} style={styles.mainImportBtn}>
            <Icon
              name="file-import-outline"
              size={20}
              color="#FFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.mainImportBtnText}>Import into Document</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default OcrReviewModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  importHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  importHeaderBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  body: {
    flex: 1,
  },
  imageContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  toolbarRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  toolChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  toolChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    minHeight: 250,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  mainImportBtn: {
    flex: 2,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mainImportBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
