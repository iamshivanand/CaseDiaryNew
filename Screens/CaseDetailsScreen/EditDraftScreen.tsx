// Screens/CaseDetailsScreen/EditDraftScreen.tsx
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
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
  StatusBar,
  Text,
  Modal,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { v4 as uuidv4 } from "uuid";

import { legalAutocompleteService } from "../../utils/legalAutocompleteService";
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
import { extractLegalEntities, ExtractedLegalEntities } from "../../utils/legalNerService";
import { LEGAL_VOCABULARY } from "../../utils/legalVocabulary";
import { extractTextFromImages } from "../../utils/ocrService";
import { getOfflineEditorHtml } from "../../utils/offlineEditorTemplate";
import { speechRecognitionService } from "../../utils/speechRecognitionService";
import { createNamedPdfFile, shareNamedPdf } from "../../utils/fileShareHelper";
import ActionButton from "../CommonComponents/ActionButton";

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
  const { t, locale, setLocale } = useTranslation();
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

  const [docStats, setDocStats] = useState({
    wordCount: 0,
    charCount: 0,
    estimatedPages: 1,
  });

  // Page setup state
  const [font, setFont] = useState("Times New Roman");
  const [lineHeight, setLineHeight] = useState("1.6");
  const [topMargin, setTopMargin] = useState(16);
  const [bottomMargin, setBottomMargin] = useState(16);
  const [leftMargin, setLeftMargin] = useState(36);
  const [rightMargin, setRightMargin] = useState(16);
  const [letterheadSpace, setLetterheadSpace] = useState(0);
  const [unitMode, setUnitMode] = useState<"in" | "mm" | "px">("in");
  const [isPageSetupVisible, setIsPageSetupVisible] = useState(false);
  const [docDraftLanguage, setDocDraftLanguage] = useState<"en" | "hi">("en");
  const [ocrModalVisible, setOcrModalVisible] = useState(false);
  const [ocrModalImageUri, setOcrModalImageUri] = useState<string | null>(null);
  const [ocrModalExtractedText, setOcrModalExtractedText] = useState("");

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
  const [pageSize, setPageSize] = useState<"a4" | "legal">("legal");
  const [toolbarMode, setToolbarMode] = useState<"format" | "legal">("format");
  const [isTransitionFinished, setIsTransitionFinished] = useState(false);
  const [isVocabularyVisible, setIsVocabularyVisible] = useState(false);
  const [isSignatureListVisible, setIsSignatureListVisible] = useState(false);
  const [vocabSearchQuery, setVocabSearchQuery] = useState("");
  const [showTour, setShowTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // New Offline AI & UI state variables
  const [placeholderModalVisible, setPlaceholderModalVisible] = useState(false);
  const [activePlaceholderLabel, setActivePlaceholderLabel] = useState("");
  const [activePlaceholderClean, setActivePlaceholderClean] = useState("");
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [extractedEntities, setExtractedEntities] =
    useState<ExtractedLegalEntities | null>(null);
  const [showEntitiesCard, setShowEntitiesCard] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [tableConfigModalVisible, setTableConfigModalVisible] = useState(false);
  const [elementContextModalVisible, setElementContextModalVisible] =
    useState(false);
  const [selectedElementType, setSelectedElementType] = useState<
    "table" | "signature" | null
  >(null);
  const [shapeModalVisible, setShapeModalVisible] = useState(false);

  const tourSteps = [
    {
      title:
        locale === "hi"
          ? "दस्तावेज़ संपादक मार्गदर्शिका"
          : "Document Editor Guide",
      description:
        locale === "hi"
          ? "आपका स्वागत है! आइए इस नए लाइव एडिटर की मुख्य विशेषताओं का जल्दी से परिचय लें।"
          : "Welcome! Let's take a quick tour of the key features in this document editor.",
      icon: "book-outline",
    },
    {
      title:
        locale === "hi"
          ? "लाइव स्वरूपण (Formatting) उपकरण"
          : "Formatting Tools",
      description:
        locale === "hi"
          ? "बोल्ड, इटैलिक, अंडरलाइन, संरेखण (alignment), और बुलेट/नंबर सूचियों का उपयोग करके अपने दस्तावेज़ को तुरंत स्वरूपित करें।"
          : "Format your text instantly using Bold, Italic, Underline, alignments, and lists in the formatting toolbar.",
      icon: "text-outline",
    },
    {
      title: locale === "hi" ? "पेज सेटअप और मार्जिन" : "Page Setup & Margins",
      description:
        locale === "hi"
          ? "पेज साइज (A4 बनाम Legal), फ़ॉन्ट आकार, लाइन स्पेसिंग, और रेड लेज़र मार्जिन लाइनों को आवश्यकतानुसार समायोजित करें।"
          : "Configure paper size (A4 vs Legal), active fonts, margins, line spacing, and print properties easily.",
      icon: "settings-outline",
    },
    {
      title: locale === "hi" ? "पेज ब्रेक जोड़ना" : "Insert Page Breaks",
      description:
        locale === "hi"
          ? "नई 'पेज ब्रेक' सुविधा से दस्तावेज़ को अलग-अलग पेजों में विभाजित करें ताकि प्रिंट या पीडीएफ में पेज सही जगह से कटें।"
          : "Use the new Page Break feature to insert page dividers. The generated PDF will cleanly break the page at these points.",
      icon: "layers-outline",
    },
    {
      title: locale === "hi" ? "स्मार्ट प्लेसहोल्डर्स" : "Smart Placeholders",
      description:
        locale === "hi"
          ? "दस्तावेज़ में मौजूद [Client Name] जैसे कोष्ठक वाले शब्दों पर केवल एक बार टैप करके उन्हें आसानी से बदलें।"
          : "Tap on any bracketed text like [Client Name] or lines like _____ to open a quick fill popup and replace them instantly.",
      icon: "create-outline",
    },
    {
      title:
        locale === "hi" ? "टेम्पलेट के रूप में सहेजें" : "Save as Template",
      description:
        locale === "hi"
          ? "इस दस्तावेज़ को एक नए कस्टम टेम्पलेट के रूप में सहेजें, ताकि भविष्य में किसी भी केस के लिए इसका पुनः उपयोग किया जा सके!"
          : "Save your customized drafts as reusable custom templates. Next time, they will automatically fill in details for new cases!",
      icon: "save-outline",
    },
  ];

  useEffect(() => {
    const checkTourSeen = async () => {
      try {
        const seen = await AsyncStorage.getItem("@editor_tour_seen");
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
    // Optimistic state toggle for instant active button highlight UI
    if (command === "bold")
      setEditorState((prev) => ({ ...prev, bold: !prev.bold }));
    if (command === "italic")
      setEditorState((prev) => ({ ...prev, italic: !prev.italic }));
    if (command === "underline")
      setEditorState((prev) => ({ ...prev, underline: !prev.underline }));
    if (command === "justifyLeft")
      setEditorState((prev) => ({
        ...prev,
        alignLeft: true,
        alignCenter: false,
        alignRight: false,
        alignJustify: false,
      }));
    if (command === "justifyCenter")
      setEditorState((prev) => ({
        ...prev,
        alignLeft: false,
        alignCenter: true,
        alignRight: false,
        alignJustify: false,
      }));
    if (command === "justifyRight")
      setEditorState((prev) => ({
        ...prev,
        alignLeft: false,
        alignCenter: false,
        alignRight: true,
        alignJustify: false,
      }));
    if (command === "justifyFull")
      setEditorState((prev) => ({
        ...prev,
        alignLeft: false,
        alignCenter: false,
        alignRight: false,
        alignJustify: true,
      }));
    if (command === "insertUnorderedList")
      setEditorState((prev) => ({
        ...prev,
        unorderedList: !prev.unorderedList,
        orderedList: false,
      }));
    if (command === "insertOrderedList")
      setEditorState((prev) => ({
        ...prev,
        orderedList: !prev.orderedList,
        unorderedList: false,
      }));

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

      if (data.type === "openPlaceholderModal") {
        setActivePlaceholderLabel(data.label || "");
        setActivePlaceholderClean(data.cleanLabel || "");
        setPlaceholderModalVisible(true);
      } else if (data.type === "openElementContextModal") {
        setSelectedElementType(data.elementType || "table");
        setElementContextModalVisible(true);
      } else if (data.type === "state") {
        setEditorState(data.state);
        if (data.stats) {
          setDocStats(data.stats);
          if (data.stats.text) {
            const entities = extractLegalEntities(data.stats.text);
            setExtractedEntities(entities);

            // Compute predictive autocomplete suggestions from last typed word/phrase
            const words = data.stats.text.trim().split(/\s+/);
            const lastWord = words.length > 0 ? words[words.length - 1] : "";
            if (lastWord.length >= 2) {
              const matches = legalAutocompleteService.getSuggestions(
                lastWord,
                5
              );
              setAutocompleteSuggestions(matches);
            } else {
              setAutocompleteSuggestions([]);
            }
          }
        }
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

  // 1. Scan-to-Editor OCR Action with Choice Modal (Camera / Gallery / Multi-Page Scanner)
  const handleScanToEditorOcr = () => {
    postMessageToWebView({ type: "saveSelection" });
    Alert.alert(
      "Scan & Extract Text (OCR)",
      "Choose how to attach or scan document photo:",
      [
        {
          text: "📷 Take Photo",
          onPress: () => processOcrFromSource("camera"),
        },
        {
          text: "🖼️ Pick from Gallery",
          onPress: () => processOcrFromSource("gallery"),
        },
        {
          text: "📄 Multi-Page Scanner",
          onPress: () => processOcrFromSource("scanner"),
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
        } else {
          Alert.alert(
            "Permission Required",
            "Camera permission is required to take photo for OCR."
          );
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
        } else {
          Alert.alert(
            "Permission Required",
            "Gallery permission is required to select photos for OCR."
          );
        }
      }

      if (scannedUris.length > 0) {
        const extractedText = await extractTextFromImages(scannedUris);
        const firstUri = scannedUris.length > 0 ? scannedUris[0] : null;
        setOcrModalImageUri(firstUri);
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

  // 2. Offline Voice Dictation Toggle
  const toggleVoiceDictation = async () => {
    if (isDictating) {
      await speechRecognitionService.stopListening();
      setIsDictating(false);
    } else {
      setIsDictating(true);
      const dictationLocale =
        docDraftLanguage === "hi" || locale === "hi" ? "hi-IN" : "en-IN";
      const started = await speechRecognitionService.startListening(
        dictationLocale,
        {
          onStart: () => setIsDictating(true),
          onResult: (text) => {
            if (text) {
              const processed = text
                .replace(/\b(full stop|period)\b/gi, ".")
                .replace(/\b(पूर्ण विराम)\b/gi, "।")
                .replace(/\b(comma)\b/gi, ",")
                .replace(/\b(अल्पविराम)\b/gi, ",")
                .replace(/\b(new paragraph|next paragraph)\b/gi, "\n\n")
                .replace(/\b(नया पैराग्राफ|नया पैरा)\b/gi, "\n\n");
              triggerFormat("insertText", processed + " ");
            }
          },
          onError: (err) => {
            setIsDictating(false);
            Alert.alert("Dictation Error", err || "Speech recognition error");
          },
          onEnd: () => setIsDictating(false),
        }
      );
      if (!started) {
        setIsDictating(false);
      }
    }
  };

  // 3. Update Placeholder Value Handler
  const handleApplyPlaceholderValue = (
    originalLabel: string,
    newValue: string
  ) => {
    postMessageToWebView({
      type: "exec",
      command: "replacePlaceholderValue",
      label: originalLabel,
      value: newValue,
    });
  };

  // 4. Insert Advocate Signature Stamp Handler
  const handleSelectSignature = (imageUri: string) => {
    postMessageToWebView({
      type: "exec",
      command: "insertSignature",
      value: imageUri,
    });
  };

  // 5. Insert Court Table Handler
  const handleInsertTable = (rows: number = 3, cols: number = 3) => {
    postMessageToWebView({
      type: "exec",
      command: "insertTable",
      rows,
      cols,
    });
  };

  // 6. Delete Selected Table / Signature Element Handler
  const handleDeleteSelectedElement = () => {
    postMessageToWebView({
      type: "exec",
      command: "deleteSelectedElement",
    });
  };

  // Helper to fetch latest HTML from WebView with automatic 200ms fallback
  const getLatestHtml = (): Promise<string> => {
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          saveCallbackRef.current = null;
          resolve(initialHtml || "");
        }
      }, 200);

      saveCallbackRef.current = (html: string) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          saveCallbackRef.current = null;
          resolve(html || initialHtml || "");
        }
      };

      postMessageToWebView({ type: "requestSave" });
    });
  };

  // Trigger Save Process
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const html = await getLatestHtml();
      const idToSave = draftId || uuidv4();
      const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, lineHeight, stampMargin })} -->`;
      const contentWithMetadata = metadataComment + html;

      // Ask advocate where/how they want to save
      Alert.alert("Save Draft", "Choose how you want to save this document:", [
        {
          text: caseId ? "Save to current Case" : "Save as Standalone Draft",
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
      ]);
    } catch (err) {
      console.error("Error saving draft to SQLite database:", err);
      Alert.alert("Error", "Could not write draft to SQLite.");
      setIsSaving(false);
    }
  };

  // Print/Share PDF
  const handlePrintShare = async () => {
    setIsExporting(true);
    try {
      const html = await getLatestHtml();
      const effectiveTopMargin = (topMargin || 24) + (letterheadSpace || 0);
      const pageCssSize = pageSize === "legal" ? "8.5in 14in" : "A4 portrait";
      const cleanBodyHtml = html
        .replace(/<!-- CD_LAYOUT:(.*?) -->/g, "")
        .replace(/<div id="red-margin-line".*?<\/div>/g, "")
        .replace(/<div id="margin-guide-overlay".*?<\/div>/g, "");

      const formattedHtmlForPrint = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
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
            p {
              margin-top: 0;
              margin-bottom: 12pt;
              text-align: justify;
              text-justify: inter-word;
              word-wrap: break-word;
            }
            p.court-header, .court-header {
              text-align: center !important;
              font-weight: bold;
              margin-bottom: 14pt;
            }
            p.title, .title {
              text-align: center !important;
              font-weight: bold;
              font-size: 15pt;
              margin-top: 14pt;
              margin-bottom: 14pt;
            }
            p.case-details, .case-details {
              text-align: center !important;
              margin-bottom: 12pt;
            }
            p.section-title, .section-title {
              font-weight: bold;
              margin-top: 14pt;
              margin-bottom: 6pt;
            }
            hr.page-break {
              display: block;
              page-break-after: always;
              break-after: page;
              height: 0;
              border: 0;
              margin: 0;
              padding: 0;
            }
            .page-margin-guide, #red-margin-line, #margin-guide-overlay {
              display: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12pt;
            }
            th, td {
              border: 1px solid #000;
              padding: 6pt;
              text-align: left;
            }
            .interactive-shape {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          ${cleanBodyHtml}
        </body>
        </html>
      `;
      const isLegal = pageSize === "legal";
      const { uri } = await Print.printToFileAsync({
        html: formattedHtmlForPrint,
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
              const effectiveId = draftId || uuidv4();
              const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, lineHeight, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace, pageSize })} -->`;
              const contentWithMetadata = metadataComment + latestHtml;
              await saveDocumentDraft({
                id: effectiveId,
                case_id: caseId || null,
                title,
                template_type: templateType,
                html_content: contentWithMetadata,
                is_custom_template: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              setHasUnsavedChanges(false);
              // @ts-ignore
              navigation.navigate("DraftsHub", {
                draftId: effectiveId,
                action: "attach",
              });
            } catch (e) {
              console.error("Error saving before linking:", e);
              // @ts-ignore
              navigation.navigate("DraftsHub", {
                draftId,
                action: "attach",
              });
            }
          },
        },
        {
          text: "Go to Document Hub",
          onPress: () => {
            // @ts-ignore
            navigation.navigate("DraftsHub");
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } catch (error) {
      setIsExporting(false);
      console.error("Error generating PDF in editor screen:", error);
      Alert.alert("Error", "Failed to print or share PDF.");
    }
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
            style={[
              styles.headerButton,
              {
                marginRight: 6,
                backgroundColor: isDictating
                  ? "#EF4444"
                  : `${theme.colors.primary}15`,
                borderRadius: 16,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
              },
            ]}
            onPress={toggleVoiceDictation}
          >
            <Ionicons
              name={isDictating ? "mic-off" : "mic"}
              size={18}
              color={isDictating ? "#FFFFFF" : theme.colors.primary}
            />
            {isDictating && (
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "#FFFFFF",
                  marginLeft: 4,
                }}
              >
                Rec
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 6 }]}
            onPress={() => triggerFormat("undo")}
            title="Undo"
          >
            <Ionicons
              name="arrow-undo-outline"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
            onPress={() => triggerFormat("redo")}
            title="Redo"
          >
            <Ionicons
              name="arrow-redo-outline"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
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
            style={[styles.headerButton, { marginLeft: 8 }]}
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

      {/* Live Document HUD Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: 12,
          paddingVertical: 5,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: "center", gap: 8 }}
        >
          {/* Word Count Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: `${theme.colors.primary}12`,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12,
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={13}
              color={theme.colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.colors.primary,
              }}
            >
              {docStats.wordCount} {t ? t("Words") || "Words" : "Words"}
            </Text>
          </View>

          {/* Page Count Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: `${theme.colors.primary}12`,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12,
            }}
          >
            <Ionicons
              name="layers-outline"
              size={13}
              color={theme.colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.colors.primary,
              }}
            >
              ~{docStats.estimatedPages}{" "}
              {docStats.estimatedPages === 1 ? "Page" : "Pages"}
            </Text>
          </View>

          {/* Paper Format Badge */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: `${theme.colors.textSecondary}15`,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12,
            }}
            onPress={() => setIsPageSetupVisible(true)}
          >
            <Ionicons
              name="easel-outline"
              size={13}
              color={theme.colors.text}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.colors.text,
              }}
            >
              {pageSize === "legal" ? "Legal Paper" : "A4 Paper"}
            </Text>
          </TouchableOpacity>

          {/* Inline Live Document Language Switcher (English / Hindi Document Drafting) */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.inputBackground,
              borderRadius: 12,
              padding: 2,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <TouchableOpacity
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor:
                  docDraftLanguage === "en"
                    ? theme.colors.primary
                    : "transparent",
              }}
              onPress={() => {
                setDocDraftLanguage("en");
                postMessageToWebView({ type: "setEditorLanguage", lang: "en" });
              }}
              testID="lang-en-btn"
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color:
                    docDraftLanguage === "en"
                      ? "#ffffff"
                      : theme.colors.textSecondary,
                }}
              >
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor:
                  docDraftLanguage === "hi"
                    ? theme.colors.primary
                    : "transparent",
              }}
              onPress={() => {
                setDocDraftLanguage("hi");
                postMessageToWebView({ type: "setEditorLanguage", lang: "hi" });
              }}
              testID="lang-hi-btn"
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color:
                    docDraftLanguage === "hi"
                      ? "#ffffff"
                      : theme.colors.textSecondary,
                }}
              >
                हिंदी
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tiptap Engine Switcher Button */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#1e3a8a22",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "#3b82f644",
              marginRight: 6,
            }}
            onPress={() => {
              (navigation as any).navigate("TiptapEditDraft", {
                draftId,
                caseId,
                initialHtml: htmlContent,
                templateType,
                title,
              });
            }}
          >
            <Ionicons name="flash-outline" size={12} color="#f59e0b" style={{ marginRight: 3 }} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#3b82f6" }}>
              Try Tiptap Engine 🚀
            </Text>
          </TouchableOpacity>

          {/* Auto-saved Status Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 6,
              paddingVertical: 3,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: hasUnsavedChanges ? "#f59e0b" : "#10b981",
                marginRight: 5,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.textSecondary,
                fontWeight: "500",
              }}
            >
              {hasUnsavedChanges ? "Editing..." : "Saved"}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Editor Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top Ribbon Segmented Control Switcher */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.colors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            paddingHorizontal: 12,
            paddingVertical: 6,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Segmented Control Container */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: theme.colors.inputBackground,
              borderRadius: 20,
              padding: 3,
              gap: 2,
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 5,
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor:
                  toolbarMode === "format"
                    ? theme.colors.primary
                    : "transparent",
              }}
              onPress={() => {
                if (toolbarMode === "format") {
                  setIsRibbonCollapsed((prev) => !prev);
                } else {
                  setToolbarMode("format");
                  setIsRibbonCollapsed(false);
                }
              }}
              testID="tab-formatting-btn"
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color:
                    toolbarMode === "format"
                      ? "#ffffff"
                      : theme.colors.textSecondary,
                }}
              >
                {t ? t("Formatting") || "Formatting" : "Formatting"}
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
                color={
                  toolbarMode === "format"
                    ? "#ffffff"
                    : theme.colors.textSecondary
                }
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 5,
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor:
                  toolbarMode === "legal"
                    ? theme.colors.primary
                    : "transparent",
              }}
              onPress={() => {
                if (toolbarMode === "legal") {
                  setIsRibbonCollapsed((prev) => !prev);
                } else {
                  setToolbarMode("legal");
                  setIsRibbonCollapsed(false);
                }
              }}
              testID="tab-legal-assist-btn"
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color:
                    toolbarMode === "legal"
                      ? "#ffffff"
                      : theme.colors.textSecondary,
                }}
              >
                {t ? t("Legal Assist") || "Legal Assist" : "Legal Assist"}
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
                color={
                  toolbarMode === "legal"
                    ? "#ffffff"
                    : theme.colors.textSecondary
                }
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 11,
              color: theme.colors.textSecondary,
              fontWeight: "600",
            }}
          >
            {pageSize === "legal" ? "Legal Paper" : "A4 Paper"}
          </Text>
        </View>

        {/* Dynamic Native Formatting Ribbon */}
        {!isRibbonCollapsed &&
          (toolbarMode === "format" ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.toolbarScroll}
              contentContainerStyle={styles.toolbarContent}
            >
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

              <View style={styles.divider} />

              {/* Scan-to-Editor OCR Button */}
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={handleScanToEditorOcr}
                title="Scan Document OCR"
                testID="scan-to-editor-btn"
              >
                <Ionicons
                  name="scan-outline"
                  size={18}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>

              {/* Offline SpeechRecognizer Dictation Button */}
              <TouchableOpacity
                style={[
                  styles.toolbarButton,
                  isDictating && {
                    backgroundColor: theme.colors.error || "#ef4444",
                  },
                ]}
                onPress={toggleVoiceDictation}
                title="Voice Dictation"
                testID="voice-dictation-btn"
              >
                <Ionicons
                  name={isDictating ? "mic" : "mic-outline"}
                  size={18}
                  color={isDictating ? "#ffffff" : theme.colors.text}
                />
              </TouchableOpacity>

              {/* Insert Court Table Button */}
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => setTableConfigModalVisible(true)}
                title="Insert Table"
                testID="insert-table-btn"
              >
                <Ionicons
                  name="grid-outline"
                  size={18}
                  color={theme.colors.text}
                />
              </TouchableOpacity>

              {/* Advocate Signature Stamp Button */}
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => setSignatureModalVisible(true)}
                title="Attach Signature Stamp"
                testID="attach-signature-btn"
              >
                <Ionicons
                  name="ribbon-outline"
                  size={18}
                  color={theme.colors.text}
                />
              </TouchableOpacity>

              {/* Insert Interactive Shape & Legal Stamp Button */}
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => setShapeModalVisible(true)}
                title="Insert Geometry Shape / Legal Stamp"
                testID="insert-shape-btn"
              >
                <Ionicons
                  name="shapes-outline"
                  size={18}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => {
                  setTourStepIndex(0);
                  setShowTour(true);
                }}
                title="Help Tour"
              >
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </ScrollView>
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
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
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
                <Text
                  style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}
                >
                  {t ? t("Next") || "Next" : "Next"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ))}

        {/* Full Height Editor Canvas */}
        <WebView
          ref={webViewRef}
          source={{ html: getOfflineEditorHtml(htmlContent) }}
          onMessage={handleMessage}
          style={{ flex: 1 }}
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
          onShouldStartLoadWithRequest={() => false}
        />

        {/* Predictive Legal Phrase Autocomplete Bar */}
        <LegalAutocompleteBar
          suggestions={autocompleteSuggestions}
          theme={theme}
          onSelectSuggestion={(phrase) =>
            triggerFormat("insertText", phrase + " ")
          }
        />
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

            <ScrollView
              style={{ maxHeight: 380 }}
              showsVerticalScrollIndicator
              contentContainerStyle={{ paddingBottom: 16 }}
            >
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
                            {
                              color: isSelected ? "#ffffff" : theme.colors.text,
                            },
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
                            {
                              color: isSelected ? "#ffffff" : theme.colors.text,
                            },
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
                            {
                              color: isSelected ? "#ffffff" : theme.colors.text,
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Unit System Selector (Inches / MM / Pixels) */}
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
                  Measurement Unit System
                </Text>
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
                          { borderColor: theme.colors.border },
                          isSelected && {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.primary,
                          },
                        ]}
                        onPress={() => setUnitMode(item.value as any)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: isSelected ? "#ffffff" : theme.colors.text,
                            },
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.max(0, topMargin - step);
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
                        width: 76,
                        textAlign: "center",
                        fontWeight: "bold",
                        color: theme.colors.text,
                        fontSize: 12,
                      }}
                    >
                      {formatMarginValue(topMargin, unitMode)}
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.min(200, topMargin + step);
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
                        name="add"
                        size={14}
                        color={theme.colors.text}
                      />
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.max(20, leftMargin - step);
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
                        width: 76,
                        textAlign: "center",
                        fontWeight: "bold",
                        color: theme.colors.text,
                        fontSize: 12,
                      }}
                    >
                      {formatMarginValue(leftMargin, unitMode)}
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.min(200, leftMargin + step);
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
                        name="add"
                        size={14}
                        color={theme.colors.text}
                      />
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.max(0, rightMargin - step);
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
                        width: 76,
                        textAlign: "center",
                        fontWeight: "bold",
                        color: theme.colors.text,
                        fontSize: 12,
                      }}
                    >
                      {formatMarginValue(rightMargin, unitMode)}
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.min(200, rightMargin + step);
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
                        name="add"
                        size={14}
                        color={theme.colors.text}
                      />
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.max(0, bottomMargin - step);
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
                        width: 76,
                        textAlign: "center",
                        fontWeight: "bold",
                        color: theme.colors.text,
                        fontSize: 12,
                      }}
                    >
                      {formatMarginValue(bottomMargin, unitMode)}
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.min(200, bottomMargin + step);
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
                        name="add"
                        size={14}
                        color={theme.colors.text}
                      />
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.max(0, letterheadSpace - step * 2);
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
                        width: 76,
                        textAlign: "center",
                        fontWeight: "bold",
                        color: theme.colors.text,
                        fontSize: 12,
                      }}
                    >
                      {formatMarginValue(letterheadSpace, unitMode)}
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
                        const step = getMarginStepPx(unitMode);
                        const v = Math.min(300, letterheadSpace + step * 2);
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
                        name="add"
                        size={14}
                        color={theme.colors.text}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

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

      {/* Insert Geometry Shape / Legal Stamp Modal */}
      <Modal
        visible={shapeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShapeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Insert Geometry Shape / Legal Stamp
              </Text>
              <TouchableOpacity onPress={() => setShapeModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
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
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.inputBackground,
                  }}
                  onPress={() => {
                    setShapeModalVisible(false);
                    postMessageToWebView({
                      type: "exec",
                      command: "insertShape",
                      value: item.value,
                    });
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color: theme.colors.text,
                      marginBottom: 2,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: theme.colors.textSecondary }}
                  >
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

      {/* Walkthrough Tour Modal */}
      <Modal
        visible={showTour}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTour(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 24, maxWidth: 340 }]}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: `${theme.colors.primary}15`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name={tourSteps[tourStepIndex].icon as any}
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: theme.colors.text,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {tourSteps[tourStepIndex].title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {tourSteps[tourStepIndex].description}
              </Text>
            </View>

            {/* Pagination Indicators */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                marginBottom: 24,
              }}
            >
              {tourSteps.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      i === tourStepIndex
                        ? theme.colors.primary
                        : `${theme.colors.textSecondary}30`,
                  }}
                />
              ))}
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
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
                        await AsyncStorage.setItem("@editor_tour_seen", "true");
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
                        await AsyncStorage.setItem("@editor_tour_seen", "true");
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

      {/* Native Placeholder Fill Modal */}
      <PlaceholderBottomSheet
        visible={placeholderModalVisible}
        placeholderLabel={activePlaceholderLabel}
        cleanLabel={activePlaceholderClean}
        theme={theme}
        onApply={handleApplyPlaceholderValue}
        onClose={() => setPlaceholderModalVisible(false)}
      />

      {/* Advocate Digital Signature Stamp Modal */}
      <SignatureCanvasModal
        visible={signatureModalVisible}
        theme={theme}
        onSelectSignature={handleSelectSignature}
        onClose={() => setSignatureModalVisible(false)}
      />

      {/* Table Custom Rows & Columns Configuration Modal */}
      <TableConfigModal
        visible={tableConfigModalVisible}
        theme={theme}
        onInsertTable={handleInsertTable}
        onClose={() => setTableConfigModalVisible(false)}
      />

      {/* Selected Element Context Menu (Delete Table / Signature) */}
      <ElementContextModal
        visible={elementContextModalVisible}
        elementType={selectedElementType}
        theme={theme}
        onDeleteElement={handleDeleteSelectedElement}
        onClose={() => setElementContextModalVisible(false)}
      />

      {/* Interactive OCR Review & Preview Modal */}
      <OcrReviewModal
        visible={ocrModalVisible}
        imageUri={ocrModalImageUri}
        extractedText={ocrModalExtractedText}
        onClose={() => setOcrModalVisible(false)}
        onImport={handleImportOcrText}
      />
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
      height:
        (Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0) + 56,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
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
    toolbarScroll: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
      maxHeight: 52,
    },
    toolbarContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    toolbarButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    activeToolbarButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
      borderWidth: 1.5,
      borderColor: "#ffffff",
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
