// Screens/CaseDetailsScreen/GenerateDocumentScreen.tsx
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  SafeAreaView,
  FlatList,
} from "react-native";
import { WebView } from "react-native-webview";
import { v4 as uuidv4 } from "uuid";

import {
  getCaseById,
  CaseWithDetails,
  getDocumentDrafts,
  DocumentDraft,
  saveDocumentDraft,
  getUserProfile,
  getDb,
} from "../../DataBase";
import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { formatDate } from "../../utils/commonFunctions";
import {
  getVakalatnamaHtml,
  getAdjournmentHtml,
  getBailHtml,
  getAffidavitHtml,
  getWrittenStatementHtml,
  getLegalNoticeHtml,
  getCaveatHtml,
  getInjunctionHtml,
  getPlaintHtml,
  getRejoinderHtml,
  getExecutionHtml,
  getAnticipatoryBailHtml,
  getPrivateComplaintHtml,
  getFirQuashingHtml,
  getExemptionHtml,
  getChequeBounceHtml,
  getArbitrationSec9Html,
  getConsumerComplaintHtml,
  getRentAgreementHtml,
  getPowerOfAttorneyHtml,
} from "../../utils/documentTemplates";
import { LEGAL_VOCABULARY } from "../../utils/legalVocabulary";
import { getOfflineEditorHtml } from "../../utils/offlineEditorTemplate";
import ActionButton from "../CommonComponents/ActionButton";
import { useAdTrigger } from "../CommonComponents/AdManager";
import FormInput from "../CommonComponents/FormInput";
import SectionHeader from "../CommonComponents/SectionHeader";

type GenerateDocumentScreenRouteProp = RouteProp<
  HomeStackParamList,
  "GenerateDocument"
>;

const DRAFTS_DIRECTORY = FileSystem.documentDirectory + "drafts/";

const categories = [
  { label: "All Categories", value: "all" },
  { label: "Civil (CPC)", value: "civil" },
  { label: "Criminal (CrPC)", value: "criminal" },
  { label: "Commercial / ADR", value: "commercial" },
  { label: "Common Docs", value: "common" },
];

const BUILT_IN_TEMPLATES = [
  {
    id: "built_in_blank_page",
    template_type: "blank_page",
    title: "Blank Template (Start from Scratch)",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_vakalatnama",
    template_type: "vakalatnama",
    title: "Vakalatnama",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_adjournment",
    template_type: "adjournment",
    title: "Adjournment Application",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_bail",
    template_type: "bail",
    title: "Bail Application",
    category: "criminal",
    isBuiltIn: true,
  },
  {
    id: "built_in_affidavit",
    template_type: "affidavit",
    title: "Affidavit",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_written_statement",
    template_type: "written_statement",
    title: "Written Statement",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_legal_notice",
    template_type: "legal_notice",
    title: "Legal Notice",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_caveat",
    template_type: "caveat",
    title: "Caveat Petition",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_injunction",
    template_type: "injunction",
    title: "Temporary Injunction",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_plaint",
    template_type: "plaint",
    title: "Plaint (Civil Suit)",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_rejoinder",
    template_type: "rejoinder",
    title: "Replication / Rejoinder",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_execution",
    template_type: "execution",
    title: "Execution Petition",
    category: "civil",
    isBuiltIn: true,
  },
  {
    id: "built_in_anticipatory_bail",
    template_type: "anticipatory_bail",
    title: "Anticipatory Bail",
    category: "criminal",
    isBuiltIn: true,
  },
  {
    id: "built_in_private_complaint",
    template_type: "private_complaint",
    title: "Private Complaint",
    category: "criminal",
    isBuiltIn: true,
  },
  {
    id: "built_in_fir_quashing",
    template_type: "fir_quashing",
    title: "FIR Quashing Petition",
    category: "criminal",
    isBuiltIn: true,
  },
  {
    id: "built_in_exemption",
    template_type: "exemption",
    title: "Exemption Application",
    category: "common",
    isBuiltIn: true,
  },
  {
    id: "built_in_cheque_bounce",
    template_type: "cheque_bounce",
    title: "Cheque Bounce Notice",
    category: "commercial",
    isBuiltIn: true,
  },
  {
    id: "built_in_arbitration_sec9",
    template_type: "arbitration_sec9",
    title: "Arbitration Sec 9",
    category: "commercial",
    isBuiltIn: true,
  },
  {
    id: "built_in_consumer_complaint",
    template_type: "consumer_complaint",
    title: "Consumer Complaint",
    category: "commercial",
    isBuiltIn: true,
  },
  {
    id: "built_in_rent_agreement",
    template_type: "rent_agreement",
    title: "Rent Agreement",
    category: "commercial",
    isBuiltIn: true,
  },
  {
    id: "built_in_power_of_attorney",
    template_type: "power_of_attorney",
    title: "Power of Attorney",
    category: "commercial",
    isBuiltIn: true,
  },
];

const documentTypeColors: { [key: string]: string } = {
  blank_page: "#6B7280",
  vakalatnama: "#10B981", // Emerald/Green
  adjournment: "#3B82F6", // Blue
  bail: "#F59E0B", // Amber
  affidavit: "#8B5CF6", // Violet
  written_statement: "#EC4899", // Pink
  legal_notice: "#EF4444", // Red
  caveat: "#06B6D4", // Cyan
  injunction: "#6366F1", // Indigo
  plaint: "#10B981",
  rejoinder: "#F59E0B",
  execution: "#8B5CF6",
  anticipatory_bail: "#3B82F6",
  private_complaint: "#EC4899",
  fir_quashing: "#EF4444",
  exemption: "#06B6D4",
  cheque_bounce: "#6366F1",
  arbitration_sec9: "#8B5CF6",
  consumer_complaint: "#10B981",
  rent_agreement: "#F59E0B",
  power_of_attorney: "#EC4899",
};

interface DocumentTypeOption {
  label: string;
  value: string;
  category: string;
}

const documentTypeOptions: DocumentTypeOption[] = [
  // General / Blank
  {
    label: "Blank Template (Start from Scratch)",
    value: "blank_page",
    category: "common",
  },
  // Civil (CPC)
  { label: "Plaint (Civil Suit)", value: "plaint", category: "civil" },
  {
    label: "Written Statement (Defense Reply)",
    value: "written_statement",
    category: "civil",
  },
  { label: "Replication / Rejoinder", value: "rejoinder", category: "civil" },
  {
    label: "Temporary Injunction / Stay (Order 39 R 1/2)",
    value: "injunction",
    category: "civil",
  },
  {
    label: "Execution Petition (Order 21)",
    value: "execution",
    category: "civil",
  },
  {
    label: "Caveat Petition (Sec 148A CPC)",
    value: "caveat",
    category: "civil",
  },
  { label: "Adjournment Application", value: "adjournment", category: "civil" },

  // Criminal (CrPC)
  {
    label: "Bail Application (Sec 439 CrPC)",
    value: "bail",
    category: "criminal",
  },
  {
    label: "Anticipatory Bail (Sec 438 CrPC)",
    value: "anticipatory_bail",
    category: "criminal",
  },
  {
    label: "Private Complaint (Sec 200 CrPC)",
    value: "private_complaint",
    category: "criminal",
  },
  {
    label: "FIR Quashing Petition (Sec 482)",
    value: "fir_quashing",
    category: "criminal",
  },
  {
    label: "Exemption Application (Sec 205/317)",
    value: "exemption",
    category: "criminal",
  },

  // Commercial / ADR
  {
    label: "Cheque Bounce Notice (Sec 138 NI)",
    value: "cheque_bounce",
    category: "commercial",
  },
  {
    label: "Arbitration Section 9 Petition",
    value: "arbitration_sec9",
    category: "commercial",
  },
  {
    label: "Consumer Complaint",
    value: "consumer_complaint",
    category: "commercial",
  },

  // Common Deeds
  {
    label: "Vakalatnama (Authority Letter)",
    value: "vakalatnama",
    category: "common",
  },
  { label: "Supporting Affidavit", value: "affidavit", category: "common" },
  {
    label: "Legal Notice (Demand Notice)",
    value: "legal_notice",
    category: "common",
  },
  { label: "Rent Agreement", value: "rent_agreement", category: "common" },
  {
    label: "Power of Attorney (POA)",
    value: "power_of_attorney",
    category: "common",
  },
];

const getTemplateLabel = (type: string): string => {
  if (!type) return "";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const GenerateDocumentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<GenerateDocumentScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const { t, locale } = useTranslation();
  const styles = getStyles(theme);
  const { showAdWithPreload } = useAdTrigger();

  const caseId = route.params?.caseId;
  const [caseDetails, setCaseDetails] = useState<CaseWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [activeTab, setActiveTab] = useState<"fields" | "preview">("fields");
  const [documentType, setDocumentType] = useState<string>(
    route.params?.templateType || ""
  );
  const [isTemplateSelected, setIsTemplateSelected] = useState<boolean>(
    !!route.params?.templateType
  );
  const [outputLanguage, setOutputLanguage] = useState<"en" | "hi">("en");

  const [customTemplates, setCustomTemplates] = useState<DocumentDraft[]>([]);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [selectedTemplateCategory, setSelectedTemplateCategory] =
    useState("all");
  const [categoriesList, setCategoriesList] = useState([
    { label: locale === "hi" ? "सभी श्रेणियां" : "All Categories", value: "all" },
    { label: locale === "hi" ? "सिविल (CPC)" : "Civil (CPC)", value: "civil" },
    { label: locale === "hi" ? "क्रिमिनल (CrPC)" : "Criminal (CrPC)", value: "criminal" },
    { label: locale === "hi" ? "कमर्शियल / ADR" : "Commercial / ADR", value: "commercial" },
    { label: locale === "hi" ? "सामान्य दस्तावेज़" : "Common Docs", value: "common" },
  ]);

  const [isTransitionFinished, setIsTransitionFinished] = useState(
    process.env.NODE_ENV === "test"
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitionFinished(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchCustomTemplates = async () => {
      try {
        const templates = await getDocumentDrafts(null, 1, true);
        setCustomTemplates(templates);
      } catch (err) {
        console.error("Failed to load custom templates:", err);
      }
    };
    fetchCustomTemplates();
  }, []);

  useEffect(() => {
    if (route.params?.templateType) {
      setDocumentType(route.params.templateType);
      setIsTemplateSelected(true);
      if (route.params.templateType === "blank_page") {
        setActiveTab("preview");
      }
      if (route.params.draftId) {
        const fetchDraftHtml = async () => {
          try {
            const draft = await db.getDocumentDraftById(route.params.draftId!);
            if (draft) {
              setHtmlContent(draft.html_content);
            }
          } catch (e) {
            console.error(
              "Failed to load draft HTML on template pre-select:",
              e
            );
          }
        };
        fetchDraftHtml();
      }
    }
  }, [route.params?.templateType, route.params?.draftId]);

  // Rich-text editor states
  const [htmlContent, setHtmlContent] = useState("");
  const [isRichTextModified, setIsRichTextModified] = useState(false);
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
  const [isVocabularyVisible, setIsVocabularyVisible] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const tourSteps = [
    {
      title: locale === "hi" ? "दस्तावेज़ संपादक मार्गदर्शिका" : "Document Editor Guide",
      description: locale === "hi"
        ? "आपका स्वागत है! आइए इस नए लाइव एडिटर की मुख्य विशेषताओं का जल्दी से परिचय लें।"
        : "Welcome! Let's take a quick tour of the key features in this document editor.",
      icon: "book-outline",
    },
    {
      title: locale === "hi" ? "लाइव स्वरूपण (Formatting) उपकरण" : "Formatting Tools",
      description: locale === "hi"
        ? "बोल्ड, इटैलिक, अंडरलाइन, संरेखण (alignment), और बुलेट/नंबर सूचियों का उपयोग करके अपने दस्तावेज़ को तुरंत स्वरूपित करें।"
        : "Format your text instantly using Bold, Italic, Underline, alignments, and lists in the formatting toolbar.",
      icon: "text-outline",
    },
    {
      title: locale === "hi" ? "पेज सेटअप और मार्जिन" : "Page Setup & Margins",
      description: locale === "hi"
        ? "पेज साइज (A4 बनाम Legal), फ़ॉन्ट आकार, लाइन स्पेसिंग, और रेड लेज़र मार्जिन लाइनों को आवश्यकतानुसार समायोजित करें।"
        : "Configure paper size (A4 vs Legal), active fonts, margins, line spacing, and print properties easily.",
      icon: "settings-outline",
    },
    {
      title: locale === "hi" ? "पेज ब्रेक जोड़ना" : "Insert Page Breaks",
      description: locale === "hi"
        ? "नई 'पेज ब्रेक' सुविधा से दस्तावेज़ को अलग-अलग पेजों में विभाजित करें ताकि प्रिंट या पीडीएफ में पेज सही जगह से कटें।"
        : "Use the new Page Break feature to insert page dividers. The generated PDF will cleanly break the page at these points.",
      icon: "layers-outline",
    },
    {
      title: locale === "hi" ? "स्मार्ट प्लेसहोल्डर्स" : "Smart Placeholders",
      description: locale === "hi"
        ? "दस्तावेज़ में मौजूद [Client Name] जैसे कोष्ठक वाले शब्दों पर केवल एक बार टैप करके उन्हें आसानी से बदलें।"
        : "Tap on any bracketed text like [Client Name] or lines like _____ to open a quick fill popup and replace them instantly.",
      icon: "create-outline",
    },
    {
      title: locale === "hi" ? "टेम्पलेट के रूप में सहेजें" : "Save as Template",
      description: locale === "hi"
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
  const [isSignatureListVisible, setIsSignatureListVisible] = useState(false);
  const [vocabSearchQuery, setVocabSearchQuery] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [customTemplateTitle, setCustomTemplateTitle] = useState("");
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);

  const [editorState, setEditorState] = useState({
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

  const getFilteredTemplates = () => {
    const combined = [
      ...BUILT_IN_TEMPLATES,
      ...customTemplates.map((t) => ({
        id: t.id,
        template_type: t.template_type,
        title: t.title,
        category: "common",
        isBuiltIn: false,
      })),
    ];

    let filtered = combined;
    if (templateSearchQuery.trim() !== "") {
      const q = templateSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.template_type.toLowerCase().includes(q)
      );
    }

    if (selectedTemplateCategory !== "all") {
      filtered = filtered.filter(
        (t) => t.category === selectedTemplateCategory
      );
    }

    return filtered;
  };

  const renderTemplateCardItem = ({ item }: { item: any }) => {
    const color =
      documentTypeColors[item.template_type] || theme.colors.primary;
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          margin: 6,
          backgroundColor: theme.colors.cardBackground,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
          maxWidth: (Dimensions.get("window").width - 32) / 2 - 12,
        }}
        activeOpacity={0.85}
        onPress={async () => {
          setDocumentType(item.template_type);
          if (!item.isBuiltIn) {
            try {
              const draft = await db.getDocumentDraftById(item.id);
              if (draft) {
                setHtmlContent(draft.html_content);
              }
            } catch (err) {
              console.error("Failed to load template draft HTML:", err);
            }
          } else {
            setHtmlContent("");
          }
          setIsTemplateSelected(true);
          if (item.template_type === "blank_page") {
            setActiveTab("preview");
          } else {
            setActiveTab("fields");
          }
        }}
      >
        <View
          style={{
            width: 72,
            height: 114,
            backgroundColor: "#fcf9f2",
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: "#e2d2b2",
            position: "relative",
            overflow: "hidden",
            marginBottom: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 3,
          }}
        >
          <View
            style={{
              position: "absolute",
              left: 14,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: "#ef4444",
              opacity: 0.6,
            }}
          />
          <View
            style={{ marginTop: 14, paddingLeft: 18, paddingRight: 6, gap: 5 }}
          >
            <View
              style={{ height: 3, backgroundColor: "#d1d5db", width: "80%" }}
            />
            <View
              style={{ height: 3, backgroundColor: "#d1d5db", width: "90%" }}
            />
            <View
              style={{ height: 3, backgroundColor: "#d1d5db", width: "65%" }}
            />
            <View
              style={{ height: 3, backgroundColor: "#e5e7eb", width: "85%" }}
            />
            <View
              style={{ height: 3, backgroundColor: "#e5e7eb", width: "70%" }}
            />
            <View
              style={{ height: 3, backgroundColor: "#e5e7eb", width: "90%" }}
            />
            <View
              style={{ height: 3, backgroundColor: "#e5e7eb", width: "50%" }}
            />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              backgroundColor: color,
              borderRadius: 3,
              paddingHorizontal: 4,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 8, fontWeight: "bold" }}>
              PDF
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 13,
            fontWeight: "bold",
            color: theme.colors.text,
            textAlign: "center",
            marginBottom: 6,
            height: 36,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <View
          style={{
            backgroundColor: item.isBuiltIn
              ? `${theme.colors.primary}12`
              : `${theme.colors.success}12`,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: item.isBuiltIn
                ? theme.colors.primary
                : theme.colors.success,
            }}
          >
            {item.isBuiltIn ? "Built-in" : "Custom"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const webViewRef = React.useRef<WebView>(null);
  const saveCallbackRef = React.useRef<((html: string) => void) | null>(null);

  const postMessageToWebView = (message: object) => {
    const jsonStr = JSON.stringify(message);
    const escaped = jsonStr.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    webViewRef.current?.injectJavaScript(
      `window.handleRNMessage('${escaped}'); void(0);`
    );
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
  };

  const triggerFormat = (command: string, value: string | null = null) => {
    postMessageToWebView({
      type: "exec",
      command,
      value,
    });
  };

  const handleEditorMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "state") {
        setEditorState(data.state);
      } else if (data.type === "change") {
        setIsRichTextModified(true);
      } else if (data.type === "save") {
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

  const handleTabChange = (newTab: "fields" | "preview") => {
    if (newTab === "fields" && isRichTextModified) {
      Alert.alert(
        t("docgen_unsaved_title") || "Unsaved Changes",
        "Switching back to the form will discard your manual editor customizations. Do you want to continue?",
        [
          { text: t("alert_cancel") || "Keep Editing", style: "cancel" },
          {
            text: t("alert_discard") || "Discard",
            style: "destructive",
            onPress: () => {
              setIsRichTextModified(false);
              setActiveTab("fields");
            },
          },
        ]
      );
    } else {
      if (newTab === "preview") {
        const compiledHtml = getInterpolatedHtml();
        setHtmlContent(compiledHtml);
      }
      setActiveTab(newTab);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("docgen_header_title") });
  }, [navigation, t]);

  const getTranslatedDocTypes = () => {
    return documentTypeOptions.map((opt) => {
      let label = opt.label;
      switch (opt.value) {
        case "plaint":
          label = t("docgen_opt_plaint");
          break;
        case "written_statement":
          label = t("docgen_opt_written_statement");
          break;
        case "rejoinder":
          label = t("docgen_opt_rejoinder");
          break;
        case "injunction":
          label = t("docgen_opt_injunction");
          break;
        case "execution":
          label = t("docgen_opt_execution");
          break;
        case "caveat":
          label = t("docgen_opt_caveat");
          break;
        case "blank_page":
          label = t("docgen_opt_blank_page");
          break;
        case "adjournment":
          label = t("docgen_opt_adjournment");
          break;
        case "bail":
          label = t("docgen_opt_bail");
          break;
        case "anticipatory_bail":
          label = t("docgen_opt_anticipatory_bail");
          break;
        case "private_complaint":
          label = t("docgen_opt_private_complaint");
          break;
        case "fir_quashing":
          label = t("docgen_opt_fir_quashing");
          break;
        case "exemption":
          label = t("docgen_opt_exemption");
          break;
        case "cheque_bounce":
          label = t("docgen_opt_cheque_bounce");
          break;
        case "arbitration_sec9":
          label = t("docgen_opt_arbitration_sec9");
          break;
        case "consumer_complaint":
          label = t("docgen_opt_consumer_complaint");
          break;
        case "vakalatnama":
          label = t("docgen_opt_vakalatnama");
          break;
        case "affidavit":
          label = t("docgen_opt_affidavit");
          break;
        case "legal_notice":
          label = t("docgen_opt_legal_notice");
          break;
        case "rent_agreement":
          label = t("docgen_opt_rent_agreement");
          break;
        case "power_of_attorney":
          label = t("docgen_opt_power_of_attorney");
          break;
      }
      return { ...opt, label };
    });
  };

  const getFullDocTypesList = () => {
    const standardList = getTranslatedDocTypes();
    const customList = customTemplates.map((tpl) => ({
      label: tpl.title,
      value: `custom_${tpl.id}`,
      category: tpl.template_type || "common",
      isCustom: true,
    }));
    return [...standardList, ...customList];
  };

  // Shared Case/Client details (Editable if no caseId is provided)
  const [caseTitle, setCaseTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [oppositePartyName, setOppositePartyName] = useState("");
  const [courtName, setCourtName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseYear, setCaseYear] = useState("2026");

  // Shared Advocate details (with local caching via AsyncStorage)
  const [advocateName, setAdvocateName] = useState("");
  const [advocateEnrollment, setAdvocateEnrollment] = useState("");
  const [advocateAddress, setAdvocateAddress] = useState("");

  // Reusable fields
  const [adjournmentReason, setAdjournmentReason] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [firNumber, setFirNumber] = useState("");
  const [firYear, setFirYear] = useState(new Date().getFullYear().toString());
  const [deponentAge, setDeponentAge] = useState("");
  const [deponentAddress, setDeponentAddress] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");

  // Dynamic paragraph list states
  const [groundOfBailList, setGroundOfBailList] = useState<string[]>([""]);
  const [affidavitFactsList, setAffidavitFactsList] = useState<string[]>([""]);
  const [preliminaryObjectionsList, setPreliminaryObjectionsList] = useState<
    string[]
  >([""]);
  const [replyOnMeritsList, setReplyOnMeritsList] = useState<string[]>([""]);
  const [demandTextList, setDemandTextList] = useState<string[]>([""]);
  const [restraintPrayerList, setRestraintPrayerList] = useState<string[]>([
    "",
  ]);

  const formatListHtml = (list: string[], prefixNumber = false) => {
    const active = list.filter((item) => item && item.trim() !== "");
    if (active.length === 0) return "";
    if (active.length === 1) return active[0];
    return active
      .map(
        (item, idx) =>
          `<div>${prefixNumber ? `(${idx + 1}) ` : ""}${item}</div>`
      )
      .join("");
  };

  // New specific fields
  const [valuation, setValuation] = useState("");
  const [replyPoints, setReplyPoints] = useState("");
  const [decreeDate, setDecreeDate] = useState("");
  const [satisfactionDetails, setSatisfactionDetails] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [dishonorDate, setDishonorDate] = useState("");
  const [termMonths, setTermMonths] = useState("11");
  const [witness1, setWitness1] = useState("");
  const [witness2, setWitness2] = useState("");

  // Load case metadata and cached advocate profile
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (caseId) {
          const details = await getCaseById(caseId);
          if (details) {
            setCaseDetails(details);
            setCaseTitle(
              `${details.FirstParty || details.ClientName || "Petitioner"} vs ${details.OppositeParty || "Respondent"}`
            );
            setClientName(details.ClientName || "");
            setOppositePartyName(details.OppositeParty || "");
            setCourtName(details.court_name || "");
            setCaseNumber(details.case_number || "");
            setCaseYear(details.case_year?.toString() || "2026");

            // Template-specific defaults
            setFirNumber(details.case_number || "");
            setPoliceStation(
              details.court_name ? `${details.court_name} Jurisdiction` : ""
            );
          }
        }

        // Load cached advocate details
        const cachedName = await AsyncStorage.getItem("@advocate_name");
        const cachedEnrollment = await AsyncStorage.getItem(
          "@advocate_enrollment"
        );
        const cachedAddress = await AsyncStorage.getItem("@advocate_address");

        if (cachedName) setAdvocateName(cachedName);
        if (cachedEnrollment) setAdvocateEnrollment(cachedEnrollment);
        if (cachedAddress) setAdvocateAddress(cachedAddress);

        // Load lawyer's actual profile details to prioritize categories
        const userIdVal = await AsyncStorage.getItem("@user_id");
        if (userIdVal) {
          const parsedUserId = parseInt(userIdVal, 10);
          const dbInstance = await getDb();
          const profile = await getUserProfile(dbInstance, parsedUserId);
          if (profile && profile.practiceAreas && profile.practiceAreas.length > 0) {
            const practiceAreasLower = profile.practiceAreas.map((p: string) => p.toLowerCase());
            let matchedCategory: string | null = null;
            for (const area of practiceAreasLower) {
              if (area.includes("civil")) {
                matchedCategory = "civil";
                break;
              } else if (area.includes("criminal")) {
                matchedCategory = "criminal";
                break;
              } else if (area.includes("commercial") || area.includes("adr") || area.includes("arbitration") || area.includes("corporate")) {
                matchedCategory = "commercial";
                break;
              }
            }

            if (matchedCategory) {
              setSelectedTemplateCategory(matchedCategory);

              // Reorder categoriesList to prioritize lawyer's matching category
              const baseCategories = [
                { label: locale === "hi" ? "सभी श्रेणियां" : "All Categories", value: "all" },
                { label: locale === "hi" ? "सिविल (CPC)" : "Civil (CPC)", value: "civil" },
                { label: locale === "hi" ? "क्रिमिनल (CrPC)" : "Criminal (CrPC)", value: "criminal" },
                { label: locale === "hi" ? "कमर्शियल / ADR" : "Commercial / ADR", value: "commercial" },
                { label: locale === "hi" ? "सामान्य दस्तावेज़" : "Common Docs", value: "common" },
              ];

              const matchedItem = baseCategories.find((c) => c.value === matchedCategory);
              if (matchedItem) {
                const rest = baseCategories.filter((c) => c.value !== matchedCategory);
                setCategoriesList([matchedItem, ...rest]);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load details for document generator:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [caseId]);

  // Handle caching advocate inputs to AsyncStorage on generate
  const cacheAdvocateProfile = async () => {
    try {
      await AsyncStorage.setItem("@advocate_name", advocateName);
      await AsyncStorage.setItem("@advocate_enrollment", advocateEnrollment);
      await AsyncStorage.setItem("@advocate_address", advocateAddress);
    } catch (e) {
      console.warn("Could not save advocate details to local storage:", e);
    }
  };

  const interpolateCustomHtml = (html: string): string => {
    let result = html;
    const replacements: Record<string, string> = {
      "\\[COURT NAME\\]": courtName || "District Court",
      "\\[CASE NUMBER\\]": caseNumber || "______",
      "\\[CASE YEAR\\]": caseYear || "2026",
      "\\[CLIENT NAME\\]": clientName || "Client",
      "\\[ADVOCATE NAME\\]": advocateName || "Advocate",
      "\\[ADVOCATE ENROLLMENT\\]": advocateEnrollment || "______",
      "\\[ADVOCATE ADDRESS\\]": advocateAddress || "______",
      "\\[POLICE STATION\\]": policeStation || "______",
      "\\[FIR NUMBER\\]": firNumber || "______",
      "\\[FIR YEAR\\]": firYear || "2026",
      "\\[OPPOSITE PARTY\\]": oppositePartyName || "Opposite Party",
      "\\[OPPOSITE PARTY ADDRESS\\]": receiverAddress || "______",
      "\\[SENDER NAME\\]": clientName || "Client",
      "\\[SENDER ADDRESS\\]": deponentAddress || "______",
      "\\[RECEIVER NAME\\]": oppositePartyName || "Respondent",
      "\\[RECEIVER ADDRESS\\]": receiverAddress || "______",
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder, "g");
      result = result.replace(regex, value);
    }
    return result;
  };

  const checkIfBoilerplateChanged = (editorHtml: string): boolean => {
    const compiledHtml = getInterpolatedHtml();

    const cleanText = (html: string) => {
      if (!html) return "";
      return html
        .replace(/<!--.*?-->/gs, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const editorTextClean = cleanText(editorHtml);
    const compiledTextClean = cleanText(compiledHtml);

    return editorTextClean !== compiledTextClean;
  };

  // Compile document properties
  const getInterpolatedHtml = (): string => {
    const parties =
      caseTitle ||
      `${clientName || "Petitioner"} vs ${oppositePartyName || "Respondent"}`;
    const isHindi = outputLanguage === "hi";

    if (documentType.startsWith("custom_")) {
      const customId = documentType.replace("custom_", "");
      const selectedTpl = customTemplates.find((tpl) => tpl.id === customId);
      if (selectedTpl) {
        return interpolateCustomHtml(selectedTpl.html_content);
      }
      return "";
    }

    if (documentType === "blank_page") {
      return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: 'Outfit', sans-serif; padding: 20px; line-height: 1.6; }
</style>
</head>
<body>
<p><br></p>
</body>
</html>`;
    }

    if (documentType === "vakalatnama") {
      return getVakalatnamaHtml(
        {
          courtName: courtName || "District Court",
          suitNumber: caseNumber,
          caseYear,
          parties,
          clientName: clientName || "Client",
          advocateName: advocateName || "Advocate",
          advocateEnrollment,
          advocateAddress,
        },
        isHindi
      );
    } else if (documentType === "adjournment") {
      return getAdjournmentHtml(
        {
          courtName: courtName || "District Court",
          caseNumber,
          parties,
          nextHearingDate: caseDetails?.NextDate
            ? formatDate(caseDetails.NextDate)
            : "",
          reason: adjournmentReason || "Counsel is busy in another court",
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "bail") {
      return getBailHtml(
        {
          courtName: courtName || "Sessions Court",
          policeStation,
          firNumber,
          firYear,
          underSection: caseDetails?.Undersection || "",
          accusedName: caseDetails?.Accussed || clientName || "Accused",
          groundOfBail:
            formatListHtml(groundOfBailList, true) ||
            "the investigation is complete",
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "affidavit") {
      return getAffidavitHtml(
        {
          courtName: courtName || "District Court",
          caseNumber,
          parties,
          deponentName: clientName || "Deponent",
          deponentAge,
          deponentAddress,
          facts: formatListHtml(affidavitFactsList, false),
        },
        isHindi
      );
    } else if (documentType === "written_statement") {
      return getWrittenStatementHtml(
        {
          courtName: courtName || "District Court",
          caseNumber,
          parties,
          respondentName: clientName || "Respondent",
          preliminaryObjections: formatListHtml(
            preliminaryObjectionsList,
            true
          ),
          replyOnMerits: formatListHtml(replyOnMeritsList, true),
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "legal_notice") {
      return getLegalNoticeHtml(
        {
          senderName: clientName || "Client",
          senderAddress: deponentAddress,
          receiverName: oppositePartyName || "Recipient",
          receiverAddress,
          noticeSubject: caseTitle || "Legal Demand Notice",
          noticeFacts: formatListHtml(affidavitFactsList, false),
          demandText: formatListHtml(demandTextList, false),
          advocateName: advocateName || "Advocate",
          advocateEnrollment,
          advocateAddress,
        },
        isHindi
      );
    } else if (documentType === "caveat") {
      return getCaveatHtml(
        {
          courtName: courtName || "District Court",
          caveatorName: clientName || "Caveator",
          caveatorAddress: deponentAddress,
          expectedOppositePartyName: oppositePartyName || "Opposite Party",
          expectedOppositePartyAddress: receiverAddress,
          subjectMatter: caseTitle || "Subject Dispute",
          advocateName: advocateName || "Advocate",
          advocateEnrollment,
          advocateAddress,
        },
        isHindi
      );
    } else if (documentType === "injunction") {
      return getInjunctionHtml(
        {
          courtName: courtName || "District Court",
          caseNumber,
          parties,
          applicantName: clientName || "Applicant",
          injunctionFacts: formatListHtml(affidavitFactsList, false),
          restraintPrayer: formatListHtml(restraintPrayerList, false),
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "plaint") {
      return getPlaintHtml(
        {
          courtName: courtName || "District Court",
          caseNumber,
          caseYear,
          parties,
          plaintiffName: clientName || "Plaintiff",
          defendantName: oppositePartyName || "Defendant",
          valuation,
          suitFacts: formatListHtml(affidavitFactsList, false),
          prayerText: formatListHtml(restraintPrayerList, false),
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "rejoinder") {
      return getRejoinderHtml(
        {
          courtName: courtName || "District Court",
          caseNumber,
          caseYear,
          parties,
          replyPoints,
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "execution") {
      return getExecutionHtml(
        {
          courtName: courtName || "District Court",
          caseNumber,
          caseYear,
          decreeHolder: clientName || "Decree Holder",
          judgmentDebtor: oppositePartyName || "Judgment Debtor",
          decreeDate,
          decreetalAmount: valuation,
          satisfactionDetails,
          reliefSought: formatListHtml(restraintPrayerList, false),
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "anticipatory_bail") {
      return getAnticipatoryBailHtml(
        {
          courtName: courtName || "Sessions Court",
          policeStation,
          firNumber,
          firYear,
          underSection: caseDetails?.Undersection || "",
          applicantName: clientName || "Applicant",
          apprehensionReason: adjournmentReason,
          grounds: formatListHtml(groundOfBailList, true),
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "private_complaint") {
      return getPrivateComplaintHtml(
        {
          courtName: courtName || "Magistrate Court",
          complainantName: clientName || "Complainant",
          complainantAddress: deponentAddress,
          accusedName: oppositePartyName || "Accused",
          accusedAddress: receiverAddress,
          incidentDate: decreeDate,
          incidentFacts: formatListHtml(affidavitFactsList, false),
          offences: caseDetails?.Undersection || "IPC Sections",
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "fir_quashing") {
      return getFirQuashingHtml(
        {
          courtName: courtName || "High Court",
          policeStation,
          firNumber,
          firYear,
          applicantName: clientName || "Applicant",
          groundsOfQuashing: formatListHtml(groundOfBailList, true),
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "exemption") {
      return getExemptionHtml(
        {
          courtName: courtName || "District Court",
          caseNumber,
          caseYear,
          parties,
          accusedName: clientName || "Accused",
          excuseReason:
            formatListHtml(groundOfBailList, true) || "medical grounds",
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "cheque_bounce") {
      return getChequeBounceHtml(
        {
          senderName: clientName || "Payee",
          senderAddress: deponentAddress,
          receiverName: oppositePartyName || "Drawer",
          receiverAddress,
          chequeNumber,
          chequeDate: decreeDate,
          bankName: policeStation || "Bank",
          chequeAmount: valuation,
          dishonorDate,
          dishonorReason:
            formatListHtml(groundOfBailList, true) || "Funds Insufficient",
          noticeDate: new Date().toLocaleDateString("en-IN"),
          demandPeriod: "15",
          advocateName: advocateName || "Advocate",
          advocateEnrollment,
          advocateAddress,
        },
        isHindi
      );
    } else if (documentType === "arbitration_sec9") {
      return getArbitrationSec9Html(
        {
          courtName: courtName || "District Court",
          parties,
          agreementDate: decreeDate,
          disputeDetails: formatListHtml(groundOfBailList, true),
          interimRelief: formatListHtml(restraintPrayerList, false),
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "consumer_complaint") {
      return getConsumerComplaintHtml(
        {
          forumName: courtName || "Consumer Forum",
          complainantName: clientName || "Complainant",
          oppositePartyName: oppositePartyName || "Opposite Party",
          productDetails: caseTitle || "Product purchased",
          costAmount: valuation,
          deficiencyDetails: formatListHtml(groundOfBailList, true),
          compensationSought: formatListHtml(restraintPrayerList, false),
          advocateName: advocateName || "Advocate",
        },
        isHindi
      );
    } else if (documentType === "rent_agreement") {
      return getRentAgreementHtml(
        {
          landlordName: clientName || "Landlord",
          landlordAddress: deponentAddress,
          tenantName: oppositePartyName || "Tenant",
          tenantAddress: receiverAddress,
          propertyAddress: deponentAddress || "Rented Premises",
          rentAmount: valuation,
          securityDeposit: satisfactionDetails,
          termMonths,
          agreementDate: decreeDate,
          witness1,
          witness2,
        },
        isHindi
      );
    } else if (documentType === "power_of_attorney") {
      return getPowerOfAttorneyHtml(
        {
          principalName: clientName || "Principal",
          principalAddress: deponentAddress,
          attorneyName: oppositePartyName || "Attorney",
          attorneyAddress: receiverAddress,
          powersGranted: formatListHtml(restraintPrayerList, false),
          executionDate: decreeDate,
          witness1,
          witness2,
        },
        isHindi
      );
    }

    return "";
  };

  const renderDynamicParagraphInput = (
    label: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string
  ) => {
    return (
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: theme.colors.text,
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
        {list.map((text, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <FormInput
                label=""
                value={text}
                onChangeText={(val) => {
                  const updated = [...list];
                  updated[idx] = val;
                  setList(updated);
                }}
                placeholder={`${placeholder} (${locale === "hi" ? "पैराग्राफ" : "Paragraph"} ${idx + 1})...`}
                multiline
                numberOfLines={3}
              />
            </View>
            {list.length > 1 && (
              <TouchableOpacity
                style={{
                  marginLeft: 8,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: "#EF4444",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 48,
                  width: 48,
                }}
                onPress={() => {
                  setList(list.filter((_, i) => i !== idx));
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.primary,
            borderStyle: "dashed",
            justifyContent: "center",
          }}
          onPress={() => setList([...list, ""])}
        >
          <Ionicons
            name="add"
            size={18}
            color={theme.colors.primary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={{
              color: theme.colors.primary,
              fontWeight: "bold",
              fontSize: 13,
            }}
          >
            {locale === "hi" ? "पैराग्राफ जोड़ें" : "Add Paragraph"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const executePdfExport = async (html: string) => {
    await showAdWithPreload("rewarded", async (success) => {
      if (success) {
        setIsGenerating(true);
        await cacheAdvocateProfile();

        try {
          const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, lineHeight, topMargin })} -->`;
          const formattedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body {
                  font-family: ${font};
                  line-height: ${lineHeight};
                  padding-top: ${topMargin}px;
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
              ${html.replace(/<!-- CD_LAYOUT:(.*?) -->/, "")}
            </body>
            </html>
          `;

          const { uri } = await Print.printToFileAsync({
            html: formattedHtml,
            width: 612,
            height: 1008,
          });

          if (caseId) {
            // Case-associated document sharing / opening options
            const docTitle = `Export_${documentType.toUpperCase()}`;
            Alert.alert(
              t("docgen_alert_saved_title") || "Document Generated",
              "Choose an action for this PDF:",
              [
                {
                  text: "Open in App",
                  onPress: () => {
                    // @ts-ignore
                    navigation.navigate("PdfViewer", {
                      pdfUri: uri,
                      title: docTitle,
                    });
                  },
                },
                {
                  text: "Share PDF",
                  onPress: async () => {
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(uri, {
                        mimeType: "application/pdf",
                        dialogTitle: docTitle,
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
          } else {
            // Stand-alone Document Mode: save to drafts directory and cache metadata in AsyncStorage
            const dirInfo = await FileSystem.getInfoAsync(DRAFTS_DIRECTORY);
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(DRAFTS_DIRECTORY, {
                intermediates: true,
              });
            }

            const draftId = uuidv4();
            const storedFilename = `${draftId}.pdf`;
            const destinationUri = DRAFTS_DIRECTORY + storedFilename;

            await FileSystem.copyAsync({ from: uri, to: destinationUri });

            // Retrieve existing unassociated drafts
            const existingRaw = await AsyncStorage.getItem(
              "@unassociated_documents"
            );
            const existingDrafts = existingRaw ? JSON.parse(existingRaw) : [];

            const newDraft = {
              id: draftId,
              title: `${getFullDocTypesList().find((o) => o.value === documentType)?.label || "Draft"} - ${
                clientName || "Unassociated"
              }`,
              templateType: documentType,
              filePath: destinationUri,
              createdAt: new Date().toISOString(),
            };

            existingDrafts.push(newDraft);
            await AsyncStorage.setItem(
              "@unassociated_documents",
              JSON.stringify(existingDrafts)
            );

            // Also save to SQLite
            await saveDocumentDraft({
              id: draftId,
              case_id: null,
              title: newDraft.title,
              template_type: documentType,
              html_content: metadataComment + html,
              is_custom_template: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            Alert.alert(
              t("docgen_alert_saved_title"),
              t("docgen_alert_saved_desc"),
              [
                {
                  text: "Open in App",
                  onPress: () => {
                    // @ts-ignore
                    navigation.navigate("PdfViewer", {
                      pdfUri: destinationUri,
                      title: newDraft.title,
                    });
                  },
                },
                {
                  text: "Share PDF",
                  onPress: async () => {
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(destinationUri, {
                        mimeType: "application/pdf",
                        dialogTitle: newDraft.title,
                        UTI: "com.adobe.pdf",
                      });
                    }
                  },
                },
                {
                  text: t("docgen_alert_go_drafts"),
                  onPress: () => {
                    // @ts-ignore
                    navigation.navigate("DraftsHub");
                  },
                },
                {
                  text: t("docgen_alert_close"),
                  onPress: () => navigation.goBack(),
                  style: "cancel",
                },
              ]
            );
          }
        } catch (error) {
          console.error("Error generating PDF template:", error);
          Alert.alert(t("alert_error"), t("doc_err_upload_general"));
        } finally {
          setIsGenerating(false);
        }
      }
    });
  };

  const handleGeneratePdf = async () => {
    try {
      if (activeTab === "preview" && webViewRef.current) {
        postMessageToWebView({ type: "requestSave" });
        saveCallbackRef.current = async (html) => {
          setHtmlContent(html);
          await executePdfExport(html);
        };
      } else {
        const html = getInterpolatedHtml();
        await executePdfExport(html);
      }
    } catch (e) {
      console.error("DEBUG handleGeneratePdf error:", e);
    }
  };

  const handleEditCustomize = async () => {
    setIsGenerating(true);
    await cacheAdvocateProfile();
    try {
      const htmlContent = getInterpolatedHtml();
      // @ts-ignore
      navigation.navigate("EditDraft", {
        caseId: caseId ? Number(caseId) : undefined,
        initialHtml: htmlContent,
        templateType: documentType,
        title: `${getTranslatedDocTypes().find((o) => o.value === documentType)?.label || "Draft"} - ${clientName || "Custom"}`,
      });
    } catch (error) {
      console.error("Error creating initial customization HTML:", error);
      Alert.alert(t("alert_error"), "Could not prepare draft text.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || !isTransitionFinished) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.textSecondary }}>
          {t("docgen_preparing")}
        </Text>
      </View>
    );
  }

  if (!isTemplateSelected) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        {/* Template Selector Screen Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.cardBackground,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.text,
            }}
          >
            Select Document Template
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={{ padding: 12, backgroundColor: theme.colors.cardBackground }}
        >
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
            }}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <TextInput
              placeholder="Search templates..."
              placeholderTextColor={theme.colors.textSecondary}
              style={{
                flex: 1,
                color: theme.colors.text,
                fontSize: 14,
                padding: 0,
              }}
              value={templateSearchQuery}
              onChangeText={setTemplateSearchQuery}
            />
            {templateSearchQuery !== "" && (
              <TouchableOpacity onPress={() => setTemplateSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories segmented tabs deck */}
        <View
          style={{ height: 48, backgroundColor: theme.colors.cardBackground }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              gap: 8,
            }}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            {categoriesList.map((cat) => {
              const isSelected = selectedTemplateCategory === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : `${theme.colors.border}40`,
                    height: 28,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => setSelectedTemplateCategory(cat.value)}
                >
                  <Text
                    style={{
                      color: isSelected ? "#ffffff" : theme.colors.text,
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Grid List */}
        <FlatList
          data={getFilteredTemplates()}
          renderItem={renderTemplateCardItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 10, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 40,
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={48}
                color={theme.colors.textSecondary}
                style={{ opacity: 0.5 }}
              />
              <Text
                style={{ marginTop: 10, color: theme.colors.textSecondary }}
              >
                No matching templates found
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Tab Selectors */}
      {documentType !== "blank_page" && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "fields" && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange("fields")}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={
                activeTab === "fields"
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "fields" && styles.activeTabText,
              ]}
            >
              {locale === "hi" ? "फ़ॉर्म इनटेक" : "Form Intake"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "preview" && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange("preview")}
          >
            <Ionicons
              name="create"
              size={18}
              color={
                activeTab === "preview"
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "preview" && styles.activeTabText,
              ]}
            >
              {locale === "hi" ? "लाइव एडिटर" : "Live Editor"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "fields" ? (
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Active Template Information Banner */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: `${theme.colors.primary}10`,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: `${theme.colors.primary}20`,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.textSecondary,
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  Active Template
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    color: theme.colors.text,
                  }}
                >
                  {getTranslatedDocTypes().find((o) => o.value === documentType)
                    ?.label || getTemplateLabel(documentType)}
                </Text>
              </View>
              {!route.params?.templateType && (
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                  onPress={() => setIsTemplateSelected(false)}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
                  >
                    Change
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Language Selection */}
            <SectionHeader title={t("docgen_sec_lang")} />
            <View style={{ flexDirection: "row", marginBottom: 16 }}>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  outputLanguage === "en" && styles.activeLangButton,
                ]}
                onPress={() => setOutputLanguage("en")}
              >
                <Text
                  style={[
                    styles.langText,
                    outputLanguage === "en" && styles.activeLangText,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  outputLanguage === "hi" && styles.activeLangButton,
                ]}
                onPress={() => setOutputLanguage("hi")}
              >
                <Text
                  style={[
                    styles.langText,
                    outputLanguage === "hi" && styles.activeLangText,
                  ]}
                >
                  हिन्दी (Hindi)
                </Text>
              </TouchableOpacity>
            </View>

            {!caseId && (
              <View>
                <SectionHeader title={t("docgen_sec_case_details")} />
                <FormInput
                  label={t("docgen_field_client_label")}
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder={t("docgen_placeholder_client")}
                />
                <FormInput
                  label={t("docgen_field_opposite_label")}
                  value={oppositePartyName}
                  onChangeText={setOppositePartyName}
                  placeholder={t("docgen_placeholder_opposite")}
                />
                <FormInput
                  label={t("docgen_field_parties_label")}
                  value={caseTitle}
                  onChangeText={setCaseTitle}
                  placeholder={t("docgen_placeholder_parties")}
                />
                <FormInput
                  label={t("docgen_field_court_label")}
                  value={courtName}
                  onChangeText={setCourtName}
                  placeholder={t("docgen_placeholder_court")}
                />
                <FormInput
                  label={t("docgen_field_case_num_label")}
                  value={caseNumber}
                  onChangeText={setCaseNumber}
                  placeholder={t("docgen_placeholder_case_num")}
                />
                <FormInput
                  label={t("docgen_field_case_year_label")}
                  value={caseYear}
                  onChangeText={setCaseYear}
                  placeholder={t("docgen_placeholder_case_year")}
                  keyboardType="numeric"
                />
              </View>
            )}

            <SectionHeader title={t("docgen_sec_advocate")} />
            <FormInput
              label={t("docgen_field_adv_name_label")}
              value={advocateName}
              onChangeText={setAdvocateName}
              placeholder={t("docgen_placeholder_adv_name")}
            />
            <FormInput
              label={t("docgen_field_bar_label")}
              value={advocateEnrollment}
              onChangeText={setAdvocateEnrollment}
              placeholder={t("docgen_placeholder_bar")}
            />
            <FormInput
              label={t("docgen_field_addr_label")}
              value={advocateAddress}
              onChangeText={setAdvocateAddress}
              placeholder={t("docgen_placeholder_addr")}
            />

            <SectionHeader title={t("docgen_sec_customization")} />

            {/* Custom Inputs per template */}
            {documentType === "adjournment" && (
              <View>
                <FormInput
                  label={t("docgen_field_adjournment_reason")}
                  value={adjournmentReason}
                  onChangeText={setAdjournmentReason}
                  placeholder={t("docgen_placeholder_adjournment_reason")}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {(documentType === "bail" ||
              documentType === "anticipatory_bail" ||
              documentType === "fir_quashing" ||
              documentType === "private_complaint" ||
              documentType === "cheque_bounce") && (
              <View>
                <FormInput
                  label={
                    documentType === "cheque_bounce"
                      ? t("docgen_field_bank_name")
                      : t("docgen_field_police_station")
                  }
                  value={policeStation}
                  onChangeText={setPoliceStation}
                  placeholder={
                    documentType === "cheque_bounce"
                      ? t("docgen_placeholder_bank_name")
                      : t("docgen_placeholder_police_station")
                  }
                />
                {documentType !== "cheque_bounce" &&
                  documentType !== "private_complaint" && (
                    <View>
                      <FormInput
                        label={t("docgen_field_fir_number")}
                        value={firNumber}
                        onChangeText={setFirNumber}
                        placeholder={t("docgen_placeholder_fir_number")}
                      />
                      <FormInput
                        label={t("docgen_field_fir_year")}
                        value={firYear}
                        onChangeText={setFirYear}
                        placeholder={t("docgen_placeholder_fir_year")}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                {(documentType === "bail" ||
                  documentType === "anticipatory_bail" ||
                  documentType === "fir_quashing") &&
                  renderDynamicParagraphInput(
                    documentType === "fir_quashing"
                      ? t("docgen_field_quashing_grounds")
                      : t("docgen_field_bail_grounds"),
                    groundOfBailList,
                    setGroundOfBailList,
                    t("docgen_placeholder_bail_grounds")
                  )}
                {documentType === "anticipatory_bail" && (
                  <FormInput
                    label={t("docgen_field_apprehension_reason")}
                    value={adjournmentReason}
                    onChangeText={setAdjournmentReason}
                    placeholder={t("docgen_placeholder_apprehension_reason")}
                    multiline
                    numberOfLines={3}
                  />
                )}
              </View>
            )}

            {(documentType === "affidavit" ||
              documentType === "legal_notice" ||
              documentType === "caveat" ||
              documentType === "private_complaint" ||
              documentType === "rent_agreement" ||
              documentType === "power_of_attorney" ||
              documentType === "cheque_bounce") && (
              <View>
                {caseId && documentType === "affidavit" && (
                  <FormInput
                    label={t("docgen_field_deponent_name")}
                    value={clientName}
                    onChangeText={setClientName}
                    placeholder={t("docgen_placeholder_deponent_name")}
                  />
                )}
                {documentType === "affidavit" && (
                  <FormInput
                    label={t("docgen_field_deponent_age")}
                    value={deponentAge}
                    onChangeText={setDeponentAge}
                    placeholder={t("docgen_placeholder_deponent_age")}
                    keyboardType="numeric"
                  />
                )}
                <FormInput
                  label={
                    documentType === "rent_agreement"
                      ? t("docgen_field_landlord_addr")
                      : documentType === "power_of_attorney"
                        ? t("docgen_field_principal_addr")
                        : documentType === "cheque_bounce"
                          ? t("docgen_field_payee_addr")
                          : t("docgen_field_deponent_addr")
                  }
                  value={deponentAddress}
                  onChangeText={setDeponentAddress}
                  placeholder={t("docgen_placeholder_deponent_addr")}
                />
                <FormInput
                  label={
                    documentType === "rent_agreement"
                      ? t("docgen_field_tenant_addr")
                      : documentType === "power_of_attorney"
                        ? t("docgen_field_attorney_addr")
                        : documentType === "cheque_bounce"
                          ? t("docgen_field_drawer_addr")
                          : t("docgen_field_receiver_addr")
                  }
                  value={receiverAddress}
                  onChangeText={setReceiverAddress}
                  placeholder={t("docgen_placeholder_receiver_addr")}
                />
              </View>
            )}

            {(documentType === "affidavit" ||
              documentType === "injunction" ||
              documentType === "plaint" ||
              documentType === "private_complaint") &&
              renderDynamicParagraphInput(
                documentType === "plaint"
                  ? t("docgen_field_suit_facts")
                  : documentType === "private_complaint"
                    ? t("docgen_field_incident_facts")
                    : t("docgen_field_facts"),
                affidavitFactsList,
                setAffidavitFactsList,
                t("docgen_placeholder_facts")
              )}

            {documentType === "written_statement" && (
              <View>
                {renderDynamicParagraphInput(
                  t("docgen_field_prelim_objections"),
                  preliminaryObjectionsList,
                  setPreliminaryObjectionsList,
                  t("docgen_placeholder_prelim_objections")
                )}
                {renderDynamicParagraphInput(
                  t("docgen_field_reply_merits"),
                  replyOnMeritsList,
                  setReplyOnMeritsList,
                  t("docgen_placeholder_reply_merits")
                )}
              </View>
            )}

            {(documentType === "legal_notice" ||
              documentType === "cheque_bounce") &&
              renderDynamicParagraphInput(
                t("docgen_field_demand_text"),
                demandTextList,
                setDemandTextList,
                t("docgen_placeholder_demand_text")
              )}

            {(documentType === "injunction" ||
              documentType === "plaint" ||
              documentType === "execution" ||
              documentType === "arbitration_sec9" ||
              documentType === "consumer_complaint" ||
              documentType === "power_of_attorney") &&
              renderDynamicParagraphInput(
                documentType === "plaint"
                  ? t("docgen_field_suit_relief")
                  : documentType === "execution"
                    ? t("docgen_field_exec_relief")
                    : documentType === "arbitration_sec9"
                      ? t("docgen_field_interim_relief")
                      : documentType === "consumer_complaint"
                        ? t("docgen_field_consumer_relief")
                        : documentType === "power_of_attorney"
                          ? t("docgen_field_poa_powers")
                          : t("docgen_field_injunction_prayer"),
                restraintPrayerList,
                setRestraintPrayerList,
                t("docgen_placeholder_relief")
              )}

            {(documentType === "plaint" ||
              documentType === "execution" ||
              documentType === "cheque_bounce" ||
              documentType === "consumer_complaint" ||
              documentType === "rent_agreement") && (
              <FormInput
                label={
                  documentType === "plaint"
                    ? t("docgen_field_suit_valuation")
                    : documentType === "execution"
                      ? t("docgen_field_exec_decree_amount")
                      : documentType === "cheque_bounce"
                        ? t("docgen_field_cheque_amount")
                        : documentType === "consumer_complaint"
                          ? t("docgen_field_consumer_cost")
                          : t("docgen_field_monthly_rent")
                }
                value={valuation}
                onChangeText={setValuation}
                placeholder={t("docgen_placeholder_valuation")}
                keyboardType="numeric"
              />
            )}

            {documentType === "rejoinder" && (
              <FormInput
                label={t("docgen_field_rejoinder_reply")}
                value={replyPoints}
                onChangeText={setReplyPoints}
                placeholder={t("docgen_placeholder_rejoinder_reply")}
                multiline
                numberOfLines={5}
              />
            )}

            {(documentType === "execution" ||
              documentType === "private_complaint" ||
              documentType === "cheque_bounce" ||
              documentType === "arbitration_sec9" ||
              documentType === "rent_agreement") && (
              <FormInput
                label={
                  documentType === "execution"
                    ? t("docgen_field_exec_decree_date")
                    : documentType === "cheque_bounce"
                      ? t("docgen_field_cheque_date")
                      : documentType === "private_complaint"
                        ? t("docgen_field_incident_date")
                        : documentType === "arbitration_sec9"
                          ? t("docgen_field_arbitration_date")
                          : t("docgen_field_rent_date")
                }
                value={decreeDate}
                onChangeText={setDecreeDate}
                placeholder={t("docgen_placeholder_date")}
              />
            )}

            {(documentType === "execution" ||
              documentType === "rent_agreement") && (
              <FormInput
                label={
                  documentType === "execution"
                    ? t("docgen_field_exec_recovery")
                    : t("docgen_field_rent_deposit")
                }
                value={satisfactionDetails}
                onChangeText={setSatisfactionDetails}
                placeholder={
                  documentType === "execution"
                    ? t("docgen_placeholder_exec_recovery")
                    : t("docgen_placeholder_rent_deposit")
                }
              />
            )}

            {documentType === "cheque_bounce" && (
              <View>
                <FormInput
                  label={t("docgen_field_cheque_number")}
                  value={chequeNumber}
                  onChangeText={setChequeNumber}
                  placeholder={t("docgen_placeholder_cheque_number")}
                />
                <FormInput
                  label={t("docgen_field_dishonor_date")}
                  value={dishonorDate}
                  onChangeText={setDishonorDate}
                  placeholder={t("docgen_placeholder_dishonor_date")}
                />
              </View>
            )}

            {documentType === "rent_agreement" && (
              <FormInput
                label={t("docgen_field_rent_term")}
                value={termMonths}
                onChangeText={setTermMonths}
                placeholder={t("docgen_placeholder_rent_term")}
                keyboardType="numeric"
              />
            )}

            {(documentType === "rent_agreement" ||
              documentType === "power_of_attorney") && (
              <View>
                <FormInput
                  label={t("docgen_field_witness1")}
                  value={witness1}
                  onChangeText={setWitness1}
                  placeholder={t("docgen_placeholder_witness")}
                />
                <FormInput
                  label={t("docgen_field_witness2")}
                  value={witness2}
                  onChangeText={setWitness2}
                  placeholder={t("docgen_placeholder_witness")}
                />
              </View>
            )}

            {/* General Exemption & Consumer Complaint Info */}
            {documentType === "exemption" && (
              <FormInput
                label={t("docgen_field_exemption_reason")}
                value={groundOfBail}
                onChangeText={setGroundOfBail}
                placeholder={t("docgen_placeholder_exemption_reason")}
                multiline
                numberOfLines={3}
              />
            )}

            {documentType === "consumer_complaint" && (
              <View>
                <FormInput
                  label={t("docgen_field_deficiency_details")}
                  value={groundOfBail}
                  onChangeText={setGroundOfBail}
                  placeholder={t("docgen_placeholder_deficiency_details")}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}

            <View style={{ marginTop: 24 }}>
              <ActionButton
                title="Edit & Customize Draft"
                onPress={handleEditCustomize}
                type="primary"
                disabled={isGenerating || !advocateName}
                style={{ marginBottom: 12 }}
              />
              <ActionButton
                title={
                  isGenerating ? t("docgen_preparing") : "Quick PDF Export"
                }
                onPress={handleGeneratePdf}
                type="secondary"
                disabled={isGenerating || !advocateName}
                loading={isGenerating}
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Dynamic Rich-Text preview and formatting workspace */
        <View style={{ flex: 1 }}>
          <WebView
            ref={webViewRef}
            source={{ html: getOfflineEditorHtml(htmlContent) }}
            onMessage={handleEditorMessage}
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

          {/* Form Actions Overlay */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 12,
              backgroundColor: theme.colors.cardBackground,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 6,
                flexDirection: "row",
              }}
              onPress={() => {
                postMessageToWebView({ type: "requestSave" });
                saveCallbackRef.current = async (html) => {
                  setHtmlContent(html);
                  const boilerplateChanged = checkIfBoilerplateChanged(html);

                  const saveDraftRoutine = async () => {
                    try {
                      setIsSavingTemplate(true);
                      const idToSave = uuidv4();
                      const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, lineHeight, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace })} -->`;
                      const title = `${getFullDocTypesList().find((o) => o.value === documentType)?.label || "Draft"} - ${clientName || "Case"}`;

                      await saveDocumentDraft({
                        id: idToSave,
                        case_id: caseId ? Number(caseId) : null,
                        title,
                        template_type: documentType,
                        html_content: metadataComment + html,
                        is_custom_template: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      });

                      Alert.alert(
                        locale === "hi" ? "सफलता" : "Success",
                        locale === "hi"
                          ? "ड्राफ्ट सफलतापूर्वक सहेजा गया।"
                          : "Draft saved successfully.",
                        [{ text: "OK", onPress: () => navigation.goBack() }]
                      );
                    } catch (err) {
                      console.error("Failed to save draft:", err);
                      Alert.alert("Error", "Could not save draft to database.");
                    } finally {
                      setIsSavingTemplate(false);
                    }
                  };

                  if (boilerplateChanged) {
                    Alert.alert(
                      locale === "hi"
                        ? "टेम्पलेट सहेजें?"
                        : "Save Custom Template?",
                      locale === "hi"
                        ? "आपने इस टेम्पलेट के मूल पाठ में बदलाव किया है। क्या आप इसे भविष्य के दस्तावेज़ों के लिए एक कस्टम टेम्पलेट के रूप में सहेजना चाहेंगे?"
                        : "You have modified the boilerplate text of this template. Would you like to save this as a custom reusable template for future documents?",
                      [
                        {
                          text:
                            locale === "hi"
                              ? "हाँ, टेम्पलेट सहेजें"
                              : "Yes, Save as Template",
                          onPress: () => {
                            setCustomTemplateTitle("");
                            setIsSaveModalVisible(true);
                          },
                        },
                        {
                          text:
                            locale === "hi"
                              ? "नहीं, केवल ड्राफ्ट"
                              : "No, Just Save Draft",
                          onPress: saveDraftRoutine,
                        },
                        {
                          text: locale === "hi" ? "रद्द करें" : "Cancel",
                          style: "cancel",
                        },
                      ]
                    );
                  } else {
                    await saveDraftRoutine();
                  }
                };
              }}
            >
              <Ionicons
                name="save-outline"
                size={16}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>
                {locale === "hi" ? "ड्राफ्ट सहेजें" : "Save Draft"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.primary,
                borderWidth: 1,
                borderRadius: 8,
                paddingVertical: 12,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 6,
                flexDirection: "row",
              }}
              onPress={() => setIsPageSetupVisible(true)}
            >
              <Ionicons
                name="settings-outline"
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: theme.colors.primary,
                  fontWeight: "bold",
                  fontSize: 13,
                }}
              >
                Page Setup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: "#10B981",
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
              }}
              onPress={handleGeneratePdf}
              disabled={isGenerating}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>
                Export PDF
              </Text>
            </TouchableOpacity>
          </View>

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
                  {locale === "hi" ? "फ़ॉर्मेटिंग" : "Formatting"}
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
                  {locale === "hi" ? "लीगल असिस्ट" : "Legal Assist"}
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

          {/* Dynamic Formatting Toolbar */}
          {toolbarMode === "format" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-around",
                paddingVertical: 8,
                backgroundColor: theme.colors.inputBackground,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <TouchableOpacity
                style={[
                  { padding: 8, borderRadius: 6 },
                  editorState.bold && { backgroundColor: theme.colors.primary },
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
                  { padding: 8, borderRadius: 6 },
                  editorState.italic && {
                    backgroundColor: theme.colors.primary,
                  },
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
                  { padding: 8, borderRadius: 6 },
                  editorState.underline && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => triggerFormat("underline")}
              >
                <FontAwesome
                  name="underline"
                  size={18}
                  color={editorState.underline ? "#fff" : theme.colors.text}
                />
              </TouchableOpacity>

              <View
                style={{
                  width: 1,
                  height: 20,
                  backgroundColor: theme.colors.border,
                }}
              />

              <TouchableOpacity
                style={[
                  { padding: 8, borderRadius: 6 },
                  editorState.alignLeft && {
                    backgroundColor: theme.colors.primary,
                  },
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
                  { padding: 8, borderRadius: 6 },
                  editorState.alignCenter && {
                    backgroundColor: theme.colors.primary,
                  },
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
                  { padding: 8, borderRadius: 6 },
                  editorState.alignRight && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => triggerFormat("justifyRight")}
              >
                <FontAwesome
                  name="align-right"
                  size={18}
                  color={editorState.alignRight ? "#fff" : theme.colors.text}
                />
              </TouchableOpacity>

              <View
                style={{
                  width: 1,
                  height: 20,
                  backgroundColor: theme.colors.border,
                }}
              />

              <TouchableOpacity
                style={[
                  { padding: 8, borderRadius: 6 },
                  editorState.unorderedList && {
                    backgroundColor: theme.colors.primary,
                  },
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
                  { padding: 8, borderRadius: 6 },
                  editorState.orderedList && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => triggerFormat("insertOrderedList")}
              >
                <FontAwesome
                  name="list-ol"
                  size={18}
                  color={editorState.orderedList ? "#fff" : theme.colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => triggerFormat("insertParagraph")}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={theme.colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => triggerFormat("insertPageBreak")}
              >
                <Ionicons
                  name="layers-outline"
                  size={18}
                  color={theme.colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => {
                  setTourStepIndex(0);
                  setShowTour(true);
                }}
              >
                <Ionicons
                  name="help-circle-outline"
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
                <Text
                  style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Page Setup Modal */}
          <Modal
            visible={isPageSetupVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsPageSetupVisible(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: theme.colors.cardBackground,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: 20,
                  maxHeight: "80%",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: theme.colors.text,
                    }}
                  >
                    {locale === "hi" ? "पेज सेटअप" : "Page Setup"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsPageSetupVisible(false)}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>

                <View style={{ paddingVertical: 16 }}>
                  {/* Font selection */}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "bold",
                      color: theme.colors.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    {locale === "hi" ? "फ़ॉन्ट" : "Font Family"}
                  </Text>
                  <View style={{ flexDirection: "row", marginBottom: 16 }}>
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
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor:
                            font === item.value
                              ? theme.colors.primary
                              : theme.colors.border,
                          backgroundColor:
                            font === item.value
                              ? "rgba(59, 130, 246, 0.1)"
                              : "transparent",
                          alignItems: "center",
                          marginHorizontal: 4,
                        }}
                        onPress={() => {
                          setFont(item.value);
                          applyLayoutSettings(
                            item.value,
                            lineHeight,
                            pageSize,
                            topMargin,
                            bottomMargin,
                            leftMargin,
                            rightMargin,
                            letterheadSpace
                          );
                        }}
                      >
                        <Text
                          style={{
                            color:
                              font === item.value
                                ? theme.colors.primary
                                : theme.colors.text,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Line Spacing */}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "bold",
                      color: theme.colors.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    {locale === "hi" ? "लाइन स्पेसिंग" : "Line Spacing"}
                  </Text>
                  <View style={{ flexDirection: "row", marginBottom: 16 }}>
                    {[
                      { label: "1.15", value: "1.15" },
                      { label: "1.5", value: "1.5" },
                      { label: "2.0 (Double)", value: "2.0" },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.label}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor:
                            lineHeight === item.value
                              ? theme.colors.primary
                              : theme.colors.border,
                          backgroundColor:
                            lineHeight === item.value
                              ? "rgba(59, 130, 246, 0.1)"
                              : "transparent",
                          alignItems: "center",
                          marginHorizontal: 4,
                        }}
                        onPress={() => {
                          setLineHeight(item.value);
                          applyLayoutSettings(
                            font,
                            item.value,
                            pageSize,
                            topMargin,
                            bottomMargin,
                            leftMargin,
                            rightMargin,
                            letterheadSpace
                          );
                        }}
                      >
                        <Text
                          style={{
                            color:
                              lineHeight === item.value
                                ? theme.colors.primary
                                : theme.colors.text,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Paper Size */}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "bold",
                      color: theme.colors.textSecondary,
                      marginBottom: 8,
                      marginTop: 12,
                    }}
                  >
                    {locale === "hi" ? "पेज साइज" : "Paper Size"}
                  </Text>
                  <View style={{ flexDirection: "row", marginBottom: 16 }}>
                    {[
                      { label: "A4 Size", value: "a4" },
                      { label: "Legal Size", value: "legal" },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor:
                            pageSize === item.value
                              ? theme.colors.primary
                              : theme.colors.border,
                          backgroundColor:
                            pageSize === item.value
                              ? "rgba(59, 130, 246, 0.1)"
                              : "transparent",
                          alignItems: "center",
                          marginHorizontal: 4,
                        }}
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
                          style={{
                            color:
                              pageSize === item.value
                                ? theme.colors.primary
                                : theme.colors.text,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Margins Steppers */}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "bold",
                      color: theme.colors.textSecondary,
                      marginBottom: 8,
                      marginTop: 12,
                    }}
                  >
                    {locale === "hi" ? "दस्तावेज़ मार्जिन" : "Document Margins"}
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
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
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
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
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
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
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
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
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
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
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
                        <Ionicons
                          name="add"
                          size={14}
                          color={theme.colors.text}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Modal>

          {/* Save Custom Template Modal */}
          <Modal
            visible={isSaveModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsSaveModalVisible(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: theme.colors.cardBackground,
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: theme.colors.text,
                    marginBottom: 12,
                  }}
                >
                  Save Custom Template
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.colors.textSecondary,
                    marginBottom: 12,
                  }}
                >
                  Provide a name for this customized template format to reuse it
                  later:
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.text,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    marginBottom: 16,
                    fontSize: 14,
                  }}
                  value={customTemplateTitle}
                  onChangeText={setCustomTemplateTitle}
                  placeholder="e.g. My Bail Application Format"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <View
                  style={{ flexDirection: "row", justifyContent: "flex-end" }}
                >
                  <TouchableOpacity
                    style={{ padding: 12, marginRight: 8 }}
                    onPress={() => setIsSaveModalVisible(false)}
                  >
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontWeight: "600",
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: theme.colors.primary,
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={async () => {
                      if (!customTemplateTitle.trim()) {
                        Alert.alert(
                          "Error",
                          "Please provide a valid template name."
                        );
                        return;
                      }
                      setIsSavingTemplate(true);
                      try {
                        const templateId = uuidv4();
                        const metadataComment = `<!-- CD_LAYOUT:${JSON.stringify({ font, lineHeight, topMargin, bottomMargin, leftMargin, rightMargin, letterheadSpace })} -->`;
                        const contentWithMetadata =
                          metadataComment + htmlContent;

                        await saveDocumentDraft({
                          id: templateId,
                          case_id: null,
                          title: customTemplateTitle,
                          template_type: documentType,
                          html_content: contentWithMetadata,
                          is_custom_template: 1,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        });

                        const templates = await getDocumentDrafts(null, 1);
                        setCustomTemplates(templates);

                        Alert.alert(
                          "Success",
                          "Custom template saved successfully."
                        );
                        setIsSaveModalVisible(false);
                      } catch (err) {
                        console.error("Failed to save custom template:", err);
                        Alert.alert(
                          "Error",
                          "Could not save custom template to database."
                        );
                      } finally {
                        setIsSavingTemplate(false);
                      }
                    }}
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        Save Template
                      </Text>
                    )}
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
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.text}
                    />
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
                        style={{
                          fontSize: 12,
                          color: theme.colors.textSecondary,
                        }}
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
                  <TouchableOpacity
                    onPress={() => setIsVocabularyVisible(false)}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.text}
                    />
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
        </View>
      )}

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
                      ? locale === "hi" ? "समाप्त" : "Finish"
                      : locale === "hi" ? "आगे" : "Next"
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
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContentContainer: {
      flexGrow: 1,
      paddingBottom: 60,
    },
    formContainer: {
      padding: 16,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    activeTabButton: {
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.primary,
    },
    previewContainer: {
      flex: 1,
      backgroundColor: "#1E293B", // Dark backdrop to emphasize the legal paper
      padding: 16,
    },
    legalPageSheet: {
      backgroundColor: "#FDFBF7", // Legal yellow-white paper backing
      minHeight: Dimensions.get("window").height * 0.7,
      borderRadius: 4,
      padding: 24,
      paddingLeft: 44, // Generous left padding to clear the red margin line
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
      position: "relative",
    },
    legalRedMarginLine: {
      position: "absolute",
      left: 36,
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: "#F87171", // Left red margin line
    },
    legalDraftText: {
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", // Times-like legal font
      fontSize: 14,
      lineHeight: 24,
      color: "#000000",
      textAlign: "justify",
      whiteSpace: "pre-wrap",
    },
    floatingPreviewButton: {
      marginTop: 16,
    },
    langButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 8,
      marginRight: 8,
    },
    activeLangButton: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + "15",
    },
    langText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    activeLangText: {
      color: theme.colors.primary,
      fontWeight: "bold",
    },
    categoryGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    categoryCard: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    selectedCategoryCard: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    categoryCardText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    selectedCategoryCardText: {
      color: "#ffffff",
    },
  });

export default GenerateDocumentScreen;
