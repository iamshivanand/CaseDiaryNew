// Screens/CaseDetailsScreen/TiptapEditDraftScreen.tsx
import { Ionicons, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
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
  StatusBar,
  Text,
  Modal,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { v4 as uuidv4 } from "uuid";

import { PlaceholderBottomSheet } from "./components/PlaceholderBottomSheet";
import { SignatureCanvasModal } from "./components/SignatureCanvasModal";
import { LegalAutocompleteBar } from "./components/LegalAutocompleteBar";
import { TableConfigModal } from "./components/TableConfigModal";
import { ElementContextModal } from "./components/ElementContextModal";
import OcrReviewModal from "./components/OcrReviewModal";
import { saveDocumentDraft, getDocumentDraftById } from "../../DataBase";
import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { LEGAL_VOCABULARY } from "../../utils/legalVocabulary";
import { extractTextFromImages } from "../../utils/ocrService";
import { getRealTiptapEditorHtml } from "../../utils/realTiptapEditorTemplate";
import { speechRecognitionService } from "../../utils/speechRecognitionService";
import { createNamedPdfFile, shareNamedPdf } from "../../utils/fileShareHelper";
import ActionButton from "../CommonComponents/ActionButton";

type TiptapEditDraftScreenRouteProp = RouteProp<HomeStackParamList, "TiptapEditDraft">;

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

const TiptapEditDraftScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TiptapEditDraftScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const { t, locale } = useTranslation();
  const styles = getStyles(theme);

  const {
    draftId: initialDraftId,
    caseId,
    initialHtml = "",
    templateType = "draft",
    title: initialTitle,
  } = route.params || {};

  const [docTemplateType, setDocTemplateType] = useState<string>(templateType || "draft");
  const [activeDraftId, setActiveDraftId] = useState<string>(initialDraftId || uuidv4());
  const [title, setTitle] = useState(
    initialTitle || `Draft ${new Date().toLocaleDateString()}`
  );
  const [htmlContent, setHtmlContent] = useState(initialHtml);
  const initialEditorHtml = useMemo(() => getRealTiptapEditorHtml(initialHtml), [initialHtml]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "editing" | "saving">("saved");

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

  const [docStats, setDocStats] = useState({
    wordCount: 0,
    charCount: 0,
    estimatedPages: 1,
  });

  // Page setup & Layout State
  const [font, setFont] = useState("Times New Roman");
  const [lineHeight, setLineHeight] = useState("1.6");
  const [topMargin, setTopMargin] = useState(16);
  const [bottomMargin, setBottomMargin] = useState(16);
  const [leftMargin, setLeftMargin] = useState(36);
  const [rightMargin, setRightMargin] = useState(16);
  const [letterheadSpace, setLetterheadSpace] = useState(0);
  const [unitMode, setUnitMode] = useState<"in" | "mm" | "px">("in");
  const [isPageSetupVisible, setIsPageSetupVisible] = useState(false);
  const [pageSize, setPageSize] = useState<"a4" | "legal">("legal");
  const [docDraftLanguage, setDocDraftLanguage] = useState<"en" | "hi">("en");

  // Ribbon state (Kept in intuitive top position with clear text labels)
  const [toolbarMode, setToolbarMode] = useState<"format" | "legal">("format");
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [isTransitionFinished, setIsTransitionFinished] = useState(false);

  // Modals state
  const [placeholderModalVisible, setPlaceholderModalVisible] = useState(false);
  const [activePlaceholderLabel, setActivePlaceholderLabel] = useState("");
  const [activePlaceholderClean, setActivePlaceholderClean] = useState("");
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [isSignatureListVisible, setIsSignatureListVisible] = useState(false);
  const [tableConfigModalVisible, setTableConfigModalVisible] = useState(false);
  const [elementContextModalVisible, setElementContextModalVisible] = useState(false);
  const [selectedElementType, setSelectedElementType] = useState<"table" | "signature" | null>(null);
  const [shapeModalVisible, setShapeModalVisible] = useState(false);
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [isSaveDialogVisible, setIsSaveDialogVisible] = useState(false);
  const [saveDialogTitle, setSaveDialogTitle] = useState(title);

  // OCR state
  const [ocrModalVisible, setOcrModalVisible] = useState(false);
  const [ocrModalImageUri, setOcrModalImageUri] = useState<string | null>(null);
  const [ocrModalExtractedText, setOcrModalExtractedText] = useState("");

  // Vocabulary & Macros state
  const [isVocabularyVisible, setIsVocabularyVisible] = useState(false);
  const [vocabSearchQuery, setVocabSearchQuery] = useState("");
  const [isMacrosModalVisible, setIsMacrosModalVisible] = useState(false);

  // Voice dictation & Autocomplete state
  const [isDictating, setIsDictating] = useState(false);
  const [liveSpeechPreview, setLiveSpeechPreview] = useState("");
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);

  // Walkthrough tour state
  const [showTour, setShowTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const webViewRef = useRef<WebView>(null);
  const saveCallbackRef = useRef<((html: string) => void) | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const formatMarginValue = (px: number, mode: "in" | "mm" | "px"): string => {
    if (mode === "in") return `${(px / 96).toFixed(2)} in`;
    if (mode === "mm") return `${Math.round((px / 96) * 25.4)} mm`;
    return `${Math.round(px)} px`;
  };

  const getMarginStepPx = (mode: "in" | "mm" | "px"): number => {
    if (mode === "in") return 9.6;
    if (mode === "mm") return 3.78;
    return 5;
  };

  const tourSteps = [
    {
      title: locale === "hi" ? "दस्तावेज़ संपादक मार्गदर्शिका" : "Document Editor Guide",
      description:
        locale === "hi"
          ? "Tiptap v3 AST इंजन में आपका स्वागत है! आइए इस नए एडिटर की मुख्य विशेषताओं का जल्दी से परिचय लें।"
          : "Welcome to the Tiptap v3 AST engine! Let's take a quick tour of the key features in this document editor.",
      icon: "book-outline",
    },
    {
      title: locale === "hi" ? "वॉइस-फर्स्ट ड्राफ्टिंग" : "Voice-First Legal Dictation",
      description:
        locale === "hi"
          ? "निचले दाएं कोने में मौजूद फ्लोटिंग माइक पर टैप करें। बोलते समय लाइव विराम चिह्न और कानूनी स्निपेट्स तुरंत डालें।"
          : "Tap the floating thumb mic at the bottom-right. While speaking, tap one-touch legal punctuation chips on the fly!",
      icon: "mic-outline",
    },
    {
      title: locale === "hi" ? "लाइव स्वरूपण (Formatting) उपकरण" : "Formatting Tools with Labels",
      description:
        locale === "hi"
          ? "सभी बटनों पर स्पष्ट लेबल हैं। बोल्ड, इटैलिक, अलाइनमेंट, और टेबल आसानी से जोड़ें।"
          : "All toolbar buttons feature clear labels for easy identification: Bold, Italic, Lists, Tables, and Court Seals.",
      icon: "text-outline",
    },
    {
      title: locale === "hi" ? "सार्वभौमिक कानूनी मैक्रोज़" : "Universal Legal Snippets",
      description:
        locale === "hi"
          ? "कोर्ट हेडर, प्रेयर क्लॉज, शपथ पत्र (एफिडेविट), और सर्विस सर्टिफिकेट को एक टैप में डालें।"
          : "Insert Court Captions, Prayer for Relief, Sworn Affidavits, and Proof of Service blocks in a single tap.",
      icon: "briefcase-outline",
    },
    {
      title: locale === "hi" ? "ऑटो-सेव और सुरक्षित ड्राफ्ट" : "Auto-Save Peace of Mind",
      description:
        locale === "hi"
          ? "शीर्ष लेख में लाइव स्थिति आपको बताती है कि आपका दस्तावेज़ कब सुरक्षित हुआ है।"
          : "The live status pill in the header shows real-time auto-saving so your legal work is never lost.",
      icon: "checkmark-circle-outline",
    },
  ];

  useEffect(() => {
    const checkTourSeen = async () => {
      try {
        const seen = await AsyncStorage.getItem("@tiptap_editor_tour_seen");
        if (seen !== "true") {
          setShowTour(true);
        }
      } catch (e) {
        console.warn("AsyncStorage read error", e);
      }
    };
    checkTourSeen();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitionFinished(true);
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Load existing draft if draftId is provided and no initialHtml was passed
  useEffect(() => {
    const loadDraft = async () => {
      if (initialDraftId && !initialHtml) {
        try {
          const draft = await getDocumentDraftById(initialDraftId);
          if (draft) {
            if (draft.title) {
              setTitle(draft.title);
              setSaveDialogTitle(draft.title);
            }
            if (draft.template_type) {
              setDocTemplateType(draft.template_type);
            }
            if (draft.html_content) {
              setHtmlContent(draft.html_content);
              const layoutMatch = draft.html_content.match(/<!-- CD_LAYOUT:(.*?) -->/);
              if (layoutMatch && layoutMatch[1]) {
                try {
                  const layout = JSON.parse(layoutMatch[1]);
                  if (layout.font) setFont(layout.font);
                  if (layout.lineHeight) setLineHeight(layout.lineHeight);
                  if (layout.pageSize) setPageSize(layout.pageSize);
                  if (layout.topMargin !== undefined) setTopMargin(layout.topMargin);
                  if (layout.bottomMargin !== undefined) setBottomMargin(layout.bottomMargin);
                  if (layout.leftMargin !== undefined) setLeftMargin(layout.leftMargin);
                  if (layout.rightMargin !== undefined) setRightMargin(layout.rightMargin);
                  if (layout.letterheadSpace !== undefined) setLetterheadSpace(layout.letterheadSpace);
                } catch (e) {}
              }
              postMessageToWebView({ type: "load", html: draft.html_content });
            }
          }
        } catch (e) {
          console.warn("Failed to load draft in TiptapEditDraftScreen:", e);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadDraft();
  }, [initialDraftId, initialHtml]);

  const postMessageToWebView = (message: object) => {
    const jsonLiteral = JSON.stringify(JSON.stringify(message));
    webViewRef.current?.injectJavaScript(
      `window.handleRNMessage(JSON.parse(${jsonLiteral})); void(0);`
    );
  };

  const triggerFormat = (command: string, value: string | null = null) => {
    if (command === "bold")
      setEditorState((prev) => ({ ...prev, bold: !prev.bold }));
    else if (command === "italic")
      setEditorState((prev) => ({ ...prev, italic: !prev.italic }));
    else if (command === "underline")
      setEditorState((prev) => ({ ...prev, underline: !prev.underline }));

    postMessageToWebView({
      type: "exec",
      command: command,
      value: value,
    });
    markAsEditingAndScheduleAutoSave();
  };

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
    markAsEditingAndScheduleAutoSave();
  };

  // Helper to fetch latest HTML from WebView
  const getLatestHtml = (): Promise<string> => {
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          saveCallbackRef.current = null;
          resolve(htmlContent || initialHtml || "");
        }
      }, 250);

      saveCallbackRef.current = (html: string) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          saveCallbackRef.current = null;
          resolve(html || htmlContent || initialHtml || "");
        }
      };

      postMessageToWebView({ type: "requestSave" });
    });
  };

  // Auto-Save Mechanism (Silently saves to SQLite with current title/default name after 2s inactivity)
  const performSilentAutoSave = async () => {
    try {
      setSaveStatus("saving");
      const html = await getLatestHtml();
      const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, lineHeight, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace, pageSize })} -->`;
      const contentWithMetadata = metadataComment + html;

      await saveDocumentDraft({
        id: activeDraftId,
        caseId: caseId ? String(caseId) : undefined,
        title: title || `Draft ${new Date().toLocaleDateString()}`,
        templateType: docTemplateType || templateType || "draft",
        contentHtml: contentWithMetadata,
        updatedAt: new Date().toISOString(),
      });

      setHasUnsavedChanges(false);
      setSaveStatus("saved");
    } catch (e) {
      console.warn("Silent auto-save warning:", e);
      setSaveStatus("saved");
    }
  };

  const markAsEditingAndScheduleAutoSave = () => {
    setHasUnsavedChanges(true);
    setSaveStatus("editing");
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      performSilentAutoSave();
    }, 2000);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "state") {
        if (data.state) {
          setEditorState(data.state);
        }
        if (data.stats) {
          setDocStats(data.stats);
        }
        if (data.html) {
          setHtmlContent(data.html);
        }
        setIsLoading(false);
        markAsEditingAndScheduleAutoSave();
      } else if (data.type === "save") {
        if (data.html) setHtmlContent(data.html);
        if (data.stats) setDocStats(data.stats);
        if (saveCallbackRef.current) {
          saveCallbackRef.current(data.html);
          saveCallbackRef.current = null;
        }
      } else if (data.type === "openPlaceholderModal") {
        setActivePlaceholderLabel(data.label || "");
        setActivePlaceholderClean(data.cleanLabel || "");
        setPlaceholderModalVisible(true);
      } else if (data.type === "openElementContextModal") {
        setSelectedElementType(data.elementType || null);
        setElementContextModalVisible(true);
      }
    } catch (e) {
      console.warn("Error parsing webview message:", e);
    }
  };

  // 1. Voice-First Dictation Handlers with Universal Punctuation & Speech Assistant
  const toggleVoiceDictation = async () => {
    if (isDictating) {
      await speechRecognitionService.stopListening();
      setIsDictating(false);
      setLiveSpeechPreview("");
    } else {
      setIsDictating(true);
      setLiveSpeechPreview("Listening...");
      const dictationLocale =
        docDraftLanguage === "hi" || locale === "hi" ? "hi-IN" : "en-IN";
      const started = await speechRecognitionService.startListening(
        dictationLocale,
        {
          onStart: () => {
            setIsDictating(true);
            setLiveSpeechPreview("Listening...");
          },
          onResult: (text) => {
            if (text) {
              setLiveSpeechPreview(text);
              const processed = text
                .replace(/\b(full stop|period)\b/gi, ".")
                .replace(/\b(पूर्ण विराम)\b/gi, "।")
                .replace(/\b(comma)\b/gi, ",")
                .replace(/\b(अल्पविराम)\b/gi, ",")
                .replace(/\b(semicolon|semi colon)\b/gi, ";")
                .replace(/\b(colon)\b/gi, ":")
                .replace(/\b(new paragraph|next paragraph)\b/gi, "\n\n")
                .replace(/\b(नया पैराग्राफ|नया पैरा)\b/gi, "\n\n")
                .replace(/\b(versus|versus\.)\b/gi, "v.")
                .replace(/\b(section sign|section)\b/gi, "§");
              triggerFormat("insertText", processed + " ");
            }
          },
          onError: (err) => {
            setIsDictating(false);
            setLiveSpeechPreview("");
            Alert.alert("Dictation Error", err || "Speech recognition error");
          },
          onEnd: () => {
            setIsDictating(false);
            setLiveSpeechPreview("");
          },
        }
      );
      if (!started) {
        setIsDictating(false);
        setLiveSpeechPreview("");
      }
    }
  };

  // 2. Scan-to-Editor OCR Handlers
  const handleScanToEditorOcr = () => {
    Alert.alert(
      "Scan Legal Document",
      "Choose a source to extract printed/handwritten legal text into the editor:",
      [
        {
          text: "Document Scanner",
          onPress: () => processOcrFromSource("scanner"),
        },
        {
          text: "Camera",
          onPress: () => processOcrFromSource("camera"),
        },
        {
          text: "Photo Gallery",
          onPress: () => processOcrFromSource("gallery"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const processOcrFromSource = async (
    source: "camera" | "gallery" | "scanner"
  ) => {
    let scannedUris: string[] = [];
    try {
      setIsLoading(true);
      if (source === "scanner") {
        try {
          const DocumentScanner =
            require("react-native-document-scanner-plugin").default;
          const result = await DocumentScanner.scanDocument({
            croppedImageQuality: 100,
            maxNumDocuments: 10,
          });
          if (
            result &&
            result.scannedImages &&
            Array.isArray(result.scannedImages)
          ) {
            scannedUris = result.scannedImages;
          }
        } catch (scanErr) {
          console.warn("Native DocumentScanner error/cancel:", scanErr);
        }
      } else if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status === "granted") {
          const pickerResult = await ImagePicker.launchCameraAsync({
            quality: 1.0,
            allowsEditing: true,
          });
          if (
            !pickerResult.canceled &&
            pickerResult.assets &&
            pickerResult.assets[0]?.uri
          ) {
            scannedUris = [pickerResult.assets[0].uri];
          }
        }
      } else if (source === "gallery") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status === "granted") {
          const pickerResult = await ImagePicker.launchImageLibraryAsync({
            quality: 1.0,
            allowsMultipleSelection: true,
            selectionLimit: 5,
          });
          if (
            !pickerResult.canceled &&
            pickerResult.assets &&
            pickerResult.assets.length > 0
          ) {
            scannedUris = pickerResult.assets.map((asset) => asset.uri);
          }
        }
      }

      if (scannedUris.length > 0) {
        const extractedText = await extractTextFromImages(scannedUris);
        setOcrModalImageUri(scannedUris[0]);
        setOcrModalExtractedText(extractedText || "");
        setOcrModalVisible(true);
      }
    } catch (err) {
      console.error("Error in processOcrFromSource:", err);
      Alert.alert("OCR Error", "Could not extract text from document photo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportOcrText = (finalText: string) => {
    if (!finalText) return;
    const formattedHtml = `<p>${finalText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
    triggerFormat("insertHTML", formattedHtml);
    Alert.alert("Imported", "Reviewed OCR text inserted into document editor.");
  };

  // 3. User Explicit Save with Title Confirmation & Destination Options
  const handleOpenSaveDialog = () => {
    setSaveDialogTitle(title);
    setIsSaveDialogVisible(true);
  };

  const handleConfirmSave = async (destination: "case" | "standalone" | "template") => {
    setIsSaving(true);
    setIsSaveDialogVisible(false);
    try {
      const finalTitle = saveDialogTitle.trim() || title;
      setTitle(finalTitle);
      const html = await getLatestHtml();
      const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, lineHeight, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace, pageSize })} -->`;
      const contentWithMetadata = metadataComment + html;

      const effTemplateType = docTemplateType || templateType || "draft";
      if (destination === "case") {
        await saveDocumentDraft({
          id: activeDraftId,
          caseId: caseId ? String(caseId) : undefined,
          title: finalTitle,
          templateType: effTemplateType,
          contentHtml: contentWithMetadata,
          updatedAt: new Date().toISOString(),
        });
        Alert.alert("Success", "Draft saved to current case successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else if (destination === "standalone") {
        await saveDocumentDraft({
          id: activeDraftId,
          caseId: undefined,
          title: finalTitle,
          templateType: effTemplateType,
          contentHtml: contentWithMetadata,
          updatedAt: new Date().toISOString(),
        });
        Alert.alert("Success", "Standalone draft saved successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else if (destination === "template") {
        await saveDocumentDraft({
          id: uuidv4(),
          caseId: undefined,
          title: `${finalTitle} (Template)`,
          templateType: effTemplateType,
          contentHtml: contentWithMetadata,
          is_custom_template: 1,
          updatedAt: new Date().toISOString(),
        });
        Alert.alert("Success", "Saved as a reusable custom template!", [
          { text: "OK" },
        ]);
      }
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Error saving draft:", err);
      Alert.alert("Error", "Failed to save document draft.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Print & Export PDF Handler
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const html = await getLatestHtml();
      const effectiveTopMargin = (topMargin || 24) + (letterheadSpace || 0);
      const pageCssSize = pageSize === "legal" ? "8.5in 14in" : "A4 portrait";
      const cleanBodyHtml = html
        .replace(/<!-- CD_LAYOUT:(.*?) -->/g, "")
        .replace(/<div id="red-margin-line".*?<\/div>/g, "")
        .replace(/<div id="margin-guide-overlay".*?<\/div>/g, "");

      const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: ${pageCssSize};
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: '${font}', 'Times New Roman', serif;
              font-size: 13pt;
              line-height: ${lineHeight};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              padding-top: ${effectiveTopMargin}px;
              padding-bottom: ${bottomMargin || 24}px;
              padding-left: ${leftMargin || 55}px;
              padding-right: ${rightMargin || 24}px;
              box-sizing: border-box;
            }
            p { margin-bottom: 12pt; text-align: justify; text-justify: inter-word; word-wrap: break-word; }
            p.court-header, .court-header { text-align: center !important; font-weight: bold; margin-bottom: 14pt; }
            p.title, .title { text-align: center !important; font-weight: bold; font-size: 15pt; margin: 14pt 0; }
            .editor-table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
            .editor-table td, .editor-table th { border: 1px solid #000; padding: 6pt; text-align: left; }
            .legal-page-break, .page-break { page-break-before: always; break-before: page; }
            .page-margin-guide, #red-margin-line, #margin-guide-overlay { display: none !important; }
            .interactive-shape { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${cleanBodyHtml}
        </body>
        </html>
      `;
      const isLegal = pageSize === "legal";
      const { uri } = await Print.printToFileAsync({
        html: printHtml,
        width: isLegal ? 612 : 595,
        height: isLegal ? 1008 : 842,
      });

      const docTitle = title || "Draft Document";
      const namedUri = await createNamedPdfFile(uri, docTitle);

      setIsExporting(false);
      Alert.alert(docTitle, "Choose an action for this PDF:", [
        {
          text: "Open in App",
          onPress: () => {
            // @ts-ignore
            navigation.navigate("PdfViewer", {
              pdfUri: namedUri,
              title: docTitle,
            });
          },
        },
        {
          text: "Share PDF",
          onPress: async () => {
            await shareNamedPdf(namedUri, docTitle, docTitle);
          },
        },
        {
          text: "Link to Case",
          onPress: async () => {
            try {
              const latestHtml = await getLatestHtml();
              const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, lineHeight, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace, pageSize })} -->`;
              const contentWithMetadata = metadataComment + latestHtml;
              await saveDocumentDraft({
                id: activeDraftId,
                caseId: caseId ? String(caseId) : undefined,
                title,
                templateType: templateType,
                contentHtml: contentWithMetadata,
                updatedAt: new Date().toISOString(),
              });
              setHasUnsavedChanges(false);
              // @ts-ignore
              navigation.navigate("DraftsHub", {
                draftId: activeDraftId,
                action: "attach",
              });
            } catch (e) {
              // @ts-ignore
              navigation.navigate("DraftsHub", {
                draftId: activeDraftId,
                action: "attach",
              });
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } catch (error) {
      setIsExporting(false);
      console.error("Error generating PDF in Tiptap editor:", error);
      Alert.alert("Error", "Failed to print or share PDF.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* 2-Tier Header: Tier 1 - Primary Actions & Title */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerTitleColumn}>
          <TextInput
            style={styles.headerTitleInput}
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              markAsEditingAndScheduleAutoSave();
            }}
            placeholder="Draft Title..."
            placeholderTextColor="#94a3b8"
          />
          {/* Prominent Live Save / Edit Status Subtitle Pill */}
          <TouchableOpacity
            style={styles.headerStatusRow}
            onPress={performSilentAutoSave}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    saveStatus === "saved"
                      ? "#10b981"
                      : saveStatus === "saving"
                      ? "#3b82f6"
                      : "#f59e0b",
                },
              ]}
            />
            <Text style={styles.headerStatusText}>
              {saveStatus === "saved"
                ? `Saved • ${pageSize === "legal" ? "Legal" : "A4"} • ${docStats.wordCount} words`
                : saveStatus === "saving"
                ? "Auto-saving..."
                : "Editing... (Auto-saving)"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Undo Button */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          onPress={() => triggerFormat("undo")}
        >
          <Ionicons name="arrow-undo-outline" size={19} color="#cbd5e1" />
        </TouchableOpacity>

        {/* Redo Button */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          onPress={() => triggerFormat("redo")}
        >
          <Ionicons name="arrow-redo-outline" size={19} color="#cbd5e1" />
        </TouchableOpacity>

        {/* PDF Export Button */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          onPress={handleExportPdf}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#60a5fa" />
          )}
        </TouchableOpacity>

        {/* Save Draft Button (Opens confirmation dialog) */}
        <TouchableOpacity
          style={[styles.headerActionBtn, { backgroundColor: "#2563eb" }]}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          onPress={handleOpenSaveDialog}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="checkmark" size={22} color="#ffffff" />
          )}
        </TouchableOpacity>

        {/* More Options (...) Button */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          onPress={() => setIsMoreMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      {/* Segmented Ribbon Controller (Kept in top position below header with Clear Text Labels) */}
      <View style={styles.ribbonHeader}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentedTab,
              toolbarMode === "format" && styles.segmentedTabActive,
            ]}
            onPress={() => {
              if (toolbarMode === "format") {
                setIsRibbonCollapsed((prev) => !prev);
              } else {
                setToolbarMode("format");
                setIsRibbonCollapsed(false);
              }
            }}
          >
            <Ionicons
              name="text-outline"
              size={13}
              color={toolbarMode === "format" ? "#ffffff" : "#94a3b8"}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.segmentedTabText,
                toolbarMode === "format" && styles.segmentedTabTextActive,
              ]}
            >
              Formatting
            </Text>
            <Ionicons
              name={
                toolbarMode === "format"
                  ? isRibbonCollapsed
                    ? "chevron-forward"
                    : "chevron-down"
                  : "chevron-forward"
              }
              size={12}
              color={toolbarMode === "format" ? "#ffffff" : "#94a3b8"}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentedTab,
              toolbarMode === "legal" && styles.segmentedTabActive,
            ]}
            onPress={() => {
              if (toolbarMode === "legal") {
                setIsRibbonCollapsed((prev) => !prev);
              } else {
                setToolbarMode("legal");
                setIsRibbonCollapsed(false);
              }
            }}
          >
            <Ionicons
              name="briefcase-outline"
              size={13}
              color={toolbarMode === "legal" ? "#ffffff" : "#94a3b8"}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.segmentedTabText,
                toolbarMode === "legal" && styles.segmentedTabTextActive,
              ]}
            >
              Legal Assist
            </Text>
            <Ionicons
              name={
                toolbarMode === "legal"
                  ? isRibbonCollapsed
                    ? "chevron-forward"
                    : "chevron-down"
                  : "chevron-forward"
              }
              size={12}
              color={toolbarMode === "legal" ? "#ffffff" : "#94a3b8"}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.hudChip}
          onPress={() => setIsPageSetupVisible(true)}
        >
          <Ionicons name="options-outline" size={13} color="#94a3b8" />
          <Text style={styles.hudChipText}>Page Setup</Text>
        </TouchableOpacity>
      </View>

      {/* Ribbon Toolbars with Clear Text Labels */}
      {!isRibbonCollapsed &&
        (toolbarMode === "format" ? (
          <View style={styles.ribbonContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ribbonContent}
            >
              {/* Bold */}
              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.bold && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("bold")}
              >
                <FontAwesome name="bold" size={14} color={editorState.bold ? "#2563eb" : "#334155"} />
                <Text style={[styles.toolLabel, editorState.bold && styles.toolLabelActive]}>Bold</Text>
              </TouchableOpacity>

              {/* Italic */}
              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.italic && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("italic")}
              >
                <FontAwesome name="italic" size={14} color={editorState.italic ? "#2563eb" : "#334155"} />
                <Text style={[styles.toolLabel, editorState.italic && styles.toolLabelActive]}>Italic</Text>
              </TouchableOpacity>

              {/* Underline */}
              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.underline && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("underline")}
              >
                <FontAwesome name="underline" size={14} color={editorState.underline ? "#2563eb" : "#334155"} />
                <Text style={[styles.toolLabel, editorState.underline && styles.toolLabelActive]}>Underline</Text>
              </TouchableOpacity>

              <View style={styles.toolbarDivider} />

              {/* Align Left */}
              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.alignLeft && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("justifyLeft")}
              >
                <FontAwesome name="align-left" size={14} color={editorState.alignLeft ? "#2563eb" : "#334155"} />
                <Text style={styles.toolLabel}>Left</Text>
              </TouchableOpacity>

              {/* Align Center */}
              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.alignCenter && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("justifyCenter")}
              >
                <FontAwesome name="align-center" size={14} color={editorState.alignCenter ? "#2563eb" : "#334155"} />
                <Text style={styles.toolLabel}>Center</Text>
              </TouchableOpacity>

              {/* Align Right */}
              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.alignRight && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("justifyRight")}
              >
                <FontAwesome name="align-right" size={14} color={editorState.alignRight ? "#2563eb" : "#334155"} />
                <Text style={styles.toolLabel}>Right</Text>
              </TouchableOpacity>

              {/* Justify */}
              <TouchableOpacity
                style={styles.labeledToolItem}
                onPress={() => triggerFormat("justifyFull")}
              >
                <FontAwesome name="align-justify" size={14} color="#334155" />
                <Text style={styles.toolLabel}>Justify</Text>
              </TouchableOpacity>

              <View style={styles.toolbarDivider} />

              {/* Bullet List */}
              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.unorderedList && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("insertUnorderedList")}
              >
                <FontAwesome name="list-ul" size={14} color={editorState.unorderedList ? "#2563eb" : "#334155"} />
                <Text style={styles.toolLabel}>Bullets</Text>
              </TouchableOpacity>

              {/* Number List */}
              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.orderedList && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("insertOrderedList")}
              >
                <FontAwesome name="list-ol" size={14} color={editorState.orderedList ? "#2563eb" : "#334155"} />
                <Text style={styles.toolLabel}>Numbers</Text>
              </TouchableOpacity>

              {/* New Paragraph */}
              <TouchableOpacity
                style={styles.labeledToolItem}
                onPress={() => triggerFormat("insertParagraph")}
              >
                <Ionicons name="return-down-forward" size={15} color="#334155" />
                <Text style={styles.toolLabel}>New Para</Text>
              </TouchableOpacity>

              <View style={styles.toolbarDivider} />

              {/* Scan Document OCR */}
              <TouchableOpacity
                style={[styles.labeledToolItem, { backgroundColor: "#eff6ff" }]}
                onPress={handleScanToEditorOcr}
              >
                <Ionicons name="scan-outline" size={16} color="#2563eb" />
                <Text style={[styles.toolLabel, { color: "#2563eb", fontWeight: "700" }]}>Scan OCR</Text>
              </TouchableOpacity>

              {/* Insert Table */}
              <TouchableOpacity
                style={styles.labeledToolItem}
                onPress={() => setTableConfigModalVisible(true)}
              >
                <Ionicons name="grid-outline" size={15} color="#334155" />
                <Text style={styles.toolLabel}>Table</Text>
              </TouchableOpacity>

              {/* Page Break */}
              <TouchableOpacity
                style={styles.labeledToolItem}
                onPress={() => triggerFormat("insertPageBreak")}
              >
                <Ionicons name="document-text-outline" size={15} color="#334155" />
                <Text style={styles.toolLabel}>Break</Text>
              </TouchableOpacity>

              {/* Digital Touch Signature Canvas */}
              <TouchableOpacity
                style={styles.labeledToolItem}
                onPress={() => setSignatureModalVisible(true)}
              >
                <Ionicons name="pencil-outline" size={15} color="#334155" />
                <Text style={styles.toolLabel}>Draw Sign</Text>
              </TouchableOpacity>

              {/* Shapes & Fee Stamp */}
              <TouchableOpacity
                style={styles.labeledToolItem}
                onPress={() => setShapeModalVisible(true)}
              >
                <Ionicons name="shapes-outline" size={15} color="#334155" />
                <Text style={styles.toolLabel}>Seals</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.legalRibbonContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.legalRibbonContent}
            >
              {/* Universal Legal Macro Snippets Modal Launcher */}
              <TouchableOpacity
                style={[styles.labeledLegalItem, { backgroundColor: "#1e3a8a", borderColor: "#3b82f6" }]}
                onPress={() => setIsMacrosModalVisible(true)}
              >
                <Ionicons name="flash" size={15} color="#60a5fa" />
                <Text style={[styles.legalToolLabel, { color: "#ffffff", fontWeight: "bold" }]}>
                  Legal Snippets
                </Text>
              </TouchableOpacity>

              {/* Legal Symbols */}
              {["§", "¶", "Δ", "π", "№"].map((sym) => (
                <TouchableOpacity
                  key={sym}
                  style={styles.legalSymbolBtn}
                  onPress={() => triggerFormat("insertText", sym)}
                >
                  <Text style={styles.legalSymbolText}>{sym}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.toolbarDivider} />

              {/* Signature Block Drawer */}
              <TouchableOpacity
                style={styles.labeledLegalItem}
                onPress={() => setIsSignatureListVisible(true)}
              >
                <Ionicons name="document-attach-outline" size={14} color="#60a5fa" />
                <Text style={styles.legalToolLabel}>Signature</Text>
              </TouchableOpacity>

              {/* Legal Dictionary / Vocabulary */}
              <TouchableOpacity
                style={styles.labeledLegalItem}
                onPress={() => setIsVocabularyVisible(true)}
              >
                <Ionicons name="book-outline" size={14} color="#60a5fa" />
                <Text style={styles.legalToolLabel}>Dictionary</Text>
              </TouchableOpacity>

              <View style={styles.toolbarDivider} />

              {/* Case Converters */}
              {[
                { label: "UPPER", value: "upper" },
                { label: "lower", value: "lower" },
                { label: "Title", value: "title" },
              ].map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={styles.caseConverterBtn}
                  onPress={() => triggerFormat("changeCase", c.value)}
                >
                  <Text style={styles.caseConverterText}>{c.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.toolbarDivider} />

              {/* Next Placeholder Navigator */}
              <TouchableOpacity
                style={styles.nextPlaceholderBtn}
                onPress={() => triggerFormat("nextPlaceholder")}
              >
                <Ionicons name="play-skip-forward-outline" size={12} color="#ffffff" />
                <Text style={styles.nextPlaceholderText}>Next [__]</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ))}

      {/* Editor Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.editorWrapper}>
          {!isTransitionFinished || isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Initializing Tiptap AST Engine...</Text>
            </View>
          ) : null}

          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: initialEditorHtml }}
            onMessage={handleWebViewMessage}
            onLoadEnd={() => {
              setIsLoading(false);
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
              const contentToInject = htmlContent || initialHtml;
              if (contentToInject) {
                postMessageToWebView({ type: "load", html: contentToInject });
              }
            }}
            onError={() => setIsLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            style={styles.webView}
            scrollEnabled={true}
            hideKeyboardAccessoryView={true}
            keyboardDisplayRequiresUserAction={false}
          />

          {/* Floating Smart Voice Dictation Assistant Island (Bottom-Right Thumb Reach) */}
          <View style={styles.floatingDictationWrapper} pointerEvents="box-none">
            {isDictating && (
              <View style={styles.liveSpeechIsland}>
                <View style={styles.speechHeaderRow}>
                  <View style={styles.speechIndicatorPulse}>
                    <Ionicons name="mic" size={14} color="#ffffff" />
                  </View>
                  <Text style={styles.speechStatusTitle}>
                    {docDraftLanguage === "hi" ? "हिंदी डिक्टेशन सक्रिय" : "Dictating (English)..."}
                  </Text>

                  {/* Language Toggle Chip */}
                  <TouchableOpacity
                    style={styles.speechLangChip}
                    onPress={() => {
                      const nextLang = docDraftLanguage === "en" ? "hi" : "en";
                      setDocDraftLanguage(nextLang);
                      postMessageToWebView({ type: "setEditorLanguage", lang: nextLang });
                    }}
                  >
                    <Text style={styles.speechLangText}>
                      {docDraftLanguage === "en" ? "EN ➔ HI" : "HI ➔ EN"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {liveSpeechPreview !== "" && (
                  <Text style={styles.speechLivePreviewText} numberOfLines={2}>
                    "{liveSpeechPreview}"
                  </Text>
                )}

                {/* Universal Legal Voice Punctuation & Helper Strip */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.punctuationRow}
                >
                  {[
                    { label: " , ", val: ", " },
                    { label: docDraftLanguage === "hi" ? " । " : " . ", val: docDraftLanguage === "hi" ? "। " : ". " },
                    { label: " ; ", val: "; " },
                    { label: ' " ', val: '"' },
                    { label: " ¶ New Para ", val: "\n\n" },
                    { label: " § Section ", val: "§ " },
                    { label: " v. ", val: " v. " },
                    { label: " Next [__] ", cmd: "nextPlaceholder" },
                    { label: " ⏹️ Stop ", action: toggleVoiceDictation },
                  ].map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.punctuationChip}
                      onPress={() => {
                        if (p.action) {
                          p.action();
                        } else if (p.cmd) {
                          triggerFormat(p.cmd);
                        } else if (p.val) {
                          triggerFormat("insertText", p.val);
                        }
                      }}
                    >
                      <Text style={styles.punctuationChipText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Floating Thumb Mic Button */}
            <TouchableOpacity
              style={[
                styles.floatingThumbMicBtn,
                isDictating && styles.floatingThumbMicBtnActive,
              ]}
              onPress={toggleVoiceDictation}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isDictating ? "mic" : "mic-outline"}
                size={26}
                color="#ffffff"
              />
              <Text style={styles.floatingMicBadgeText}>
                {isDictating ? "STOP" : docDraftLanguage === "hi" ? "हिंदी" : "VOICE"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Predictive Legal Phrase Autocomplete Bar */}
        <LegalAutocompleteBar
          suggestions={autocompleteSuggestions}
          theme={theme}
          onSelectSuggestion={(phrase) => triggerFormat("insertText", phrase + " ")}
        />
      </KeyboardAvoidingView>

      {/* Universal Legal Macro Snippets Modal */}
      <Modal
        visible={isMacrosModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMacrosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Universal Legal Snippets & Captions</Text>
              <TouchableOpacity onPress={() => setIsMacrosModalVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              {[
                {
                  title: "🏛️ Court / Tribunal Caption Header",
                  desc: "Standard formal court heading with Case No. and Plaintiff vs. Defendant table",
                  cmd: "insertUniversalCaption",
                },
                {
                  title: "📑 Index of Documents (Court Filing Table)",
                  desc: "Standard legal filing index table with S.No., Document, Exhibit, Page Nos.",
                  cmd: "insertFilingIndexTable",
                },
                {
                  title: "⚖️ Prayer for Relief Clause (Wherefore)",
                  desc: "Standard universal formal prayer clause requesting relief and costs",
                  cmd: "insertPrayerClause",
                },
                {
                  title: "📜 Sworn Affidavit / Verification Block",
                  desc: "Standard Deponent solemn affirmation box confirming facts under oath",
                  cmd: "insertAffidavitBlock",
                },
                {
                  title: "📬 Proof of Filing / Certificate of Service",
                  desc: "Formal service confirmation block with date and counsel signature line",
                  cmd: "insertCertificateOfService",
                },
              ].map((macro, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.macroCard}
                  onPress={() => {
                    setIsMacrosModalVisible(false);
                    triggerFormat(macro.cmd);
                  }}
                >
                  <Text style={styles.macroTitle}>{macro.title}</Text>
                  <Text style={styles.macroDesc}>{macro.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Save Draft Dialog (Allows Renaming and Selecting Destination) */}
      <Modal
        visible={isSaveDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSaveDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.saveDialogContent}>
            <Text style={styles.saveDialogTitle}>Save Document Draft</Text>
            <Text style={styles.saveDialogSubtitle}>
              Confirm title and choose where to save this document:
            </Text>

            <TextInput
              style={styles.saveDialogInput}
              value={saveDialogTitle}
              onChangeText={setSaveDialogTitle}
              placeholder="Enter document title..."
              placeholderTextColor="#64748b"
            />

            <View style={{ gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={styles.saveDestOptionBtn}
                onPress={() => handleConfirmSave("case")}
              >
                <Ionicons name="briefcase-outline" size={18} color="#60a5fa" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.saveDestOptionTitle}>
                    {caseId ? "Save to Current Case" : "Save as Case Draft"}
                  </Text>
                  <Text style={styles.saveDestOptionDesc}>
                    Linked directly with your case timeline and filings
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveDestOptionBtn}
                onPress={() => handleConfirmSave("standalone")}
              >
                <Ionicons name="document-text-outline" size={18} color="#60a5fa" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.saveDestOptionTitle}>Save as Standalone Draft</Text>
                  <Text style={styles.saveDestOptionDesc}>
                    Stored in your General Drafts library
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveDestOptionBtn}
                onPress={() => handleConfirmSave("template")}
              >
                <Ionicons name="copy-outline" size={18} color="#34d399" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.saveDestOptionTitle, { color: "#34d399" }]}>
                    Save as Reusable Custom Template
                  </Text>
                  <Text style={styles.saveDestOptionDesc}>
                    Reuse this layout across future cases with smart fields
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveDialogCancelBtn}
              onPress={() => setIsSaveDialogVisible(false)}
            >
              <Text style={styles.saveDialogCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* More Options (•••) Bottom Sheet */}
      <Modal
        visible={isMoreMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMoreMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Document Options</Text>
              <TouchableOpacity onPress={() => setIsMoreMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, paddingVertical: 8 }}>
              {/* Page Setup */}
              <TouchableOpacity
                style={styles.moreMenuRow}
                onPress={() => {
                  setIsMoreMenuVisible(false);
                  setIsPageSetupVisible(true);
                }}
              >
                <Ionicons name="options-outline" size={20} color="#60a5fa" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.moreMenuRowTitle}>Page Setup & Margins</Text>
                  <Text style={styles.moreMenuRowDesc}>
                    Paper size, fonts, line spacing, margins, and letterhead space
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Walkthrough Tour */}
              <TouchableOpacity
                style={styles.moreMenuRow}
                onPress={() => {
                  setIsMoreMenuVisible(false);
                  setTourStepIndex(0);
                  setShowTour(true);
                }}
              >
                <Ionicons name="help-circle-outline" size={20} color="#cbd5e1" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.moreMenuRowTitle}>Advocate Walkthrough Guide</Text>
                  <Text style={styles.moreMenuRowDesc}>
                    Learn key gestures, shortcuts, and drafting tools
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Switch to Legacy Editor */}
              <TouchableOpacity
                style={styles.moreMenuRow}
                onPress={() => {
                  setIsMoreMenuVisible(false);
                  navigation.navigate("EditDraft" as never, {
                    draftId: activeDraftId,
                    caseId,
                    initialHtml: htmlContent,
                    templateType,
                    title,
                  } as never);
                }}
              >
                <Ionicons name="swap-horizontal-outline" size={20} color="#cbd5e1" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.moreMenuRowTitle}>Switch to Legacy Editor</Text>
                  <Text style={styles.moreMenuRowDesc}>
                    Open this draft in the classic webview editor
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Page Setup Customization Modal */}
      <Modal
        visible={isPageSetupVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPageSetupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Page Setup & Layout</Text>
              <TouchableOpacity onPress={() => setIsPageSetupVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Font Selection */}
              <Text style={styles.modalLabel}>Font Family</Text>
              <View style={styles.optionGroup}>
                {[
                  { label: "Times New Roman", value: "'Times New Roman', Georgia, serif" },
                  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
                  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
                ].map((item) => {
                  const isSelected = font === item.value;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonActive,
                      ]}
                      onPress={() => {
                        setFont(item.value);
                        applyLayoutSettings(item.value, lineHeight, pageSize);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Line Spacing Selection */}
              <Text style={[styles.modalLabel, { marginTop: 12 }]}>Line Spacing</Text>
              <View style={styles.optionGroup}>
                {[
                  { label: "1.15", value: "1.15" },
                  { label: "1.5", value: "1.5" },
                  { label: "1.8", value: "1.8" },
                  { label: "2.0", value: "2.0" },
                ].map((item) => {
                  const isSelected = lineHeight === item.value;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonActive,
                      ]}
                      onPress={() => {
                        setLineHeight(item.value);
                        applyLayoutSettings(font, item.value, pageSize);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Paper Size Selection */}
              <Text style={[styles.modalLabel, { marginTop: 12 }]}>Paper Size</Text>
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
                        isSelected && styles.optionButtonActive,
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
                          isSelected && styles.optionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Unit System Selector */}
              <Text style={[styles.modalLabel, { marginTop: 12 }]}>Measurement Unit</Text>
              <View style={styles.optionGroup}>
                {[
                  { label: "Inches (in)", value: "in" },
                  { label: "Millimeters (mm)", value: "mm" },
                  { label: "Pixels (px)", value: "px" },
                ].map((item) => {
                  const isSelected = unitMode === item.value;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonActive,
                      ]}
                      onPress={() => setUnitMode(item.value as any)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Margins Steppers */}
              <Text style={[styles.modalLabel, { marginTop: 14 }]}>Document Margins</Text>

              {/* Top Margin */}
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Top Margin</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.max(0, topMargin - step);
                      setTopMargin(v);
                      applyLayoutSettings(font, lineHeight, pageSize, v, bottomMargin, leftMargin, rightMargin, letterheadSpace);
                    }}
                  >
                    <Ionicons name="remove" size={14} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.stepperValueText}>
                    {formatMarginValue(topMargin, unitMode)}
                  </Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.min(200, topMargin + step);
                      setTopMargin(v);
                      applyLayoutSettings(font, lineHeight, pageSize, v, bottomMargin, leftMargin, rightMargin, letterheadSpace);
                    }}
                  >
                    <Ionicons name="add" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Left Margin */}
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Left Margin (Court Binding)</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.max(20, leftMargin - step);
                      setLeftMargin(v);
                      applyLayoutSettings(font, lineHeight, pageSize, topMargin, bottomMargin, v, rightMargin, letterheadSpace);
                    }}
                  >
                    <Ionicons name="remove" size={14} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.stepperValueText}>
                    {formatMarginValue(leftMargin, unitMode)}
                  </Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.min(200, leftMargin + step);
                      setLeftMargin(v);
                      applyLayoutSettings(font, lineHeight, pageSize, topMargin, bottomMargin, v, rightMargin, letterheadSpace);
                    }}
                  >
                    <Ionicons name="add" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Right Margin */}
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Right Margin</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.max(0, rightMargin - step);
                      setRightMargin(v);
                      applyLayoutSettings(font, lineHeight, pageSize, topMargin, bottomMargin, leftMargin, v, letterheadSpace);
                    }}
                  >
                    <Ionicons name="remove" size={14} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.stepperValueText}>
                    {formatMarginValue(rightMargin, unitMode)}
                  </Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.min(200, rightMargin + step);
                      setRightMargin(v);
                      applyLayoutSettings(font, lineHeight, pageSize, topMargin, bottomMargin, leftMargin, v, letterheadSpace);
                    }}
                  >
                    <Ionicons name="add" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Margin */}
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Bottom Margin</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.max(0, bottomMargin - step);
                      setBottomMargin(v);
                      applyLayoutSettings(font, lineHeight, pageSize, topMargin, v, leftMargin, rightMargin, letterheadSpace);
                    }}
                  >
                    <Ionicons name="remove" size={14} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.stepperValueText}>
                    {formatMarginValue(bottomMargin, unitMode)}
                  </Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.min(200, bottomMargin + step);
                      setBottomMargin(v);
                      applyLayoutSettings(font, lineHeight, pageSize, topMargin, v, leftMargin, rightMargin, letterheadSpace);
                    }}
                  >
                    <Ionicons name="add" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Letterhead Top Space */}
              <View style={styles.marginRow}>
                <Text style={styles.marginLabel}>Letterhead Top Space</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.max(0, letterheadSpace - step * 2);
                      setLetterheadSpace(v);
                      applyLayoutSettings(font, lineHeight, pageSize, topMargin, bottomMargin, leftMargin, rightMargin, v);
                    }}
                  >
                    <Ionicons name="remove" size={14} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.stepperValueText}>
                    {formatMarginValue(letterheadSpace, unitMode)}
                  </Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const step = getMarginStepPx(unitMode);
                      const v = Math.min(300, letterheadSpace + step * 2);
                      setLetterheadSpace(v);
                      applyLayoutSettings(font, lineHeight, pageSize, topMargin, bottomMargin, leftMargin, rightMargin, v);
                    }}
                  >
                    <Ionicons name="add" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setIsPageSetupVisible(false)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Supporting Modals */}
      <PlaceholderBottomSheet
        visible={placeholderModalVisible}
        placeholderLabel={activePlaceholderLabel}
        cleanLabel={activePlaceholderClean}
        theme={theme}
        onApply={(label, newVal) => {
          postMessageToWebView({
            type: "exec",
            command: "replacePlaceholderValue",
            label: label,
            value: newVal,
          });
          setPlaceholderModalVisible(false);
        }}
        onClose={() => setPlaceholderModalVisible(false)}
      />

      <SignatureCanvasModal
        visible={signatureModalVisible}
        theme={theme}
        onSelectSignature={(sigBase64) => {
          triggerFormat("insertSignature", sigBase64);
          setSignatureModalVisible(false);
        }}
        onClose={() => setSignatureModalVisible(false)}
      />

      <TableConfigModal
        visible={tableConfigModalVisible}
        theme={theme}
        onInsertTable={(r, c) => {
          postMessageToWebView({
            type: "exec",
            command: "insertTable",
            rows: r,
            cols: c,
          });
          setTableConfigModalVisible(false);
        }}
        onClose={() => setTableConfigModalVisible(false)}
      />

      <ElementContextModal
        visible={elementContextModalVisible}
        elementType={selectedElementType}
        theme={theme}
        onDeleteElement={() => triggerFormat("deleteSelectedElement")}
        onAddRowAbove={() => triggerFormat("tableAddRowAbove")}
        onAddRowBelow={() => triggerFormat("tableAddRowBelow")}
        onAddColLeft={() => triggerFormat("tableAddColLeft")}
        onAddColRight={() => triggerFormat("tableAddColRight")}
        onDeleteRow={() => triggerFormat("tableDeleteRow")}
        onDeleteCol={() => triggerFormat("tableDeleteCol")}
        onClose={() => setElementContextModalVisible(false)}
      />

      <OcrReviewModal
        visible={ocrModalVisible}
        imageUri={ocrModalImageUri}
        extractedText={ocrModalExtractedText}
        onClose={() => setOcrModalVisible(false)}
        onImport={handleImportOcrText}
      />

      {/* Signature Block Selection Modal */}
      <Modal
        visible={isSignatureListVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSignatureListVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Insert Signature / Verification</Text>
              <TouchableOpacity onPress={() => setIsSignatureListVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
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
                  style={styles.signatureOptionCard}
                  onPress={() => {
                    triggerFormat("insertHTML", item.html);
                    setIsSignatureListVisible(false);
                  }}
                >
                  <Text style={styles.signatureOptionTitle}>{item.title}</Text>
                  <Text style={styles.signatureOptionDesc}>{item.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Geometry Shape & Fee Stamp Modal */}
      <Modal
        visible={shapeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShapeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Insert Shape / Legal Stamp</Text>
              <TouchableOpacity onPress={() => setShapeModalVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, paddingVertical: 12 }}>
              {[
                {
                  title: "⏹️ Rectangle / Stamp Box",
                  desc: "Standard bordered box for custom notes or fee seals",
                  value: "rect",
                },
                {
                  title: "🏷️ Court Fee Stamp Frame",
                  desc: "Double-bordered ₹10/₹100 Fee Stamp placeholder box",
                  value: "stamp",
                },
                {
                  title: "⭕ Advocate Round Seal",
                  desc: "Circular stamp frame for Advocate office / Notary seal",
                  value: "circle",
                },
                {
                  title: "➡️ Process Arrow",
                  desc: "Legal chronology flowchart process arrow node",
                  value: "arrow",
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.shapeOptionCard}
                  onPress={() => {
                    setShapeModalVisible(false);
                    triggerFormat("insertShape", item.value);
                  }}
                >
                  <Text style={styles.shapeOptionTitle}>{item.title}</Text>
                  <Text style={styles.shapeOptionDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Legal Vocabulary / Dictionary Modal */}
      <Modal
        visible={isVocabularyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVocabularyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Legal Dictionary & Maxims</Text>
              <TouchableOpacity onPress={() => setIsVocabularyVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.vocabSearchContainer}>
              <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 6 }} />
              <TextInput
                placeholder="Search legal words, maxims..."
                placeholderTextColor="#64748b"
                style={styles.vocabSearchInput}
                value={vocabSearchQuery}
                onChangeText={setVocabSearchQuery}
              />
              {vocabSearchQuery !== "" && (
                <TouchableOpacity onPress={() => setVocabSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {LEGAL_VOCABULARY.filter(
                (item) =>
                  item.english.toLowerCase().includes(vocabSearchQuery.toLowerCase()) ||
                  item.hindi.includes(vocabSearchQuery) ||
                  item.transliteration.toLowerCase().includes(vocabSearchQuery.toLowerCase())
              ).map((item, idx) => (
                <View key={idx} style={styles.vocabItemCard}>
                  <View style={styles.vocabItemTopRow}>
                    <Text style={styles.vocabItemEnglish}>{item.english}</Text>
                    <Text style={styles.vocabItemHindi}>{item.hindi}</Text>
                  </View>
                  <Text style={styles.vocabItemPronounce}>
                    Pronunciation: {item.transliteration}
                  </Text>
                  <Text style={styles.vocabItemMeaning}>{item.meaning}</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={styles.vocabInsertBtn}
                      onPress={() => {
                        triggerFormat("insertText", item.english);
                        setIsVocabularyVisible(false);
                      }}
                    >
                      <Text style={styles.vocabInsertText}>Insert English</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.vocabInsertBtn}
                      onPress={() => {
                        triggerFormat("insertText", item.hindi);
                        setIsVocabularyVisible(false);
                      }}
                    >
                      <Text style={styles.vocabInsertText}>Insert Hindi</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Walkthrough Tour Modal */}
      <Modal
        visible={showTour}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTour(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tourModalContent}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={styles.tourIconContainer}>
                <Ionicons
                  name={tourSteps[tourStepIndex].icon as any}
                  size={32}
                  color="#3b82f6"
                />
              </View>
              <Text style={styles.tourTitle}>{tourSteps[tourStepIndex].title}</Text>
              <Text style={styles.tourDescription}>
                {tourSteps[tourStepIndex].description}
              </Text>
            </View>

            {/* Pagination Indicators */}
            <View style={styles.tourPagination}>
              {tourSteps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.tourDot,
                    i === tourStepIndex && styles.tourDotActive,
                  ]}
                />
              ))}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              {tourStepIndex > 0 ? (
                <View style={{ flex: 1 }}>
                  <ActionButton
                    title={locale === "hi" ? "पीछे" : "Back"}
                    onPress={() => setTourStepIndex((prev) => prev - 1)}
                    type="secondary"
                  />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <ActionButton
                    title={locale === "hi" ? "छोड़ें" : "Skip"}
                    onPress={async () => {
                      try {
                        await AsyncStorage.setItem("@tiptap_editor_tour_seen", "true");
                      } catch (e) {}
                      setShowTour(false);
                    }}
                    type="secondary"
                  />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <ActionButton
                  title={
                    tourStepIndex === tourSteps.length - 1
                      ? locale === "hi"
                        ? "समाप्त"
                        : "Finish"
                      : locale === "hi"
                        ? "आगे"
                        : "Next"
                  }
                  onPress={async () => {
                    if (tourStepIndex < tourSteps.length - 1) {
                      setTourStepIndex((prev) => prev + 1);
                    } else {
                      try {
                        await AsyncStorage.setItem("@tiptap_editor_tour_seen", "true");
                      } catch (e) {}
                      setShowTour(false);
                    }
                  }}
                  type="primary"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#0f172a",
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#0f172a",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#1e293b",
    },
    headerBackBtn: {
      padding: 4,
    },
    headerTitleColumn: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    headerTitleInput: {
      fontSize: 15,
      fontWeight: "bold",
      color: "#ffffff",
      paddingVertical: 2,
      paddingHorizontal: 0,
    },
    headerStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 1,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      marginRight: 5,
    },
    headerStatusText: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: "500",
    },
    headerActionBtn: {
      width: 34,
      height: 34,
      backgroundColor: "#1e293b",
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#334155",
    },
    ribbonHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#1e293b",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#334155",
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: "#0f172a",
      borderRadius: 20,
      padding: 3,
      gap: 2,
    },
    segmentedTab: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 16,
    },
    segmentedTabActive: {
      backgroundColor: "#2563eb",
    },
    segmentedTabText: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#94a3b8",
    },
    segmentedTabTextActive: {
      color: "#ffffff",
    },
    hudChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#0f172a",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#334155",
    },
    hudChipText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#cbd5e1",
    },
    ribbonContainer: {
      backgroundColor: "#f8fafc",
      borderBottomWidth: 1,
      borderBottomColor: "#cbd5e1",
      paddingVertical: 5,
    },
    ribbonContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      gap: 6,
    },
    labeledToolItem: {
      minWidth: 46,
      height: 44,
      borderRadius: 6,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#cbd5e1",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    labeledToolItemActive: {
      backgroundColor: "#dbeafe",
      borderColor: "#2563eb",
    },
    toolLabel: {
      fontSize: 9,
      fontWeight: "600",
      color: "#475569",
      marginTop: 2,
    },
    toolLabelActive: {
      color: "#2563eb",
      fontWeight: "700",
    },
    toolbarDivider: {
      width: 1,
      height: 28,
      backgroundColor: "#cbd5e1",
      marginHorizontal: 3,
    },
    legalRibbonContainer: {
      backgroundColor: "#1e293b",
      borderBottomWidth: 1,
      borderBottomColor: "#334155",
      paddingVertical: 5,
    },
    legalRibbonContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      gap: 6,
    },
    labeledLegalItem: {
      height: 44,
      borderRadius: 6,
      backgroundColor: "#0f172a",
      borderWidth: 1,
      borderColor: "#334155",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    legalToolLabel: {
      fontSize: 9,
      fontWeight: "600",
      color: "#cbd5e1",
      marginTop: 2,
    },
    legalSymbolBtn: {
      height: 44,
      minWidth: 36,
      borderRadius: 6,
      backgroundColor: "#0f172a",
      borderWidth: 1,
      borderColor: "#334155",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    legalSymbolText: {
      color: "#e2e8f0",
      fontWeight: "bold",
      fontSize: 15,
    },
    caseConverterBtn: {
      height: 44,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: "#0f172a",
      borderWidth: 1,
      borderColor: "#334155",
      alignItems: "center",
      justifyContent: "center",
    },
    caseConverterText: {
      color: "#e2e8f0",
      fontSize: 10,
      fontWeight: "700",
    },
    nextPlaceholderBtn: {
      height: 44,
      paddingHorizontal: 10,
      borderRadius: 6,
      backgroundColor: "#2563eb",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    nextPlaceholderText: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight: "bold",
    },
    editorWrapper: {
      flex: 1,
      backgroundColor: "#e2e8f0",
      position: "relative",
    },
    webView: {
      flex: 1,
      backgroundColor: "transparent",
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#ffffff",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: "#475569",
      fontWeight: "500",
    },
    floatingDictationWrapper: {
      position: "absolute",
      right: 16,
      bottom: 20,
      left: 16,
      alignItems: "flex-end",
    },
    floatingThumbMicBtn: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#2563eb",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 8,
      borderWidth: 2,
      borderColor: "#60a5fa",
    },
    floatingThumbMicBtnActive: {
      backgroundColor: "#ef4444",
      borderColor: "#fca5a5",
    },
    floatingMicBadgeText: {
      fontSize: 8,
      fontWeight: "800",
      color: "#ffffff",
      marginTop: 1,
    },
    liveSpeechIsland: {
      width: "100%",
      backgroundColor: "#0f172aee",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#3b82f6",
      padding: 12,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    speechHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    speechIndicatorPulse: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#ef4444",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 6,
    },
    speechStatusTitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: "bold",
      color: "#ffffff",
    },
    speechLangChip: {
      backgroundColor: "#2563eb",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    speechLangText: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#ffffff",
    },
    speechLivePreviewText: {
      fontSize: 13,
      color: "#93c5fd",
      fontStyle: "italic",
      marginBottom: 8,
      lineHeight: 18,
    },
    punctuationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 2,
    },
    punctuationChip: {
      backgroundColor: "#1e293b",
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#334155",
    },
    punctuationChipText: {
      color: "#e2e8f0",
      fontSize: 11,
      fontWeight: "700",
    },
    macroCard: {
      backgroundColor: "#1e293b",
      borderWidth: 1,
      borderColor: "#334155",
      borderRadius: 8,
      padding: 14,
      marginBottom: 10,
    },
    macroTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 4,
    },
    macroDesc: {
      fontSize: 12,
      color: "#94a3b8",
      lineHeight: 16,
    },
    saveDialogContent: {
      backgroundColor: "#0f172a",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#334155",
      padding: 20,
      width: "90%",
      alignSelf: "center",
    },
    saveDialogTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 4,
    },
    saveDialogSubtitle: {
      fontSize: 12,
      color: "#94a3b8",
      marginBottom: 12,
    },
    saveDialogInput: {
      backgroundColor: "#1e293b",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#334155",
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
    },
    saveDestOptionBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1e293b",
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: "#334155",
      gap: 12,
    },
    saveDestOptionTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 2,
    },
    saveDestOptionDesc: {
      fontSize: 11,
      color: "#94a3b8",
    },
    saveDialogCancelBtn: {
      marginTop: 14,
      paddingVertical: 10,
      alignItems: "center",
    },
    saveDialogCancelText: {
      color: "#94a3b8",
      fontSize: 13,
      fontWeight: "600",
    },
    moreMenuRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1e293b",
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#334155",
      gap: 12,
    },
    moreMenuRowTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 2,
    },
    moreMenuRowDesc: {
      fontSize: 11,
      color: "#94a3b8",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.75)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: "#0f172a",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderColor: "#334155",
      padding: 20,
      paddingBottom: Platform.OS === "ios" ? 40 : 20,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: "#334155",
      paddingBottom: 12,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: "#ffffff",
    },
    modalLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: "#94a3b8",
      marginBottom: 8,
    },
    optionGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 6,
      marginBottom: 12,
    },
    optionButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#334155",
      borderRadius: 8,
      paddingVertical: 8,
      backgroundColor: "#1e293b",
      justifyContent: "center",
      alignItems: "center",
    },
    optionButtonActive: {
      backgroundColor: "#2563eb",
      borderColor: "#3b82f6",
    },
    optionText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#cbd5e1",
    },
    optionTextActive: {
      color: "#ffffff",
      fontWeight: "700",
    },
    marginRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 6,
    },
    marginLabel: {
      color: "#e2e8f0",
      fontSize: 13,
      fontWeight: "500",
    },
    stepperContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    stepperBtn: {
      width: 28,
      height: 28,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#334155",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#1e293b",
    },
    stepperValueText: {
      width: 76,
      textAlign: "center",
      fontWeight: "bold",
      color: "#ffffff",
      fontSize: 12,
    },
    modalDoneButton: {
      height: 44,
      borderRadius: 8,
      backgroundColor: "#2563eb",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 16,
    },
    modalDoneText: {
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: 14,
    },
    signatureOptionCard: {
      backgroundColor: "#1e293b",
      borderWidth: 1,
      borderColor: "#334155",
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
    },
    signatureOptionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 4,
    },
    signatureOptionDesc: {
      fontSize: 12,
      color: "#94a3b8",
    },
    shapeOptionCard: {
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#334155",
      backgroundColor: "#1e293b",
    },
    shapeOptionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 2,
    },
    shapeOptionDesc: {
      fontSize: 12,
      color: "#94a3b8",
    },
    vocabSearchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1e293b",
      borderRadius: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: "#334155",
      height: 40,
      marginBottom: 12,
    },
    vocabSearchInput: {
      flex: 1,
      color: "#ffffff",
      fontSize: 13,
      padding: 0,
    },
    vocabItemCard: {
      borderBottomWidth: 1,
      borderBottomColor: "#334155",
      paddingVertical: 12,
    },
    vocabItemTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    vocabItemEnglish: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#ffffff",
    },
    vocabItemHindi: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#60a5fa",
    },
    vocabItemPronounce: {
      fontSize: 11,
      color: "#94a3b8",
      fontStyle: "italic",
      marginBottom: 4,
    },
    vocabItemMeaning: {
      fontSize: 12,
      color: "#cbd5e1",
      marginBottom: 8,
    },
    vocabInsertBtn: {
      backgroundColor: "#1e3a8a44",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      borderWidth: 0.5,
      borderColor: "#3b82f6",
    },
    vocabInsertText: {
      color: "#60a5fa",
      fontSize: 11,
      fontWeight: "bold",
    },
    tourModalContent: {
      backgroundColor: "#0f172a",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#334155",
      padding: 24,
      maxWidth: 340,
      alignSelf: "center",
    },
    tourIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#1e3a8a33",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    tourTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: "#ffffff",
      textAlign: "center",
      marginBottom: 8,
    },
    tourDescription: {
      fontSize: 13,
      color: "#94a3b8",
      textAlign: "center",
      lineHeight: 18,
    },
    tourPagination: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      marginBottom: 20,
    },
    tourDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#334155",
    },
    tourDotActive: {
      backgroundColor: "#2563eb",
    },
  });

export default TiptapEditDraftScreen;
