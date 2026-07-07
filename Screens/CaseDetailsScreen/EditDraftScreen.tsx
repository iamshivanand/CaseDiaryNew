// Screens/CaseDetailsScreen/EditDraftScreen.tsx
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Text,
  Modal,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { v4 as uuidv4 } from "uuid";

import { saveDocumentDraft, getDocumentDraftById } from "../../DataBase";
import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { LEGAL_VOCABULARY } from "../../utils/legalVocabulary";
import { getOfflineEditorHtml } from "../../utils/offlineEditorTemplate";

type EditDraftScreenRouteProp = RouteProp<HomeStackParamList, "EditDraft">;

interface EditorState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  alignJustify: boolean;
  orderedList: boolean;
  unorderedList: boolean;
}

const EditDraftScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditDraftScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = getStyles(theme);

  const {
    draftId,
    caseId,
    initialHtml = "",
    templateType = "draft",
    title: initialTitle,
  } = route.params;

  const [title, setTitle] = useState(
    initialTitle || `Draft ${new Date().toLocaleDateString()}`
  );
  const [htmlContent, setHtmlContent] = useState(initialHtml);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [editorState, setEditorState] = useState<EditorState>({
    bold: false,
    italic: false,
    underline: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    orderedList: false,
    unorderedList: false,
  });

  // Page setup state
  const [font, setFont] = useState("Times New Roman");
  const [lineHeight, setLineHeight] = useState("1.6");
  const [topMargin, setTopMargin] = useState(24);
  const [bottomMargin, setBottomMargin] = useState(24);
  const [leftMargin, setLeftMargin] = useState(55);
  const [rightMargin, setRightMargin] = useState(24);
  const [letterheadSpace, setLetterheadSpace] = useState(0);
  const [isPageSetupVisible, setIsPageSetupVisible] = useState(false);
  const [pageSize, setPageSize] = useState<"a4" | "legal">("legal");
  const [toolbarMode, setToolbarMode] = useState<"format" | "legal">("format");
  const [isTransitionFinished, setIsTransitionFinished] = useState(false);
  const [isVocabularyVisible, setIsVocabularyVisible] = useState(false);
  const [isSignatureListVisible, setIsSignatureListVisible] = useState(false);
  const [vocabSearchQuery, setVocabSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitionFinished(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const applyLayoutSettings = (
    newFont: string = font,
    newSpacing: string = lineHeight,
    newPageSize: "a4" | "legal" = pageSize,
    tMargin: number = topMargin,
    bMargin: number = bottomMargin,
    lMargin: number = leftMargin,
    rMargin: number = rightMargin,
    lhSpace: number = letterheadSpace
  ) => {
    postMessageToWebView({
      type: "layout",
      font: newFont,
      lineHeight: newSpacing,
      pageSize: newPageSize,
      topMargin: tMargin,
      bottomMargin: bMargin,
      leftMargin: lMargin,
      rightMargin: rMargin,
      letterheadSpace: lhSpace,
    });
  };

  const webViewRef = useRef<WebView>(null);
  const saveCallbackRef = useRef<((html: string) => void) | null>(null);

  const postMessageToWebView = (message: object) => {
    const jsonStr = JSON.stringify(message);
    const escaped = jsonStr.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    webViewRef.current?.injectJavaScript(
      `window.handleRNMessage('${escaped}'); void(0);`
    );
  };

  // Intercept react-navigation Back actions if we have unsaved edits
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!hasUnsavedChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        t("docgen_unsaved_title") || "Unsaved Changes",
        t("docgen_unsaved_desc") ||
          "You have unsaved changes. Do you want to discard them?",
        [
          {
            text: t("alert_cancel") || "Keep Editing",
            style: "cancel",
            onPress: () => {},
          },
          {
            text: t("alert_discard") || "Discard",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, t]);

  // Load existing draft if draftId is provided
  useEffect(() => {
    const loadDraft = async () => {
      if (draftId) {
        setIsLoading(true);
        try {
          const draft = await getDocumentDraftById(draftId);
          if (draft) {
            setTitle(draft.title);
            let cleanedHtml = draft.html_content;
            const metadataMatch = draft.html_content.match(
              /<!-- CD_LAYOUT:(.*?) -->/
            );
            if (metadataMatch) {
              try {
                const layout = JSON.parse(metadataMatch[1]);
                if (layout.font) setFont(layout.font);
                if (layout.lineHeight) setLineHeight(layout.lineHeight);
                if (layout.stampMargin !== undefined)
                  setStampMargin(layout.stampMargin);
                cleanedHtml = draft.html_content.replace(
                  /<!-- CD_LAYOUT:(.*?) -->/,
                  ""
                );
              } catch (e) {
                console.error("Failed to parse layout metadata:", e);
              }
            }
            setHtmlContent(cleanedHtml);
          } else {
            Alert.alert(
              t("alert_error"),
              "Could not locate draft in database."
            );
          }
        } catch (error) {
          console.error("Failed to load draft:", error);
          Alert.alert(t("alert_error"), "Error reading draft from database.");
        } finally {
          setIsLoading(false);
        }
      } else {
        // Also check if initialHtml passed from route params has metadata comments
        let cleanedHtml = initialHtml;
        const metadataMatch = initialHtml.match(/<!-- CD_LAYOUT:(.*?) -->/);
        if (metadataMatch) {
          try {
            const layout = JSON.parse(metadataMatch[1]);
            if (layout.font) setFont(layout.font);
            if (layout.lineHeight) setLineHeight(layout.lineHeight);
            if (layout.stampMargin !== undefined)
              setStampMargin(layout.stampMargin);
            cleanedHtml = initialHtml.replace(/<!-- CD_LAYOUT:(.*?) -->/, "");
          } catch (e) {
            console.error("Failed to parse layout metadata on new draft:", e);
          }
        }
        setHtmlContent(cleanedHtml);
        setIsLoading(false);
      }
    };
    loadDraft();
  }, [draftId, initialHtml]);

  // Handle formatted command triggers
  const triggerFormat = (command: string, value: string | null = null) => {
    postMessageToWebView({
      type: "exec",
      command,
      value,
    });
  };

  // Handle messages posted from Webview
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "state") {
        setEditorState(data.state);
      } else if (data.type === "save") {
        setHasUnsavedChanges(false);
        if (saveCallbackRef.current) {
          saveCallbackRef.current(data.html);
          saveCallbackRef.current = null;
        }
      } else if (data.type === "error") {
        console.error("WebView Editor Error:", data.error);
      }
    } catch (e) {
      console.error("Error parsing message from webview:", e);
    }
  };

  // Trigger Save Process
  const handleSave = () => {
    setIsSaving(true);
    // Request latest HTML from WebView contenteditable
    postMessageToWebView({ type: "requestSave" });

    // Define the actual saving routine to execute once HTML is received asynchronously
    saveCallbackRef.current = async (html) => {
      try {
        const idToSave = draftId || uuidv4();
        const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, lineHeight, stampMargin })} -->`;
        const contentWithMetadata = metadataComment + html;

        // Ask advocate where/how they want to save
        Alert.alert(
          "Save Draft",
          "Choose how you want to save this document:",
          [
            {
              text: caseId
                ? "Save to current Case"
                : "Save as Standalone Draft",
              onPress: async () => {
                await saveDocumentDraft({
                  id: idToSave,
                  case_id: caseId || null,
                  title,
                  template_type: templateType,
                  html_content: contentWithMetadata,
                  is_custom_template: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
                Alert.alert("Success", "Draft saved successfully.", [
                  { text: "OK", onPress: () => navigation.goBack() },
                ]);
                setIsSaving(false);
              },
            },
            {
              text: "Save as Reusable Template",
              onPress: async () => {
                await saveDocumentDraft({
                  id: idToSave,
                  case_id: null,
                  title: `${title} (Template)`,
                  template_type: templateType,
                  html_content: contentWithMetadata,
                  is_custom_template: 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
                Alert.alert("Success", "Custom template saved successfully.", [
                  { text: "OK", onPress: () => navigation.goBack() },
                ]);
                setIsSaving(false);
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsSaving(false),
            },
          ]
        );
      } catch (err) {
        console.error("Error saving draft to SQLite database:", err);
        Alert.alert("Error", "Could not write draft to SQLite.");
        setIsSaving(false);
      }
    };
  };

  // Print/Share PDF
  const handlePrintShare = () => {
    setIsExporting(true);
    postMessageToWebView({ type: "requestSave" });

    saveCallbackRef.current = async (html) => {
      try {
        const formattedHtmlForPrint = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: ${font};
                line-height: ${lineHeight};
                padding-top: ${stampMargin}px;
                padding-left: 30px;
                padding-right: 30px;
                color: #1f2937;
              }
              p {
                margin: 0 0 12px 0;
              }
            </style>
          </head>
          <body>
            ${html}
          </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({
          html: formattedHtmlForPrint,
          width: 612,
          height: 1008,
        });

        setIsExporting(false);
        Alert.alert(
          title || "Draft Document",
          "Choose an action for this PDF:",
          [
            {
              text: "Open in App",
              onPress: () => {
                // @ts-ignore
                navigation.navigate("PdfViewer", {
                  pdfUri: uri,
                  title: title || "Draft",
                });
              },
            },
            {
              text: "Share PDF",
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(uri, {
                    mimeType: "application/pdf",
                    dialogTitle: title,
                    UTI: "com.adobe.pdf",
                  });
                }
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      } catch (error) {
        setIsExporting(false);
        console.error("Error generating PDF in editor screen:", error);
        Alert.alert("Error", "Failed to print or share PDF.");
      }
    };
  };

  if (isLoading || !isTransitionFinished) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header with Editable Title */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            setHasUnsavedChanges(true);
          }}
          placeholder="Enter draft title..."
          placeholderTextColor={theme.colors.textSecondary}
        />

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 12 }]}
            onPress={() => setIsPageSetupVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handlePrintShare}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons
                name="share-outline"
                size={22}
                color={theme.colors.primary}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginLeft: 12 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons
                name="checkmark"
                size={24}
                color={theme.colors.primary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Editor Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <WebView
          ref={webViewRef}
          source={{ html: getOfflineEditorHtml(htmlContent) }}
          onMessage={handleMessage}
          style={styles.webView}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => {
            postMessageToWebView({ type: "load", html: htmlContent });
            applyLayoutSettings(
              font,
              lineHeight,
              pageSize,
              topMargin,
              bottomMargin,
              leftMargin,
              rightMargin,
              letterheadSpace
            );
          }}
          onShouldStartLoadWithRequest={() => false} // Do not navigate out
        />

        {/* Toolbar Mode Switcher */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.colors.cardBackground,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 2,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={{
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor:
                  toolbarMode === "format"
                    ? theme.colors.primary
                    : "transparent",
              }}
              onPress={() => setToolbarMode("format")}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color:
                    toolbarMode === "format"
                      ? "#fff"
                      : theme.colors.textSecondary,
                }}
              >
                {t ? t("Formatting") || "Formatting" : "Formatting"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor:
                  toolbarMode === "legal"
                    ? theme.colors.primary
                    : "transparent",
              }}
              onPress={() => setToolbarMode("legal")}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color:
                    toolbarMode === "legal"
                      ? "#fff"
                      : theme.colors.textSecondary,
                }}
              >
                {t ? t("Legal Assist") || "Legal Assist" : "Legal Assist"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: theme.colors.textSecondary,
              fontWeight: "500",
            }}
          >
            {pageSize === "legal"
              ? "Legal Size (Double-Spaced)"
              : "A4 Size (1.5 Spaced)"}
          </Text>
        </View>

        {/* Dynamic Native Formatting Toolbar */}
        {toolbarMode === "format" ? (
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                editorState.bold && styles.activeToolbarButton,
              ]}
              onPress={() => triggerFormat("bold")}
            >
              <FontAwesome
                name="bold"
                size={18}
                color={editorState.bold ? "#fff" : theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                editorState.italic && styles.activeToolbarButton,
              ]}
              onPress={() => triggerFormat("italic")}
            >
              <FontAwesome
                name="italic"
                size={18}
                color={editorState.italic ? "#fff" : theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                editorState.underline && styles.activeToolbarButton,
              ]}
              onPress={() => triggerFormat("underline")}
            >
              <FontAwesome
                name="underline"
                size={18}
                color={editorState.underline ? "#fff" : theme.colors.text}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Alignment Buttons */}
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                editorState.alignLeft && styles.activeToolbarButton,
              ]}
              onPress={() => triggerFormat("justifyLeft")}
            >
              <FontAwesome
                name="align-left"
                size={18}
                color={editorState.alignLeft ? "#fff" : theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                editorState.alignCenter && styles.activeToolbarButton,
              ]}
              onPress={() => triggerFormat("justifyCenter")}
            >
              <FontAwesome
                name="align-center"
                size={18}
                color={editorState.alignCenter ? "#fff" : theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                editorState.alignRight && styles.activeToolbarButton,
              ]}
              onPress={() => triggerFormat("justifyRight")}
            >
              <FontAwesome
                name="align-right"
                size={18}
                color={editorState.alignRight ? "#fff" : theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                editorState.alignJustify && styles.activeToolbarButton,
              ]}
              onPress={() => triggerFormat("justifyFull")}
            >
              <FontAwesome
                name="align-justify"
                size={18}
                color={editorState.alignJustify ? "#fff" : theme.colors.text}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* List Buttons */}
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                editorState.unorderedList && styles.activeToolbarButton,
              ]}
              onPress={() => triggerFormat("insertUnorderedList")}
            >
              <FontAwesome
                name="list-ul"
                size={18}
                color={editorState.unorderedList ? "#fff" : theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                editorState.orderedList && styles.activeToolbarButton,
              ]}
              onPress={() => triggerFormat("insertOrderedList")}
            >
              <FontAwesome
                name="list-ol"
                size={18}
                color={editorState.orderedList ? "#fff" : theme.colors.text}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* New Paragraph Button */}
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => triggerFormat("insertParagraph")}
              title="Add Paragraph"
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              paddingHorizontal: 12,
              gap: 8,
            }}
            style={{
              backgroundColor: theme.colors.inputBackground,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              width: "100%",
              maxHeight: 50,
            }}
          >
            {/* Symbols */}
            {["§", "¶", "Δ", "π", "№"].map((sym) => (
              <TouchableOpacity
                key={sym}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  backgroundColor: theme.colors.cardBackground,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  minWidth: 34,
                  alignItems: "center",
                }}
                onPress={() => triggerFormat("insertText", sym)}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontWeight: "bold",
                    fontSize: 14,
                  }}
                >
                  {sym}
                </Text>
              </TouchableOpacity>
            ))}

            <View
              style={{
                width: 1,
                height: 20,
                backgroundColor: theme.colors.border,
              }}
            />

            {/* Outlining Toggle (Legal List) */}
            <TouchableOpacity
              style={{
                padding: 7,
                paddingHorizontal: 8,
                borderRadius: 6,
                backgroundColor: theme.colors.cardBackground,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={() => triggerFormat("toggleLegalList")}
            >
              <FontAwesome
                name="list-ol"
                size={14}
                color={theme.colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                Legal List
              </Text>
            </TouchableOpacity>

            {/* Signature Block */}
            <TouchableOpacity
              style={{
                padding: 7,
                paddingHorizontal: 8,
                borderRadius: 6,
                backgroundColor: theme.colors.cardBackground,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={() => setIsSignatureListVisible(true)}
            >
              <Ionicons
                name="pencil"
                size={14}
                color={theme.colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                Signature
              </Text>
            </TouchableOpacity>

            {/* Legal Dictionary (Vocabulary) */}
            <TouchableOpacity
              style={{
                padding: 7,
                paddingHorizontal: 8,
                borderRadius: 6,
                backgroundColor: theme.colors.cardBackground,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={() => setIsVocabularyVisible(true)}
            >
              <Ionicons
                name="book-outline"
                size={14}
                color={theme.colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                Dictionary
              </Text>
            </TouchableOpacity>

            <View
              style={{
                width: 1,
                height: 20,
                backgroundColor: theme.colors.border,
              }}
            />

            {/* Case Converters */}
            {[
              { label: "UPPER", value: "upper" },
              { label: "lower", value: "lower" },
              { label: "Title", value: "title" },
            ].map((c) => (
              <TouchableOpacity
                key={c.value}
                style={{
                  padding: 7,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  backgroundColor: theme.colors.cardBackground,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
                onPress={() => triggerFormat("changeCase", c.value)}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View
              style={{
                width: 1,
                height: 20,
                backgroundColor: theme.colors.border,
              }}
            />

            {/* Placeholder Navigator */}
            <TouchableOpacity
              style={{
                padding: 7,
                paddingHorizontal: 10,
                borderRadius: 6,
                backgroundColor: theme.colors.primary,
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={() => triggerFormat("nextPlaceholder")}
            >
              <Ionicons
                name="play-skip-forward-outline"
                size={12}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>
                {t ? t("Next") || "Next" : "Next"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Page Setup Customization Modal */}
      <Modal
        visible={isPageSetupVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPageSetupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.cardBackground },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t ? t("Page Setup") || "Page Setup" : "Page Setup"}
              </Text>
              <TouchableOpacity onPress={() => setIsPageSetupVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              {/* Font Selection */}
              <Text
                style={[
                  styles.modalLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t ? t("Font Family") || "Font Family" : "Font Family"}
              </Text>
              <View style={styles.optionGroup}>
                {[
                  {
                    label: "Times New Roman",
                    value: "'Times New Roman', Georgia, serif",
                  },
                  {
                    label: "Georgia",
                    value: "Georgia, 'Times New Roman', serif",
                  },
                  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
                ].map((item) => {
                  const isSelected = font === item.value;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.optionButton,
                        { borderColor: theme.colors.border },
                        isSelected && {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        },
                      ]}
                      onPress={() => {
                        setFont(item.value);
                        applyLayoutSettings(item.value, lineHeight, pageSize);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: isSelected ? "#ffffff" : theme.colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Line Spacing Selection */}
              <Text
                style={[
                  styles.modalLabel,
                  { color: theme.colors.textSecondary, marginTop: 12 },
                ]}
              >
                {t ? t("Line Spacing") || "Line Spacing" : "Line Spacing"}
              </Text>
              <View style={styles.optionGroup}>
                {[
                  { label: "1.15 (Single)", value: "1.15" },
                  { label: "1.5 (Standard)", value: "1.5" },
                  { label: "2.0 (Double)", value: "2.0" },
                ].map((item) => {
                  const isSelected = lineHeight === item.value;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.optionButton,
                        { borderColor: theme.colors.border },
                        isSelected && {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        },
                      ]}
                      onPress={() => {
                        setLineHeight(item.value);
                        applyLayoutSettings(font, item.value, pageSize);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: isSelected ? "#ffffff" : theme.colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Paper Size Selection */}
              <Text
                style={[
                  styles.modalLabel,
                  { color: theme.colors.textSecondary, marginTop: 12 },
                ]}
              >
                {t ? t("Paper Size") || "Paper Size" : "Paper Size"}
              </Text>
              <View style={styles.optionGroup}>
                {[
                  { label: "A4 Size", value: "a4" },
                  { label: "Legal Size", value: "legal" },
                ].map((item) => {
                  const isSelected = pageSize === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.optionButton,
                        { borderColor: theme.colors.border },
                        isSelected && {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        },
                      ]}
                      onPress={() => {
                        setPageSize(item.value as "a4" | "legal");
                        applyLayoutSettings(
                          font,
                          lineHeight,
                          item.value as "a4" | "legal",
                          topMargin,
                          bottomMargin,
                          leftMargin,
                          rightMargin,
                          letterheadSpace
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: isSelected ? "#ffffff" : theme.colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Margins Steppers Selection */}
              <Text
                style={[
                  styles.modalLabel,
                  {
                    color: theme.colors.textSecondary,
                    marginTop: 16,
                    marginBottom: 8,
                  },
                ]}
              >
                {t
                  ? t("Document Margins") || "Document Margins"
                  : "Document Margins"}
              </Text>

              {/* Top Margin */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  Top Margin
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.max(0, topMargin - 5);
                      setTopMargin(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        v,
                        bottomMargin,
                        leftMargin,
                        rightMargin,
                        letterheadSpace
                      );
                    }}
                  >
                    <Ionicons
                      name="remove"
                      size={14}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      width: 60,
                      textAlign: "center",
                      fontWeight: "bold",
                      color: theme.colors.text,
                      fontSize: 12,
                    }}
                  >
                    {topMargin} px
                  </Text>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.min(200, topMargin + 5);
                      setTopMargin(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        v,
                        bottomMargin,
                        leftMargin,
                        rightMargin,
                        letterheadSpace
                      );
                    }}
                  >
                    <Ionicons name="add" size={14} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Left Margin */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  Left Margin
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.max(20, leftMargin - 5);
                      setLeftMargin(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        topMargin,
                        bottomMargin,
                        v,
                        rightMargin,
                        letterheadSpace
                      );
                    }}
                  >
                    <Ionicons
                      name="remove"
                      size={14}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      width: 60,
                      textAlign: "center",
                      fontWeight: "bold",
                      color: theme.colors.text,
                      fontSize: 12,
                    }}
                  >
                    {leftMargin} px
                  </Text>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.min(200, leftMargin + 5);
                      setLeftMargin(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        topMargin,
                        bottomMargin,
                        v,
                        rightMargin,
                        letterheadSpace
                      );
                    }}
                  >
                    <Ionicons name="add" size={14} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Right Margin */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  Right Margin
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.max(0, rightMargin - 5);
                      setRightMargin(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        topMargin,
                        bottomMargin,
                        leftMargin,
                        v,
                        letterheadSpace
                      );
                    }}
                  >
                    <Ionicons
                      name="remove"
                      size={14}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      width: 60,
                      textAlign: "center",
                      fontWeight: "bold",
                      color: theme.colors.text,
                      fontSize: 12,
                    }}
                  >
                    {rightMargin} px
                  </Text>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.min(200, rightMargin + 5);
                      setRightMargin(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        topMargin,
                        bottomMargin,
                        leftMargin,
                        v,
                        letterheadSpace
                      );
                    }}
                  >
                    <Ionicons name="add" size={14} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Margin */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  Bottom Margin
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.max(0, bottomMargin - 5);
                      setBottomMargin(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        topMargin,
                        v,
                        leftMargin,
                        rightMargin,
                        letterheadSpace
                      );
                    }}
                  >
                    <Ionicons
                      name="remove"
                      size={14}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      width: 60,
                      textAlign: "center",
                      fontWeight: "bold",
                      color: theme.colors.text,
                      fontSize: 12,
                    }}
                  >
                    {bottomMargin} px
                  </Text>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.min(200, bottomMargin + 5);
                      setBottomMargin(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        topMargin,
                        v,
                        leftMargin,
                        rightMargin,
                        letterheadSpace
                      );
                    }}
                  >
                    <Ionicons name="add" size={14} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Letterhead Top Space */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  Letterhead Top Space
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.max(0, letterheadSpace - 10);
                      setLetterheadSpace(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        topMargin,
                        bottomMargin,
                        leftMargin,
                        rightMargin,
                        v
                      );
                    }}
                  >
                    <Ionicons
                      name="remove"
                      size={14}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      width: 60,
                      textAlign: "center",
                      fontWeight: "bold",
                      color: theme.colors.text,
                      fontSize: 12,
                    }}
                  >
                    {letterheadSpace} px
                  </Text>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.cardBackground,
                    }}
                    onPress={() => {
                      const v = Math.min(300, letterheadSpace + 10);
                      setLetterheadSpace(v);
                      applyLayoutSettings(
                        font,
                        lineHeight,
                        pageSize,
                        topMargin,
                        bottomMargin,
                        leftMargin,
                        rightMargin,
                        v
                      );
                    }}
                  >
                    <Ionicons name="add" size={14} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setIsPageSetupVisible(false)}
              >
                <Text style={{ color: "#ffffff", fontWeight: "bold" }}>
                  {t ? t("Done") || "Done" : "Done"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Signature Modal */}
      <Modal
        visible={isSignatureListVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSignatureListVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Insert Signature / Verification
              </Text>
              <TouchableOpacity
                onPress={() => setIsSignatureListVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              {[
                {
                  title: "Advocate Signature Block",
                  description:
                    "Standard right-aligned block for advocate's signature and designation.",
                  html: `<table style="width: 100%; border: none; margin-top: 30px; font-family: inherit;"><tr><td style="width: 50%; border: none;"></td><td style="width: 50%; text-align: right; border: none;"><strong>[ADVOCATE NAME]</strong><br/>Advocate for Petitioner</td></tr></table>`,
                },
                {
                  title: "Double Signature Block",
                  description:
                    "Left-aligned Petitioner block + right-aligned Advocate block.",
                  html: `<table style="width: 100%; border: none; margin-top: 30px; font-family: inherit;"><tr><td style="width: 50%; text-align: left; border: none;"><strong>[CLIENT NAME]</strong><br/>Petitioner / Plaintiff</td><td style="width: 50%; text-align: right; border: none;"><strong>[ADVOCATE NAME]</strong><br/>Advocate for Petitioner</td></tr></table>`,
                },
                {
                  title: "Court Verification Block",
                  description:
                    "Formal pleading verification box confirming facts under oath.",
                  html: `<div style="border: 1.5px solid #1f2937; padding: 14px; margin-top: 24px; border-radius: 4px; font-family: inherit; line-height: 1.6;"><p style="margin: 0 0 12px 0; text-align: center;"><strong><u>VERIFICATION</u></strong></p><p style="margin: 0 0 12px 0;">I, the deponent above named, do hereby solemnly declare and verify that the contents of paragraphs 1 to ___ are true and correct to my personal knowledge, and nothing material has been concealed therefrom.</p><p style="margin: 0 0 20px 0;">Verified at New Delhi on this day ___ of ____, 2026.</p><table style="width: 100%; border: none; margin-top: 20px;"><tr><td style="width: 50%; border: none;"><strong>DEPONENT</strong></td><td style="width: 50%; text-align: right; border: none;"><strong>IDENTIFIED BY ME</strong></td></tr></table></div>`,
                },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    backgroundColor: theme.colors.cardBackground,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 8,
                    padding: 14,
                    marginBottom: 12,
                  }}
                  onPress={() => {
                    triggerFormat("insertHTML", item.html);
                    setIsSignatureListVisible(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                      color: theme.colors.text,
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: theme.colors.textSecondary }}
                  >
                    {item.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Vocabulary Modal */}
      <Modal
        visible={isVocabularyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVocabularyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Legal Dictionary</Text>
              <TouchableOpacity onPress={() => setIsVocabularyVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.colors.background,
                borderRadius: 8,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: theme.colors.border,
                height: 40,
                marginBottom: 12,
              }}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <TextInput
                placeholder="Search legal words..."
                placeholderTextColor={theme.colors.textSecondary}
                style={{
                  flex: 1,
                  color: theme.colors.text,
                  fontSize: 14,
                  padding: 0,
                }}
                value={vocabSearchQuery}
                onChangeText={setVocabSearchQuery}
              />
              {vocabSearchQuery !== "" && (
                <TouchableOpacity onPress={() => setVocabSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {LEGAL_VOCABULARY.filter(
                (item) =>
                  item.english
                    .toLowerCase()
                    .includes(vocabSearchQuery.toLowerCase()) ||
                  item.hindi.includes(vocabSearchQuery) ||
                  item.transliteration
                    .toLowerCase()
                    .includes(vocabSearchQuery.toLowerCase())
              ).map((item, idx) => (
                <View
                  key={idx}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    paddingVertical: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "bold",
                        color: theme.colors.text,
                      }}
                    >
                      {item.english}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        color: theme.colors.primary,
                      }}
                    >
                      {item.hindi}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.textSecondary,
                      fontStyle: "italic",
                      marginBottom: 6,
                    }}
                  >
                    Pronunciation: {item.transliteration}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    {item.meaning}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: `${theme.colors.primary}12`,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 4,
                        borderWidth: 0.5,
                        borderColor: theme.colors.primary,
                      }}
                      onPress={() => {
                        triggerFormat("insertText", item.english);
                        setIsVocabularyVisible(false);
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.primary,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        Insert English
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: `${theme.colors.primary}12`,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 4,
                        borderWidth: 0.5,
                        borderColor: theme.colors.primary,
                      }}
                      onPress={() => {
                        triggerFormat("insertText", item.hindi);
                        setIsVocabularyVisible(false);
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.primary,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        Insert Hindi
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EditDraftScreen;

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      height: 56,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
      paddingHorizontal: 12,
    },
    headerButton: {
      justifyContent: "center",
      alignItems: "center",
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    titleInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
      marginHorizontal: 12,
      paddingVertical: 4,
    },
    headerRightActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    webView: {
      flex: 1,
      backgroundColor: "#ffffff",
    },
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 52,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
      paddingHorizontal: 16,
    },
    toolbarButton: {
      width: 32,
      height: 32,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
    },
    activeToolbarButton: {
      backgroundColor: theme.colors.primary,
    },
    divider: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.border,
      marginHorizontal: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: Platform.OS === "ios" ? 40 : 20,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      paddingBottom: 10,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
    },
    modalForm: {
      width: "100%",
    },
    modalLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
    },
    optionGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    optionButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      marginHorizontal: 4,
      justifyContent: "center",
      alignItems: "center",
    },
    optionText: {
      fontSize: 12,
      fontWeight: "600",
    },
    modalSaveButton: {
      height: 46,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 16,
    },
  });
