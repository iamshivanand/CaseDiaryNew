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
  AppState,
  BackHandler,
  Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { v4 as uuidv4 } from "uuid";

import { PlaceholderBottomSheet } from "./components/PlaceholderBottomSheet";
import { SignatureCanvasModal } from "./components/SignatureCanvasModal";
import { LegalAutocompleteBar } from "./components/LegalAutocompleteBar";
import { TableConfigModal } from "./components/TableConfigModal";
import { ElementContextModal } from "./components/ElementContextModal";
import OcrReviewModal from "./components/OcrReviewModal";
import {
  saveDocumentDraft,
  getDocumentDraftById,
  getCaseById,
  getCases,
  uploadCaseDocument,
  getUniqueDraftTitle,
  CaseWithDetails,
} from "../../DataBase";
import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { LEGAL_VOCABULARY } from "../../utils/legalVocabulary";
import { extractTextFromImages } from "../../utils/ocrService";
import { getRealTiptapEditorHtml } from "../../utils/realTiptapEditorTemplate";
import { compileLegalDocumentHtml } from "../../utils/documentTemplates";
import { speechRecognitionService } from "../../utils/speechRecognitionService";
import { createNamedPdfFile, shareNamedPdf } from "../../utils/fileShareHelper";
import ActionButton from "../CommonComponents/ActionButton";
import { useAdTrigger } from "../CommonComponents/AdManager";

type TiptapEditDraftScreenRouteProp = RouteProp<HomeStackParamList, "TiptapEditDraft">;

interface EditorState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize?: string;
  hasSelection?: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  alignJustify: boolean;
  orderedList: boolean;
  unorderedList: boolean;
  h1?: boolean;
  h2?: boolean;
  h3?: boolean;
  paragraph?: boolean;
}

const TiptapEditDraftScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TiptapEditDraftScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const { t, locale } = useTranslation();
  const { showAdWithPreload } = useAdTrigger();
  const styles = getStyles(theme);

  const {
    draftId: initialDraftId,
    caseId,
    initialHtml = "",
    templateType = "draft",
    title: initialTitle,
    language: initialLanguage,
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
    h1: false,
    h2: false,
    h3: false,
    paragraph: true,
  });

  const [docStats, setDocStats] = useState({
    wordCount: 0,
    charCount: 0,
    estimatedPages: 1,
  });

  // Page setup & Layout State
  const [font, setFont] = useState("Times New Roman");
  const [fontSize, setFontSize] = useState("14");
  const [lineHeight, setLineHeight] = useState("1.6");
  const [topMargin, setTopMargin] = useState(16);
  const [bottomMargin, setBottomMargin] = useState(16);
  const [leftMargin, setLeftMargin] = useState(36);
  const [rightMargin, setRightMargin] = useState(16);
  const [letterheadSpace, setLetterheadSpace] = useState(0);
  const [unitMode, setUnitMode] = useState<"in" | "mm" | "px">("in");
  const [isPageSetupVisible, setIsPageSetupVisible] = useState(false);
  const [pageSize, setPageSize] = useState<"a4" | "legal">("legal");
  const [docDraftLanguage, setDocDraftLanguage] = useState<"en" | "hi">(
    (initialLanguage as "en" | "hi") || (locale === "hi" ? "hi" : "en")
  );

  // Ribbon state (Kept in intuitive top position with clear text labels)
  const [toolbarMode, setToolbarMode] = useState<"format" | "legal">("format");
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);

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

  // Case Picker Attachment State
  const [isCasePickerVisible, setIsCasePickerVisible] = useState(false);
  const [casePickerMode, setCasePickerMode] = useState<"save_draft" | "attach_pdf">("save_draft");
  const [casesList, setCasesList] = useState<CaseWithDetails[]>([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState("");
  const [generatedPdfUri, setGeneratedPdfUri] = useState<string | null>(null);
  const [isAttachingCase, setIsAttachingCase] = useState(false);

  // Filtered cases for search picker
  const filteredCases = useMemo(() => {
    if (!caseSearchQuery.trim()) return casesList;
    const q = caseSearchQuery.toLowerCase();
    return casesList.filter((c) => {
      const matchTitle = c.CaseTitle?.toLowerCase().includes(q);
      const matchNo = c.case_number?.toLowerCase().includes(q);
      const matchCourt = c.CourtName?.toLowerCase().includes(q);
      const matchOpp = c.OppositeParty?.toLowerCase().includes(q);
      return matchTitle || matchNo || matchCourt || matchOpp;
    });
  }, [casesList, caseSearchQuery]);

  // OCR state
  const [ocrModalVisible, setOcrModalVisible] = useState(false);
  const [ocrModalImageUri, setOcrModalImageUri] = useState<string | null>(null);
  const [ocrModalExtractedText, setOcrModalExtractedText] = useState("");

  // Vocabulary & Macros state
  const [isVocabularyVisible, setIsVocabularyVisible] = useState(false);
  const [vocabSearchQuery, setVocabSearchQuery] = useState("");
  const [isMacrosModalVisible, setIsMacrosModalVisible] = useState(false);

  // Find & Replace state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [searchMatchCount, setSearchMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

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
  const hasInitialLoadedRef = useRef(false);
  const isNewUnsavedDraftRef = useRef(!initialDraftId);

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
    const fetchExistingDraftIfNeeded = async () => {
      if (initialDraftId) {
        try {
          const existing = await getDocumentDraftById(initialDraftId);
          if (existing) {
            if (existing.title && !initialTitle) {
              setTitle(existing.title);
            }
            if (existing.template_type && !templateType) {
              setDocTemplateType(existing.template_type);
            }
            if (existing.html_content && (!initialHtml || initialHtml === "")) {
              setHtmlContent(existing.html_content);
              postMessageToWebView({
                type: "setContent",
                html: existing.html_content,
              });
            }
          }
        } catch (e) {
          console.warn("Could not pre-fetch draft:", e);
        }
      }
    };
    fetchExistingDraftIfNeeded();
  }, [initialDraftId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenSaveDialog = useCallback(() => {
    setSaveDialogTitle(title || `Draft ${new Date().toLocaleDateString("en-IN")}`);
    setIsSaveDialogVisible(true);
  }, [title]);

  const handleBackPress = useCallback(() => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes in this document. What would you like to do before leaving?",
        [
          {
            text: "Save & Exit",
            onPress: () => {
              handleOpenSaveDialog();
            },
          },
          {
            text: "Discard Changes",
            style: "destructive",
            onPress: () => {
              setHasUnsavedChanges(false);
              navigation.goBack();
            },
          },
          {
            text: "Keep Editing",
            style: "cancel",
          },
        ]
      );
      return true;
    }
    navigation.goBack();
    return true;
  }, [hasUnsavedChanges, navigation, handleOpenSaveDialog]);

  // Backgrounding & Navigation Auto-Save Listeners
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        if (!isNewUnsavedDraftRef.current) {
          performSilentAutoSave();
        }
      }
    });

    const backAction = () => {
      if (isSaveDialogVisible) {
        setIsSaveDialogVisible(false);
        return true;
      }
      if (isCasePickerVisible) {
        setIsCasePickerVisible(false);
        return true;
      }
      if (isPageSetupVisible) {
        setIsPageSetupVisible(false);
        return true;
      }
      return handleBackPress();
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => {
      subscription.remove();
      backHandler.remove();
    };
  }, [hasUnsavedChanges, handleBackPress, isSaveDialogVisible, isCasePickerVisible, isPageSetupVisible]);

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
                  if (layout.fontSize) setFontSize(String(layout.fontSize));
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
    else if (command === "toggleHeading") {
      const lvl = Number(value);
      setEditorState((prev) => ({
        ...prev,
        h1: lvl === 1 ? !prev.h1 : false,
        h2: lvl === 2 ? !prev.h2 : false,
        h3: lvl === 3 ? !prev.h3 : false,
        paragraph: false,
      }));
    } else if (command === "setParagraph") {
      setEditorState((prev) => ({
        ...prev,
        h1: false,
        h2: false,
        h3: false,
        paragraph: true,
      }));
    }

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
    lhSpace: number = letterheadSpace,
    newFontSize: string = fontSize
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
      fontSize: newFontSize,
    });
    markAsEditingAndScheduleAutoSave();
  };

  const AVAILABLE_FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24];

  const handleIncreaseFontSize = () => {
    const current = parseInt(fontSize, 10) || 14;
    const next = AVAILABLE_FONT_SIZES.find((s) => s > current) || Math.min(32, current + 2);
    const strNext = String(next);
    setFontSize(strNext);
    triggerFormat("setFontSize", strNext);
  };

  const handleDecreaseFontSize = () => {
    const current = parseInt(fontSize, 10) || 14;
    const reversed = [...AVAILABLE_FONT_SIZES].reverse();
    const prev = reversed.find((s) => s < current) || Math.max(8, current - 2);
    const strPrev = String(prev);
    setFontSize(strPrev);
    triggerFormat("setFontSize", strPrev);
  };

  const handleCycleFontSize = () => {
    const current = parseInt(fontSize, 10) || 14;
    const commonSizes = [12, 13, 14, 16, 18];
    const nextIdx = (commonSizes.indexOf(current) + 1) % commonSizes.length;
    const nextSize = String(commonSizes[nextIdx] || 14);
    setFontSize(nextSize);
    triggerFormat("setFontSize", nextSize);
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
      const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, fontSize, lineHeight, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace, pageSize })} -->`;
      const contentWithMetadata = metadataComment + html;

      if (!isNewUnsavedDraftRef.current) {
        await saveDocumentDraft({
          id: activeDraftId,
          case_id: caseId ? Number(caseId) : null,
          title: title || `Draft ${new Date().toLocaleDateString("en-IN")}`,
          template_type: docTemplateType || templateType || "draft",
          html_content: contentWithMetadata,
          is_custom_template: 0,
          updated_at: new Date().toISOString(),
        });
      }

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

  const handleFindText = (text: string) => {
    setSearchQuery(text);
    postMessageToWebView({
      type: "findText",
      query: text,
      matchCase: false,
    });
  };

  const handleFindNext = () => {
    postMessageToWebView({ type: "findNext" });
  };

  const handleFindPrev = () => {
    postMessageToWebView({ type: "findPrev" });
  };

  const handleReplaceCurrent = () => {
    postMessageToWebView({
      type: "replaceCurrent",
      query: searchQuery,
      replacement: replaceQuery,
    });
    markAsEditingAndScheduleAutoSave();
  };

  const handleReplaceAll = () => {
    postMessageToWebView({
      type: "replaceAll",
      query: searchQuery,
      replacement: replaceQuery,
    });
    markAsEditingAndScheduleAutoSave();
  };

  const handleCloseSearch = () => {
    setIsSearchVisible(false);
    setSearchQuery("");
    setReplaceQuery("");
    setSearchMatchCount(0);
    setCurrentMatchIndex(0);
    postMessageToWebView({ type: "clearSearch" });
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "state") {
        if (data.state) {
          setEditorState(data.state);
          if (data.state.fontSize) {
            setFontSize(String(data.state.fontSize));
          }
        }
        if (data.stats) {
          setDocStats(data.stats);
        }
        if (data.html) {
          setHtmlContent(data.html);
        }
        setIsLoading(false);
        if (!hasInitialLoadedRef.current) {
          hasInitialLoadedRef.current = true;
        } else {
          markAsEditingAndScheduleAutoSave();
        }
      } else if (data.type === "searchResult") {
        setSearchMatchCount(data.total || 0);
        setCurrentMatchIndex(data.current || 0);
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

  const openCasePicker = async (mode: "save_draft" | "attach_pdf", pdfUri?: string) => {
    try {
      setCasePickerMode(mode);
      if (pdfUri) setGeneratedPdfUri(pdfUri);
      const cases = await getCases();
      setCasesList(cases || []);
      setCaseSearchQuery("");
      setIsCasePickerVisible(true);
    } catch (e) {
      console.warn("Failed to load cases for picker:", e);
      Alert.alert("Error", "Could not load cases list.");
    }
  };

  const handleSelectCaseForAttachment = async (selectedCase: CaseWithDetails) => {
    setIsAttachingCase(true);
    try {
      const rawTitle = saveDialogTitle.trim() || title || "Legal Document";
      if (casePickerMode === "save_draft") {
        const finalTitle = await getUniqueDraftTitle(rawTitle, activeDraftId, 0);
        setTitle(finalTitle);
        const html = await getLatestHtml();
        const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, fontSize, lineHeight, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace, pageSize })} -->`;
        const contentWithMetadata = metadataComment + html;
        await saveDocumentDraft({
          id: activeDraftId,
          case_id: Number(selectedCase.id),
          title: finalTitle,
          template_type: docTemplateType || templateType || "draft",
          html_content: contentWithMetadata,
          is_custom_template: 0,
          updated_at: new Date().toISOString(),
        });
        isNewUnsavedDraftRef.current = false;
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        setIsCasePickerVisible(false);
        const titleMsg = finalTitle !== rawTitle ? ` (Saved as "${finalTitle}" to resolve name conflict)` : "";
        Alert.alert(
          "Draft Attached Successfully",
          `This document has been linked to case "${selectedCase.CaseTitle || "Case"}".${titleMsg}`,
          [{ text: "OK" }]
        );
      } else if (casePickerMode === "attach_pdf" && generatedPdfUri) {
        await uploadCaseDocument({
          caseId: Number(selectedCase.id),
          originalFileName: `${rawTitle}.pdf`,
          fileType: "application/pdf",
          fileUri: generatedPdfUri,
        });
        setIsCasePickerVisible(false);
        Alert.alert(
          "PDF Attached to Case Documents",
          `"${rawTitle}.pdf" has been saved directly into documents for "${selectedCase.CaseTitle || "Case"}".`,
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      console.error("Error attaching to case:", err);
      Alert.alert("Error", "Failed to attach document to case.");
    } finally {
      setIsAttachingCase(false);
    }
  };

  // 3. User Explicit Save with Title Confirmation & Destination Options
  const handleConfirmSave = async (destination: "case" | "standalone" | "template") => {
    setIsSaving(true);
    setIsSaveDialogVisible(false);
    try {
      const rawTitle = saveDialogTitle.trim() || title || "Draft Document";
      const isCustom = destination === "template" ? 1 : 0;
      const targetDraftId = destination === "template" ? uuidv4() : activeDraftId;
      
      const finalTitle = await getUniqueDraftTitle(
        rawTitle,
        destination === "template" ? null : activeDraftId,
        isCustom
      );

      setTitle(finalTitle);
      const html = await getLatestHtml();
      const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, fontSize, lineHeight, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace, pageSize })} -->`;
      const contentWithMetadata = metadataComment + html;

      const effTemplateType = docTemplateType || templateType || "draft";
      if (destination === "case") {
        await saveDocumentDraft({
          id: activeDraftId,
          case_id: caseId ? Number(caseId) : null,
          title: finalTitle,
          template_type: effTemplateType,
          html_content: contentWithMetadata,
          is_custom_template: 0,
          updated_at: new Date().toISOString(),
        });
        isNewUnsavedDraftRef.current = false;
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        const titleMsg = finalTitle !== rawTitle ? ` (Saved as "${finalTitle}" to avoid name conflict)` : "";
        Alert.alert("Success", `Draft saved to current case successfully!${titleMsg}`, [
          { text: "OK" },
        ]);
      } else if (destination === "standalone") {
        await saveDocumentDraft({
          id: activeDraftId,
          case_id: null,
          title: finalTitle,
          template_type: effTemplateType,
          html_content: contentWithMetadata,
          is_custom_template: 0,
          updated_at: new Date().toISOString(),
        });
        isNewUnsavedDraftRef.current = false;
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        const titleMsg = finalTitle !== rawTitle ? ` (Saved as "${finalTitle}" to avoid name conflict)` : "";
        Alert.alert("Success", `Standalone draft saved successfully!${titleMsg}`, [
          { text: "OK" },
        ]);
      } else if (destination === "template") {
        await saveDocumentDraft({
          id: targetDraftId,
          case_id: null,
          title: finalTitle,
          template_type: effTemplateType,
          html_content: contentWithMetadata,
          is_custom_template: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        const titleMsg = finalTitle !== rawTitle ? ` (Saved as "${finalTitle}")` : "";
        Alert.alert("Success", `Saved as a reusable custom template in Drafts Hub!${titleMsg}`, [
          { text: "OK" },
        ]);
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      Alert.alert("Error", "Failed to save document draft.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Print & Export PDF Execution with Legal CSS Pagination & Styling
  const executePdfExport = async () => {
    setIsExporting(true);
    try {
      const html = await getLatestHtml();
      const effectiveTopMargin = (topMargin || 24) + (letterheadSpace || 0);
      const pageCssSize = pageSize === "legal" ? "8.5in 14in" : "A4 portrait";
      const cleanBodyHtml = html
        .replace(/<!-- CD_LAYOUT:(.*?) -->/g, "")
        .replace(/<div id="red-margin-line".*?<\/div>/g, "")
        .replace(/<div id="margin-guide-overlay".*?<\/div>/g, "")
        .replace(/<div class="page-sheet-divider".*?<\/div>/g, "")
        .replace(/<div class="court-running-header".*?<\/div>/g, "")
        .replace(/<div class="court-running-footer".*?<\/div>/g, "");

      const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: ${pageCssSize};
              margin-top: ${effectiveTopMargin}px;
              margin-bottom: ${bottomMargin || 24}px;
              margin-left: ${leftMargin || 55}px;
              margin-right: ${rightMargin || 24}px;
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #111827;
              font-family: '${font}', 'Times New Roman', serif;
              font-size: ${fontSize || 14}pt;
              line-height: ${lineHeight || 1.6};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              box-sizing: border-box;
            }
            p {
              margin: 0 0 12pt 0;
              text-align: justify;
              text-justify: inter-word;
              word-wrap: break-word;
              font-size: ${fontSize || 14}pt;
              line-height: ${lineHeight || 1.6};
            }
            p.court-header, .court-header, h1.court-header {
              text-align: center !important;
              font-weight: bold;
              font-size: ${Math.round((parseInt(fontSize, 10) || 14) * 1.25)}pt;
              margin-bottom: 14pt;
            }
            p.title, .title, h1, h2 {
              text-align: center !important;
              font-weight: bold;
              font-size: ${Math.round((parseInt(fontSize, 10) || 14) * 1.15)}pt;
              margin: 14pt 0 10pt 0;
            }
            h3, h4 {
              font-weight: bold;
              font-size: ${fontSize || 14}pt;
              margin: 12pt 0 8pt 0;
            }
            blockquote {
              border-left: 4px solid #cbd5e1;
              padding-left: 14pt;
              margin: 12pt 0;
              color: #475569;
              font-style: italic;
            }
            ul, ol {
              margin: 0 0 12pt 24pt;
              padding: 0;
            }
            li {
              margin-bottom: 6pt;
            }
            table, .editor-table {
              width: 100%;
              border-collapse: collapse;
              margin: 14pt 0;
              table-layout: fixed;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            table td, table th, .editor-table td, .editor-table th {
              border: 1px solid #94a3b8;
              padding: 8pt;
              font-size: ${fontSize || 14}pt;
              text-align: left;
              vertical-align: top;
              box-sizing: border-box;
            }
            table th, .editor-table th {
              background-color: #f1f5f9;
              font-weight: bold;
            }
            .signature-stamp {
              max-height: 90px;
              max-width: 220px;
              margin: 12pt 0;
              display: block;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .interactive-shape {
              display: inline-block;
              min-width: 120px;
              min-height: 44px;
              padding: 8pt 12pt;
              margin: 10pt 0;
              box-sizing: border-box;
              position: relative;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .shape-rect {
              border: 2px solid #374151;
              background: #f9fafb;
              border-radius: 4px;
            }
            .shape-circle {
              border: 2px dashed #1e3a8a;
              background: #eff6ff;
              border-radius: 50%;
              text-align: center;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 100px;
              min-height: 100px;
            }
            .shape-arrow {
              border: 1.5px solid #2563eb;
              background: #dbeafe;
              color: #1e40af;
              border-radius: 20px;
              font-weight: 600;
              text-align: center;
            }
            .shape-stamp {
              border: 2px double #991b1b;
              background: #fef2f2;
              color: #991b1b;
              font-weight: 700;
              text-align: center;
              border-radius: 4px;
            }
            .shape-seal {
              border: 3px double #1e3a8a;
              background: #eff6ff;
              border-radius: 8px;
              font-weight: 700;
            }
            .legal-placeholder {
              background-color: rgba(254, 240, 138, 0.75);
              border-bottom: 1.5px dashed #ca8a04;
              padding: 0 3px;
              border-radius: 2px;
              font-weight: 500;
              color: #1c1917;
            }
            .legal-page-break, .page-break, hr.page-break {
              page-break-before: always !important;
              break-before: page !important;
              height: 0 !important;
              margin: 0 !important;
              border: none !important;
              display: block !important;
            }
            .page-margin-guide, #red-margin-line, #margin-guide-overlay, .page-sheet-divider, .court-running-header, .court-running-footer {
              display: none !important;
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
          text: "Attach to Case Documents",
          onPress: async () => {
            if (caseId) {
              Alert.alert(
                "Attach PDF to Case",
                "Do you want to attach this PDF to the current case or choose another case?",
                [
                  {
                    text: "Current Case",
                    onPress: async () => {
                      try {
                        setIsLoading(true);
                        await uploadCaseDocument({
                          caseId: Number(caseId),
                          originalFileName: `${docTitle}.pdf`,
                          fileType: "application/pdf",
                          fileUri: namedUri,
                        });
                        Alert.alert("Attached", `"${docTitle}.pdf" has been saved into case documents.`);
                      } catch (err) {
                        console.error("Error attaching PDF:", err);
                        Alert.alert("Error", "Failed to attach PDF to case.");
                      } finally {
                        setIsLoading(false);
                      }
                    },
                  },
                  {
                    text: "Choose Another Case",
                    onPress: () => openCasePicker("attach_pdf", namedUri),
                  },
                  { text: "Cancel", style: "cancel" },
                ]
              );
            } else {
              openCasePicker("attach_pdf", namedUri);
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

  // Rewarded Ad trigger on Exporting PDF
  const handleExportPdf = async () => {
    if (showAdWithPreload) {
      showAdWithPreload("rewarded", () => {
        executePdfExport();
      });
    } else {
      executePdfExport();
    }
  };

  const handleToggleTemplateLanguage = useCallback(async () => {
    const nextLang = docDraftLanguage === "en" ? "hi" : "en";
    const langLabel = nextLang === "hi" ? "Hindi (हिन्दी)" : "English";

    const performLanguageReload = async () => {
      try {
        setIsLoading(true);
        const advocateName = (await AsyncStorage.getItem("@advocate_name")) || "";
        const advocateEnrollment = (await AsyncStorage.getItem("@advocate_enrollment")) || "";
        const advocateAddress = (await AsyncStorage.getItem("@advocate_address")) || "";

        const recompiledHtml = compileLegalDocumentHtml(
          docTemplateType || "blank_page",
          { advocateName, advocateEnrollment, advocateAddress },
          nextLang === "hi"
        );

        setDocDraftLanguage(nextLang);
        setHtmlContent(recompiledHtml);
        postMessageToWebView({
          type: "setContent",
          html: recompiledHtml,
        });
        postMessageToWebView({ type: "setEditorLanguage", lang: nextLang });
        speechRecognitionService?.setLanguage?.(nextLang === "hi" ? "hi-IN" : "en-IN");
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Error reloading template language:", err);
        Alert.alert("Error", "Failed to switch template language.");
      } finally {
        setIsLoading(false);
      }
    };

    if (hasUnsavedChanges) {
      Alert.alert(
        "Switch Document Language",
        `Switching the document language to ${langLabel} will reload standard legal clauses in ${langLabel}. Any unsaved manual edits will be replaced.\n\nWould you like to save your current draft first or switch now?`,
        [
          {
            text: "Save Draft First",
            onPress: () => handleOpenSaveDialog(),
          },
          {
            text: `Switch to ${langLabel}`,
            style: "destructive",
            onPress: performLanguageReload,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      await performLanguageReload();
    }
  }, [docDraftLanguage, docTemplateType, hasUnsavedChanges, handleOpenSaveDialog]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* 2-Tier Header: Tier 1 - Primary Actions & Title */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
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
            numberOfLines={1}
          />
        </View>

        {/* English / Hindi Toggle Button */}
        <TouchableOpacity
          style={[
            styles.headerLangToggleBtn,
            docDraftLanguage === "hi" && styles.headerLangToggleBtnHi,
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={handleToggleTemplateLanguage}
        >
          <Ionicons
            name="language"
            size={13}
            color={docDraftLanguage === "hi" ? "#fbbf24" : "#93c5fd"}
            style={{ marginRight: 3 }}
          />
          <Text
            style={[
              styles.headerLangToggleText,
              docDraftLanguage === "hi" && styles.headerLangToggleTextHi,
            ]}
          >
            {docDraftLanguage === "hi" ? "हिन्दी" : "EN"}
          </Text>
        </TouchableOpacity>

        {/* Undo Button */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => triggerFormat("undo")}
        >
          <Ionicons name="arrow-undo-outline" size={17} color="#cbd5e1" />
        </TouchableOpacity>

        {/* Redo Button */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => triggerFormat("redo")}
        >
          <Ionicons name="arrow-redo-outline" size={17} color="#cbd5e1" />
        </TouchableOpacity>

        {/* Page Setup Button */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => setIsPageSetupVisible(true)}
        >
          <Ionicons name="settings-outline" size={17} color="#cbd5e1" />
        </TouchableOpacity>

        {/* Save Draft Button (Opens confirmation dialog) */}
        <TouchableOpacity
          style={[styles.headerActionBtn, { backgroundColor: "#2563eb", borderColor: "#3b82f6" }]}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={handleOpenSaveDialog}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="checkmark" size={19} color="#ffffff" />
          )}
        </TouchableOpacity>

        {/* More Options (...) Button */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          onPress={() => setIsMoreMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={16} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      {/* Find & Replace Floating / Collapsible Bar */}
      {isSearchVisible && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color="#60a5fa" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Find text in document..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={handleFindText}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleFindNext}
            />
            {searchMatchCount > 0 && (
              <View style={styles.searchCountBadge}>
                <Text style={styles.searchCountText}>
                  {currentMatchIndex}/{searchMatchCount}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.searchNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleFindPrev}
            >
              <Ionicons name="chevron-up" size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleFindNext}
            >
              <Ionicons name="chevron-down" size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchCloseBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleCloseSearch}
            >
              <Ionicons name="close" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.replaceRow}>
            <Ionicons name="swap-horizontal-outline" size={16} color="#c084fc" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Replace with..."
              placeholderTextColor="#94a3b8"
              value={replaceQuery}
              onChangeText={setReplaceQuery}
            />
            <TouchableOpacity
              style={styles.replaceActionBtn}
              onPress={handleReplaceCurrent}
            >
              <Text style={styles.replaceActionBtnText}>Replace</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.replaceActionBtn, { backgroundColor: "#7c3aed" }]}
              onPress={handleReplaceAll}
            >
              <Text style={styles.replaceActionBtnText}>All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Horizontally Scrollable Segmented Ribbon Header & Status Controller */}
      <View style={styles.ribbonHeader}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ribbonHeaderScrollContent}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* Prominent, Intuitive Page Setup Button in Sub-Header Strip */}
          <TouchableOpacity
            style={styles.hudChip}
            onPress={() => setIsPageSetupVisible(true)}
          >
            <Ionicons name="document-text-outline" size={13} color="#60a5fa" />
            <Text style={[styles.hudChipText, { color: "#93c5fd", fontWeight: "bold" }]}>
              Page Setup ({pageSize === "legal" ? "Legal" : "A4"})
            </Text>
          </TouchableOpacity>

          {/* Live Auto-Save Status Pill (Tappable for immediate manual save) */}
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
        </ScrollView>
      </View>

      {/* Ribbon Toolbars with Clear Text Labels */}
      {!isRibbonCollapsed &&
        (toolbarMode === "format" ? (
          <View style={styles.ribbonContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.ribbonContent}
            >
              {/* Font Size Quick Stepper */}
              <View style={styles.fontSizeRibbonGroup}>
                <TouchableOpacity
                  style={styles.fontSizeStepperBtn}
                  onPress={handleDecreaseFontSize}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Ionicons name="remove" size={13} color="#334155" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fontSizeDisplayPill}
                  onPress={handleCycleFontSize}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fontSizeDisplayText}>{fontSize} pt</Text>
                  <Text style={styles.fontSizePillLabel}>Size</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fontSizeStepperBtn}
                  onPress={handleIncreaseFontSize}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Ionicons name="add" size={13} color="#334155" />
                </TouchableOpacity>
              </View>

              {/* Heading Levels & Text Styles for Specific Lines */}
              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.h1 && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("toggleHeading", "1")}
              >
                <Text style={[styles.headingToolIcon, editorState.h1 && styles.headingToolIconActive]}>H1</Text>
                <Text style={[styles.toolLabel, editorState.h1 && styles.toolLabelActive]}>Title</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.h2 && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("toggleHeading", "2")}
              >
                <Text style={[styles.headingToolIcon, editorState.h2 && styles.headingToolIconActive]}>H2</Text>
                <Text style={[styles.toolLabel, editorState.h2 && styles.toolLabelActive]}>Heading</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.h3 && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("toggleHeading", "3")}
              >
                <Text style={[styles.headingToolIcon, editorState.h3 && styles.headingToolIconActive]}>H3</Text>
                <Text style={[styles.toolLabel, editorState.h3 && styles.toolLabelActive]}>Subhead</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.labeledToolItem, editorState.paragraph && !editorState.h1 && !editorState.h2 && !editorState.h3 && styles.labeledToolItemActive]}
                onPress={() => triggerFormat("setParagraph")}
              >
                <Ionicons name="text-outline" size={14} color={editorState.paragraph && !editorState.h1 && !editorState.h2 && !editorState.h3 ? "#2563eb" : "#334155"} />
                <Text style={[styles.toolLabel, editorState.paragraph && !editorState.h1 && !editorState.h2 && !editorState.h3 && styles.toolLabelActive]}>Normal</Text>
              </TouchableOpacity>

              <View style={styles.toolbarDivider} />

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

              {/* Find & Replace Tool */}
              <TouchableOpacity
                style={styles.labeledToolItem}
                onPress={() => setIsSearchVisible((prev) => !prev)}
              >
                <Ionicons name="search-outline" size={15} color="#334155" />
                <Text style={styles.toolLabel}>Find</Text>
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

              <View style={styles.toolbarDivider} />

              {/* Intuitive Page Setup & Margins Tool directly in Formatting Ribbon */}
              <TouchableOpacity
                style={styles.labeledToolItem}
                onPress={() => setIsPageSetupVisible(true)}
              >
                <Ionicons name="settings-outline" size={15} color="#2563eb" />
                <Text style={[styles.toolLabel, { color: "#2563eb", fontWeight: "bold" }]}>
                  Page Setup
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.legalRibbonContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.legalRibbonContent}
            >
              {/* Universal Legal Macro Snippets Modal Launcher */}
              <TouchableOpacity
                style={[styles.labeledLegalItem, { backgroundColor: "#1e3a8a", borderColor: "#3b82f6" }]}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                onPress={() => setIsMacrosModalVisible(true)}
              >
                <Ionicons name="flash" size={15} color="#60a5fa" />
                <Text style={[styles.legalToolLabel, { color: "#ffffff", fontWeight: "bold" }]}>
                  ⚡ Legal Kit
                </Text>
              </TouchableOpacity>

              {/* Quick Legal Symbols */}
              {[
                { sym: "§", label: "Section" },
                { sym: "¶", label: "Para" },
                { sym: "u/s", label: "u/s" },
                { sym: "r/w", label: "r/w" },
                { sym: "vs.", label: "vs" },
                { sym: "P.S.", label: "P.S." },
                { sym: "FIR No.", label: "FIR" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.sym}
                  style={styles.legalSymbolBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  onPress={() => triggerFormat("insertText", item.sym + " ")}
                >
                  <Text style={styles.legalSymbolText}>{item.sym}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.toolbarDivider} />

              {/* Signature Block Drawer */}
              <TouchableOpacity
                style={styles.labeledLegalItem}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                onPress={() => setIsSignatureListVisible(true)}
              >
                <Ionicons name="document-attach-outline" size={14} color="#60a5fa" />
                <Text style={styles.legalToolLabel}>Signature</Text>
              </TouchableOpacity>

              {/* Legal Dictionary / Vocabulary */}
              <TouchableOpacity
                style={styles.labeledLegalItem}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
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
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  onPress={() => triggerFormat("changeCase", c.value)}
                >
                  <Text style={styles.caseConverterText}>{c.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.toolbarDivider} />

              {/* Next Placeholder Navigator */}
              <TouchableOpacity
                style={styles.nextPlaceholderBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
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
          {isLoading ? (
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
                  keyboardShouldPersistTaps="handled"
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

      {/* ⚡ Legal Kit & Boilerplate Clauses Modal */}
      <Modal
        visible={isMacrosModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMacrosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="flash" size={20} color="#60a5fa" />
                <Text style={styles.modalTitle}>⚡ Legal Kit & Boilerplates</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMacrosModalVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 10 }}
            >
              {/* Quick Symbol Chips Bar inside Modal */}
              <Text style={styles.legalSectionHeaderTitle}>QUICK LEGAL SYMBOLS & SHORT FORMS</Text>
              <View style={styles.legalSymbolGrid}>
                {[
                  { sym: "§", name: "Section" },
                  { sym: "¶", name: "Paragraph" },
                  { sym: "u/s", name: "Under Section" },
                  { sym: "r/w", name: "Read With" },
                  { sym: "vs.", name: "Versus" },
                  { sym: "P.S.", name: "Police Station" },
                  { sym: "FIR No.", name: "FIR Number" },
                  { sym: "Cr.P.C.", name: "Cr.P.C." },
                  { sym: "C.P.C.", name: "C.P.C." },
                  { sym: "I.P.C.", name: "I.P.C." },
                  { sym: "Hon'ble Court", name: "Hon'ble Court" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.sym}
                    style={styles.legalKitChip}
                    onPress={() => {
                      triggerFormat("insertText", item.sym + " ");
                      setIsMacrosModalVisible(false);
                    }}
                  >
                    <Text style={styles.legalKitChipSym}>{item.sym}</Text>
                    <Text style={styles.legalKitChipName}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Standard Legal Clauses */}
              <Text style={[styles.legalSectionHeaderTitle, { marginTop: 14 }]}>
                READY BOILERPLATE CLAUSES & CAPTIONS
              </Text>
              {[
                {
                  title: "🏛️ Court / Tribunal Caption Header",
                  desc: "Standard formal court heading with Case No. and Plaintiff vs. Defendant table",
                  cmd: "insertUniversalCaption",
                },
                {
                  title: "📋 Memo of Parties Table",
                  desc: "Complete Petitioner vs. Respondent parties table with parentage & addresses",
                  cmd: "insertMemoOfParties",
                },
                {
                  title: "🏷️ Court Fee Stamp / E-Challan Box",
                  desc: "Standard court fee deficit / e-challan stamp box with ₹ placeholder",
                  cmd: "insertCourtFeeBox",
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
                  title: "📑 Index of Documents (Court Filing Table)",
                  desc: "Standard legal filing index table with S.No., Document, Exhibit, Page Nos.",
                  cmd: "insertFilingIndexTable",
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
              {caseId ? (
                <>
                  <TouchableOpacity
                    style={styles.saveDestOptionBtn}
                    onPress={() => handleConfirmSave("case")}
                  >
                    <Ionicons name="briefcase-outline" size={18} color="#60a5fa" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.saveDestOptionTitle}>Save to Current Case</Text>
                      <Text style={styles.saveDestOptionDesc}>
                        Linked directly with this case timeline and filings
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveDestOptionBtn}
                    onPress={() => {
                      setIsSaveDialogVisible(false);
                      openCasePicker("save_draft");
                    }}
                  >
                    <Ionicons name="folder-outline" size={18} color="#38bdf8" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.saveDestOptionTitle, { color: "#38bdf8" }]}>
                        Attach to Another Case...
                      </Text>
                      <Text style={styles.saveDestOptionDesc}>
                        Choose a different case from your Case Diary
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.saveDestOptionBtn}
                  onPress={() => {
                    setIsSaveDialogVisible(false);
                    openCasePicker("save_draft");
                  }}
                >
                  <Ionicons name="briefcase-outline" size={18} color="#60a5fa" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.saveDestOptionTitle}>Attach / Link to a Case...</Text>
                    <Text style={styles.saveDestOptionDesc}>
                      Select any case in your Case Diary to link this document
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

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

      {/* Case Picker Modal (Instant Attachment to any Case) */}
      <Modal
        visible={isCasePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCasePickerVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { height: Dimensions.get("window").height * 0.75 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>
                  {casePickerMode === "attach_pdf" ? "Attach PDF to Case" : "Link Draft to Case"}
                </Text>
                <Text style={styles.casePickerSubtitle}>
                  {casePickerMode === "attach_pdf"
                    ? "Select a case to save this PDF into its Case Documents"
                    : "Select a case to link and store this document draft"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCasePickerVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.casePickerSearchRow}>
              <Ionicons name="search-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.casePickerSearchInput}
                placeholder="Search by case title, number, party..."
                placeholderTextColor="#64748b"
                value={caseSearchQuery}
                onChangeText={setCaseSearchQuery}
              />
              {caseSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCaseSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {isAttachingCase ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 13 }}>
                  Attaching document to case...
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ flex: 1, marginTop: 4 }}
                contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {filteredCases.length === 0 ? (
                  <View style={{ paddingVertical: 30, alignItems: "center" }}>
                    <Ionicons name="briefcase-outline" size={36} color="#475569" />
                    <Text style={{ color: "#94a3b8", marginTop: 8, fontSize: 13 }}>
                      No matching cases found
                    </Text>
                  </View>
                ) : (
                  filteredCases.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.casePickerCard}
                      onPress={() => handleSelectCaseForAttachment(item)}
                    >
                      <View style={styles.casePickerIconBox}>
                        <Ionicons name="briefcase" size={18} color="#60a5fa" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.casePickerTitle} numberOfLines={1}>
                          {item.CaseTitle || "Untitled Case"}
                        </Text>
                        <Text style={styles.casePickerSubtitle2} numberOfLines={1}>
                          {item.case_number ? `No: ${item.case_number}` : ""} {item.CourtName ? `• ${item.CourtName}` : ""}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#64748b" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
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

              {/* Reset to Default Template (Intentionally re-populate from case) */}
              {docTemplateType && docTemplateType !== "draft" && docTemplateType !== "blank_page" && (
                <TouchableOpacity
                  style={styles.moreMenuRow}
                  onPress={() => {
                    setIsMoreMenuVisible(false);
                    Alert.alert(
                      "Reset & Re-populate Template?",
                      "Are you sure? This will discard your current edits in this session and re-populate the standard template using the latest case data.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Reset Template",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              setIsLoading(true);
                              let caseData: any = {};
                              if (caseId) {
                                caseData = (await getCaseById(caseId)) || {};
                              }
                              const advocateName = (await AsyncStorage.getItem("@advocate_name")) || "";
                              const advocateEnrollment = (await AsyncStorage.getItem("@advocate_enrollment")) || "";
                              const advocateAddress = (await AsyncStorage.getItem("@advocate_address")) || "";
                              const combinedData = { ...caseData, advocateName, advocateEnrollment, advocateAddress };
                              const freshHtml = compileLegalDocumentHtml(docTemplateType, combinedData, docDraftLanguage === "hi");
                              setHtmlContent(freshHtml);
                              postMessageToWebView({ type: "load", html: freshHtml });
                            } catch (e) {
                              console.error("Failed to reset template:", e);
                            } finally {
                              setIsLoading(false);
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="refresh-circle-outline" size={20} color="#f59e0b" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.moreMenuRowTitle, { color: "#f59e0b" }]}>Re-populate Default Template</Text>
                    <Text style={styles.moreMenuRowDesc}>
                      Re-generate template fields from case details (replaces current edits)
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
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
          <View style={[styles.modalContent, { height: Dimensions.get("window").height * 0.75 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Page Setup & Layout</Text>
              <TouchableOpacity onPress={() => setIsPageSetupVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 36, flexGrow: 1 }}
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
                        applyLayoutSettings(item.value, lineHeight, pageSize, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace, fontSize);
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

              {/* Font Size Selection */}
              <Text style={[styles.modalLabel, { marginTop: 12 }]}>Base Font Size</Text>
              <View style={styles.optionGroup}>
                {["11", "12", "13", "14", "16", "18"].map((sz) => {
                  const isSelected = fontSize === sz;
                  return (
                    <TouchableOpacity
                      key={sz}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonActive,
                      ]}
                      onPress={() => {
                        setFontSize(sz);
                        applyLayoutSettings(font, lineHeight, pageSize, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace, sz);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextActive,
                        ]}
                      >
                        {sz} pt
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
          <View style={[styles.modalContent, { height: Dimensions.get("window").height * 0.75 }]}>
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
          <View style={[styles.modalContent, { height: Dimensions.get("window").height * 0.75 }]}>
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
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
              showsVerticalScrollIndicator={true}
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
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#0f172a",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#334155",
      zIndex: 20,
      elevation: 6,
    },
    headerBackBtn: {
      padding: 6,
      marginRight: 6,
    },
    headerTitleColumn: {
      flex: 1,
      justifyContent: "center",
    },
    headerTitleInput: {
      fontSize: 15,
      fontWeight: "bold",
      color: "#ffffff",
      paddingVertical: 2,
    },
    headerStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#0f172a",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#334155",
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 5,
    },
    headerStatusText: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: "500",
    },
    headerActionBtn: {
      width: 32,
      height: 32,
      backgroundColor: "#1e293b",
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#334155",
      marginLeft: 4,
    },
    headerLangToggleBtn: {
      flexDirection: "row",
      alignItems: "center",
      height: 30,
      paddingHorizontal: 6,
      backgroundColor: "#1e293b",
      borderRadius: 7,
      borderWidth: 1,
      borderColor: "#3b82f666",
      marginLeft: 4,
    },
    headerLangToggleBtnHi: {
      backgroundColor: "#451a03",
      borderColor: "#f59e0b88",
    },
    headerLangToggleText: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#93c5fd",
    },
    headerLangToggleTextHi: {
      color: "#fbbf24",
    },
    ribbonHeader: {
      backgroundColor: "#1e293b",
      height: 42,
      borderBottomWidth: 1,
      borderBottomColor: "#334155",
      zIndex: 15,
      elevation: 5,
    },
    ribbonHeaderScrollContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      gap: 8,
      minWidth: "100%",
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
      gap: 5,
      backgroundColor: "#0f172a",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#3b82f666",
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
      zIndex: 10,
      elevation: 4,
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
    headingToolIcon: {
      fontSize: 13,
      fontWeight: "800",
      color: "#334155",
    },
    headingToolIconActive: {
      color: "#2563eb",
    },
    fontSizeRibbonGroup: {
      flexDirection: "row",
      alignItems: "center",
      height: 44,
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#cbd5e1",
      borderRadius: 6,
      paddingHorizontal: 4,
      gap: 2,
    },
    fontSizeStepperBtn: {
      width: 26,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
      backgroundColor: "#f1f5f9",
    },
    fontSizeDisplayPill: {
      paddingHorizontal: 8,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
      backgroundColor: "#f8fafc",
      minWidth: 46,
    },
    fontSizeDisplayText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#1e293b",
    },
    fontSizePillLabel: {
      fontSize: 8,
      color: "#64748b",
      fontWeight: "600",
      marginTop: -2,
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
      paddingBottom: Platform.OS === "ios" ? 40 : 28,
      maxHeight: Dimensions.get("window").height * 0.88,
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
    // Find & Replace Bar Styles
    searchBarContainer: {
      backgroundColor: "#0f172a",
      borderBottomWidth: 1,
      borderBottomColor: "#334155",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1e293b",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#334155",
      paddingHorizontal: 10,
      height: 38,
    },
    replaceRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1e293b",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#334155",
      paddingHorizontal: 10,
      height: 38,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: "#ffffff",
      paddingVertical: 4,
    },
    searchCountBadge: {
      backgroundColor: "#334155",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginRight: 6,
    },
    searchCountText: {
      fontSize: 11,
      color: "#93c5fd",
      fontWeight: "bold",
    },
    searchNavBtn: {
      width: 26,
      height: 26,
      backgroundColor: "#334155",
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4,
    },
    searchCloseBtn: {
      width: 26,
      height: 26,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4,
    },
    replaceActionBtn: {
      backgroundColor: "#2563eb",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      marginLeft: 4,
    },
    replaceActionBtnText: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#ffffff",
    },
    // Legal Kit Modal Styles
    legalSectionHeaderTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#60a5fa",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 4,
    },
    legalSymbolGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 8,
    },
    legalKitChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#1e293b",
      borderWidth: 1,
      borderColor: "#334155",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    legalKitChipSym: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#60a5fa",
    },
    legalKitChipName: {
      fontSize: 11,
      color: "#cbd5e1",
      fontWeight: "500",
    },
    // Case Picker Modal Styles
    casePickerSubtitle: {
      fontSize: 11,
      color: "#94a3b8",
      marginTop: 2,
    },
    casePickerSearchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1e293b",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#334155",
      paddingHorizontal: 10,
      height: 40,
      marginVertical: 10,
      gap: 8,
    },
    casePickerSearchInput: {
      flex: 1,
      fontSize: 13,
      color: "#ffffff",
      paddingVertical: 4,
    },
    casePickerCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1e293b",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#334155",
      marginBottom: 8,
      gap: 12,
    },
    casePickerIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#1e3a8a33",
      alignItems: "center",
      justifyContent: "center",
    },
    casePickerTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 2,
    },
    casePickerSubtitle2: {
      fontSize: 11,
      color: "#94a3b8",
    },
  });

export default TiptapEditDraftScreen;
