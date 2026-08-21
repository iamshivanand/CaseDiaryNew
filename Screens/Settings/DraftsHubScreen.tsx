// Screens/Settings/DraftsHubScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useNavigation,
  useIsFocused,
  useRoute,
} from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import * as db from "../../DataBase";
import { CaseWithDetails, DocumentDraft } from "../../DataBase";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { useTranslation } from "../../Providers/LanguageProvider";
import { compileLegalDocumentHtml } from "../../utils/documentTemplates";
import { createNamedPdfFile, shareNamedPdf } from "../../utils/fileShareHelper";
import ActionButton from "../CommonComponents/ActionButton";
import { SkeletonList, SkeletonTemplateGrid } from "../CommonComponents/SkeletonLoader";

const documentTypeColors: { [key: string]: string } = {
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

const BUILT_IN_TEMPLATES = [
  {
    id: "built_in_blank_page",
    template_type: "blank_page",
    title: "Blank Custom Document",
    titleHi: "कोरा दस्तावेज़ (शुरुआत से)",
    category: "common",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_vakalatnama",
    template_type: "vakalatnama",
    title: "Vakalatnama",
    titleHi: "वकालतनामा (प्राधिकार पत्र)",
    category: "common",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_adjournment",
    template_type: "adjournment",
    title: "Adjournment Application",
    titleHi: "स्थगन प्रार्थना पत्र",
    category: "common",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_bail",
    template_type: "bail",
    title: "Bail Application (Sec 439)",
    titleHi: "नियमित जमानत आवेदन (धारा 439)",
    category: "criminal",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_affidavit",
    template_type: "affidavit",
    title: "Supporting Affidavit",
    titleHi: "शपथ पत्र (हलफनामा)",
    category: "common",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_written_statement",
    template_type: "written_statement",
    title: "Written Statement",
    titleHi: "लिखित कथन (जवाब दावा)",
    category: "civil",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_legal_notice",
    template_type: "legal_notice",
    title: "Legal Demand Notice",
    titleHi: "विधिक मांग नोटिस",
    category: "common",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_caveat",
    template_type: "caveat",
    title: "Caveat Petition",
    titleHi: "कैविएट याचिका (धारा 148क)",
    category: "civil",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_injunction",
    template_type: "injunction",
    title: "Temporary Injunction",
    titleHi: "अस्थाई निषेधाज्ञा (आदेश 39)",
    category: "civil",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_plaint",
    template_type: "plaint",
    title: "Plaint (Civil Suit)",
    titleHi: "वाद पत्र (दीवानी दावा)",
    category: "civil",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_rejoinder",
    template_type: "rejoinder",
    title: "Replication / Rejoinder",
    titleHi: "प्रत्युत्तर (रिजॉइंडर)",
    category: "civil",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_execution",
    template_type: "execution",
    title: "Execution Petition",
    titleHi: "निष्पादन याचिका (आदेश 21)",
    category: "civil",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_anticipatory_bail",
    template_type: "anticipatory_bail",
    title: "Anticipatory Bail (Sec 438)",
    titleHi: "अग्रिम जमानत (धारा 438)",
    category: "criminal",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_private_complaint",
    template_type: "private_complaint",
    title: "Private Complaint (Sec 200)",
    titleHi: "निजी परिवाद (धारा 200)",
    category: "criminal",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_fir_quashing",
    template_type: "fir_quashing",
    title: "FIR Quashing (Sec 482)",
    titleHi: "प्राथमिकी निरस्तीकरण (धारा 482)",
    category: "criminal",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_exemption",
    template_type: "exemption",
    title: "Exemption (Sec 317 CrPC)",
    titleHi: "हाजिरी माफी आवेदन (धारा 317)",
    category: "common",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_cheque_bounce",
    template_type: "cheque_bounce",
    title: "Cheque Bounce Notice",
    titleHi: "चेक अनादर नोटिस (धारा 138)",
    category: "commercial",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_arbitration_sec9",
    template_type: "arbitration_sec9",
    title: "Arbitration Sec 9",
    titleHi: "मध्यस्थता अंतरिम राहत (धारा 9)",
    category: "commercial",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_consumer_complaint",
    template_type: "consumer_complaint",
    title: "Consumer Complaint",
    titleHi: "उपभोक्ता परिवाद",
    category: "commercial",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_rent_agreement",
    template_type: "rent_agreement",
    title: "Rent Agreement",
    titleHi: "किरायानामा (रेंट एग्रीमेंट)",
    category: "commercial",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_power_of_attorney",
    template_type: "power_of_attorney",
    title: "Power of Attorney",
    titleHi: "मुख्तारनामा (पावर ऑफ अटॉर्नी)",
    category: "commercial",
    is_custom_template: 0,
    isBuiltIn: true,
  },
];

const getTemplateLabel = (type: string): string => {
  switch (type) {
    case "blank_page":
      return "Blank Document";
    case "vakalatnama":
      return "Vakalatnama";
    case "adjournment":
      return "Adjournment";
    case "bail":
      return "Bail Application";
    case "affidavit":
      return "Affidavit";
    case "written_statement":
      return "Written Statement";
    case "legal_notice":
      return "Legal Notice";
    case "caveat":
      return "Caveat Petition";
    case "injunction":
      return "Temporary Injunction";
    case "plaint":
      return "Plaint (Civil Suit)";
    case "rejoinder":
      return "Replication / Rejoinder";
    case "execution":
      return "Execution Petition";
    case "anticipatory_bail":
      return "Anticipatory Bail";
    case "private_complaint":
      return "Private Complaint";
    case "fir_quashing":
      return "FIR Quashing";
    case "exemption":
      return "Exemption Application";
    case "cheque_bounce":
      return "Cheque Bounce Notice";
    case "arbitration_sec9":
      return "Arbitration Sec 9";
    case "consumer_complaint":
      return "Consumer Complaint";
    case "rent_agreement":
      return "Rent Agreement";
    case "power_of_attorney":
      return "Power of Attorney";
    default:
      return "Draft";
  }
};

const getCategoryForTemplateType = (type: string): string => {
  switch (type) {
    case "plaint":
    case "written_statement":
    case "caveat":
    case "injunction":
    case "rejoinder":
    case "execution":
      return "civil";

    case "bail":
    case "anticipatory_bail":
    case "private_complaint":
    case "fir_quashing":
      return "criminal";

    case "cheque_bounce":
    case "arbitration_sec9":
    case "consumer_complaint":
    case "rent_agreement":
    case "power_of_attorney":
      return "commercial";

    case "vakalatnama":
    case "adjournment":
    case "affidavit":
    case "exemption":
    case "legal_notice":
      return "common";

    default:
      return "common";
  }
};

const categories = [
  { label: "All Categories", value: "all" },
  { label: "Civil (CPC)", value: "civil" },
  { label: "Criminal (CrPC)", value: "criminal" },
  { label: "Commercial / ADR", value: "commercial" },
  { label: "Common Docs", value: "common" },
];

const DraftsHubScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { theme } = useContext(ThemeContext);
  const { locale } = useTranslation();
  const styles = getStyles(theme);

  const initialTab = route.params?.tab || route.params?.initialTab || "drafts";
  const [activeTab, setActiveTab] = useState<"drafts" | "templates">(initialTab);
  const [templateLanguage, setTemplateLanguage] = useState<"en" | "hi">(
    locale === "hi" ? "hi" : "en"
  );
  const [drafts, setDrafts] = useState<DocumentDraft[]>(
    initialTab === "templates" ? (BUILT_IN_TEMPLATES as any) : []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [draftFilterChip, setDraftFilterChip] = useState<"all" | "linked" | "standalone" | "recent">("all");
  const [actionMenuDraft, setActionMenuDraft] = useState<DocumentDraft | null>(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(initialTab !== "templates");

  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const PAGE_SIZE = 20;

  // Attach Modal state
  const [isAttachModalVisible, setIsAttachModalVisible] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<DocumentDraft | null>(
    null
  );
  const [cases, setCases] = useState<CaseWithDetails[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseWithDetails[]>([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);

  // Auto-open attach modal if navigated from Export screen with action = "attach"
  useEffect(() => {
    if (
      isFocused &&
      route.params?.action === "attach" &&
      route.params?.draftId
    ) {
      const attachId = route.params.draftId;
      // Immediately clear route params so it won't repeatedly re-trigger on subsequent focuses
      navigation.setParams({ action: undefined, draftId: undefined });
      db.getDocumentDraftById(attachId).then((found) => {
        if (found) {
          openAttachModal(found);
        }
      });
    }
  }, [isFocused, route.params]);

  const getFormattedHtmlForPrint = (rawHtml?: string) => {
    const html = rawHtml || "<div><p>Document Content</p></div>";
    let font = "Times New Roman";
    let lineHeight = "1.6";
    let pageSize: "a4" | "legal" = "legal";
    let topMargin = 24;
    let bottomMargin = 24;
    let leftMargin = 55;
    let rightMargin = 24;
    let letterheadSpace = 0;
    let cleanedHtml = html;

    const metadataMatch = html ? html.match(/<!-- CD_LAYOUT:(.*?) -->/) : null;
    if (metadataMatch) {
      try {
        const layout = JSON.parse(metadataMatch[1]);
        if (layout.font) font = layout.font;
        if (layout.lineHeight) lineHeight = layout.lineHeight;
        if (layout.pageSize) pageSize = layout.pageSize;
        if (layout.topMargin !== undefined) topMargin = layout.topMargin;
        if (layout.bottomMargin !== undefined)
          bottomMargin = layout.bottomMargin;
        if (layout.leftMargin !== undefined) leftMargin = layout.leftMargin;
        if (layout.rightMargin !== undefined) rightMargin = layout.rightMargin;
        if (layout.letterheadSpace !== undefined)
          letterheadSpace = layout.letterheadSpace;
        cleanedHtml = html.replace(/<!-- CD_LAYOUT:(.*?) -->/g, "");
      } catch (e) {
        console.error("Failed to parse layout metadata in DraftsHub:", e);
      }
    }

    const effectiveTopMargin = (topMargin || 24) + (letterheadSpace || 0);
    const pageCssSize = pageSize === "legal" ? "8.5in 14in" : "A4 portrait";
    const cleanBodyHtml = cleanedHtml
      .replace(/<div id="red-margin-line".*?<\/div>/g, "")
      .replace(/<div id="margin-guide-overlay".*?<\/div>/g, "");

    return `
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
            page-break-before: always;
            break-before: page;
            border: none;
            height: 0;
            margin: 0;
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
  };

  const handleTabChange = (newTab: "drafts" | "templates") => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setSearchQuery("");
    setSelectedCategory("all");
    setPage(0);
    setHasMore(true);
    if (newTab === "templates") {
      setDrafts(BUILT_IN_TEMPLATES as any);
      setIsLoading(false);
    } else {
      setDrafts([]);
      setIsLoading(true);
    }
  };

  // Load drafts and templates from SQLite
  const loadDrafts = async (resetPage: boolean = false) => {
    const isSearching = searchQuery.trim() !== "";
    const targetPage = resetPage ? 0 : page;

    if (targetPage === 0) {
      if (activeTab === "drafts" && drafts.length === 0) {
        setIsLoading(true);
      }
    } else if (!isSearching) {
      setIsFetchingNextPage(true);
    }

    try {
      if (activeTab === "templates") {
        const limit = isSearching ? null : PAGE_SIZE;
        const offset = isSearching ? null : targetPage * PAGE_SIZE;

        // Fetch custom templates metadata-only (excludeHtml = true)
        const results = await db.getDocumentDrafts(
          null,
          1,
          true,
          limit,
          offset
        );

        const builtIn =
          targetPage === 0 || isSearching ? BUILT_IN_TEMPLATES : [];
        const mappedResults = results.map((r) => ({ ...r, isBuiltIn: false }));
        const combined = [...builtIn, ...mappedResults];

        if (targetPage === 0 || isSearching) {
          setDrafts(combined as any);
        } else {
          setDrafts((prev) => [...prev, ...(mappedResults as any)]);
        }

        setHasMore(!isSearching && results.length === PAGE_SIZE);
        if (!isSearching) {
          setPage(targetPage + 1);
        }
      } else {
        const limit = isSearching ? null : PAGE_SIZE;
        const offset = isSearching ? null : targetPage * PAGE_SIZE;

        // Fetch drafts metadata-only (excludeHtml = true), passing undefined for caseId to get all drafts
        const results = await db.getDocumentDrafts(
          undefined,
          0,
          true,
          limit,
          offset
        );

        if (targetPage === 0 || isSearching) {
          setDrafts(results);
        } else {
          setDrafts((prev) => [...prev, ...results]);
        }

        setHasMore(!isSearching && results.length === PAGE_SIZE);
        if (!isSearching) {
          setPage(targetPage + 1);
        }
      }
    } catch (error) {
      console.error("Failed to load drafts from SQLite database:", error);
      Alert.alert("Error", "Could not load drafts from database.");
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
    }
  };

  const loadMoreDrafts = () => {
    if (
      isLoading ||
      isFetchingNextPage ||
      !hasMore ||
      searchQuery.trim() !== ""
    )
      return;
    loadDrafts(false);
  };

  // Reload drafts on focus, tab change, or search changes
  useEffect(() => {
    if (isFocused) {
      setPage(0);
      setHasMore(true);
      loadDrafts(true);
    }
  }, [isFocused, activeTab, searchQuery]);

  // Filter drafts based on search query and category with useMemo for optimal rendering performance
  const filteredDrafts = useMemo(() => {
    let filtered = drafts;

    if (activeTab === "templates" && selectedCategory !== "all") {
      filtered = filtered.filter((item) => {
        // @ts-ignore
        const cat =
          item.category || getCategoryForTemplateType(item.template_type);
        return cat === selectedCategory;
      });
    }

    if (activeTab === "drafts" && draftFilterChip !== "all") {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (draftFilterChip === "linked") {
        filtered = filtered.filter((d) => !!d.case_id);
      } else if (draftFilterChip === "standalone") {
        filtered = filtered.filter((d) => !d.case_id);
      } else if (draftFilterChip === "recent") {
        filtered = filtered.filter((d) => {
          const t = new Date(d.updated_at || d.created_at).getTime();
          return !isNaN(t) && now - t < oneDay;
        });
      }
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (draft) =>
          draft.title.toLowerCase().includes(query) ||
          getTemplateLabel(draft.template_type).toLowerCase().includes(query) ||
          (draft.case_title && draft.case_title.toLowerCase().includes(query)) ||
          (draft.client_name && draft.client_name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [drafts, activeTab, selectedCategory, draftFilterChip, searchQuery]);

  // Load cases from Database for Attach Modal
  const loadCases = async () => {
    try {
      const allCases = await db.getCases(null, -1, 0, { status: "Active" });
      setCases(allCases);
      setFilteredCases(allCases);
    } catch (error) {
      console.error("Failed to load cases for attach flow:", error);
    }
  };

  // Filter cases in modal
  useEffect(() => {
    if (caseSearchQuery.trim() === "") {
      setFilteredCases(cases);
    } else {
      const query = caseSearchQuery.toLowerCase();
      const filtered = cases.filter(
        (c) =>
          c.CaseTitle?.toLowerCase().includes(query) ||
          c.ClientName?.toLowerCase().includes(query) ||
          c.case_number?.toLowerCase().includes(query)
      );
      setFilteredCases(filtered);
    }
  }, [caseSearchQuery, cases]);

  // Open PDF directly in PdfViewer
  const handleOpenPdf = async (draft: DocumentDraft) => {
    try {
      setIsLoading(true);
      let content = draft.html_content;
      if (!content && draft.id) {
        const fullDraft = await db.getDocumentDraftById(draft.id);
        if (fullDraft) {
          content = fullDraft.html_content;
        }
      }
      const rawHtml = content || "";
      const formattedHtml = getFormattedHtmlForPrint(rawHtml);
      const isLegal = rawHtml.includes('"pageSize":"legal"');
      const { uri } = await Print.printToFileAsync({
        html: formattedHtml,
        width: isLegal ? 612 : 595,
        height: isLegal ? 1008 : 842,
      });

      setIsLoading(false);
      // @ts-ignore
      navigation.navigate("PdfViewer", {
        pdfUri: uri,
        title: draft.title || "PDF Document",
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Error opening PDF draft:", error);
      Alert.alert("Error", "Failed to open PDF document.");
    }
  };

  // View/Share Draft (Compiles HTML on-the-fly to PDF)
  const handleShareDraft = async (draft: DocumentDraft) => {
    try {
      setIsLoading(true);
      let content = draft.html_content;
      if (!content && draft.id) {
        const fullDraft = await db.getDocumentDraftById(draft.id);
        if (fullDraft) {
          content = fullDraft.html_content;
        }
      }
      const rawHtml = content || "";
      const formattedHtml = getFormattedHtmlForPrint(rawHtml);
      const isLegal = rawHtml.includes('"pageSize":"legal"');
      const { uri } = await Print.printToFileAsync({
        html: formattedHtml,
        width: isLegal ? 612 : 595,
        height: isLegal ? 1008 : 842,
      });

      const namedUri = await createNamedPdfFile(uri, draft.title);

      setIsLoading(false);
      Alert.alert(draft.title, "Choose an action for this document:", [
        {
          text: "Open in App",
          onPress: () => {
            // @ts-ignore
            navigation.navigate("PdfViewer", {
              pdfUri: namedUri,
              title: draft.title,
            });
          },
        },
        {
          text: "Share PDF",
          onPress: async () => {
            await shareNamedPdf(namedUri, draft.title, draft.title);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } catch (error) {
      setIsLoading(false);
      console.error("Error sharing draft:", error);
      Alert.alert("Error", "Failed to generate PDF document.");
    }
  };

  // Delete Draft
  const handleDeleteDraft = (draft: DocumentDraft) => {
    if ((draft as any).isBuiltIn) {
      Alert.alert("Notice", "Standard built-in templates cannot be deleted.");
      return;
    }
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to permanently delete this ${activeTab === "templates" ? "template" : "draft"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              // Optimistically update local state immediately so item vanishes right away
              setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
              await db.deleteDocumentDraft(draft.id);
              await loadDrafts(true);
            } catch (error) {
              console.error("Error deleting draft:", error);
              Alert.alert("Error", "Failed to delete the draft document.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Open Attach Modal
  const openAttachModal = (draft: DocumentDraft) => {
    setSelectedDraft(draft);
    setCaseSearchQuery("");
    loadCases();
    setIsAttachModalVisible(true);
  };

  // Attach Draft to Case
  const handleAttachToCase = async (selectedCase: CaseWithDetails) => {
    if (!selectedDraft) return;

    setIsAttaching(true);
    try {
      const userIdStr = await AsyncStorage.getItem("@user_id");
      const userId = userIdStr ? parseInt(userIdStr, 10) : null;

      // 1. Fetch full draft with html_content if missing
      let htmlContent = selectedDraft.html_content;
      if (!htmlContent && selectedDraft.id) {
        const fullDraft = await db.getDocumentDraftById(selectedDraft.id);
        if (fullDraft) {
          htmlContent = fullDraft.html_content;
        }
      }
      const rawHtml = htmlContent || "<div><p>Document Content</p></div>";

      // 2. Compile PDF dynamically to a temp file using exact court page specs
      const formattedHtml = getFormattedHtmlForPrint(rawHtml);
      const isLegal = rawHtml.includes('"pageSize":"legal"');
      const { uri } = await Print.printToFileAsync({
        html: formattedHtml,
        width: isLegal ? 612 : 595,
        height: isLegal ? 1008 : 842,
      });
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSize = fileInfo.exists ? fileInfo.size : null;

      // 3. Upload/Save PDF copy in Case attachments
      const successId = await db.uploadCaseDocument({
        originalFileName: `${getTemplateLabel(selectedDraft.template_type)}_${Date.now()}.pdf`,
        fileType: "application/pdf",
        fileUri: uri,
        caseId: selectedCase.id,
        userId,
        fileSize,
      });

      if (successId) {
        // 4. Associate the editable draft in SQLite with this case
        await db.saveDocumentDraft({
          ...selectedDraft,
          html_content: rawHtml,
          case_id: selectedCase.id,
          updated_at: new Date().toISOString(),
        });

        // 5. Optimistically update local state so the case badge renders live immediately
        const updatedCaseTitle =
          selectedCase.CaseTitle || selectedCase.ClientName;
        const updatedCaseId = selectedCase.id;
        const updatedClientName = selectedCase.ClientName;
        const updatedCaseNumber = selectedCase.case_number;

        setDrafts((prev) =>
          prev.map((d) =>
            d.id === selectedDraft.id
              ? {
                  ...d,
                  case_id: updatedCaseId,
                  case_title: updatedCaseTitle,
                  client_name: updatedClientName,
                  case_number: updatedCaseNumber,
                }
              : d
          )
        );

        setIsAttachModalVisible(false);
        Alert.alert(
          "Success",
          `Document successfully attached to case: ${updatedCaseTitle}`,
          [{ text: "OK", onPress: () => loadDrafts(true) }]
        );
      } else {
        Alert.alert("Error", "Could not copy document to case files.");
      }
    } catch (error) {
      console.error("Failed to attach draft to case:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred while attaching draft."
      );
    } finally {
      setIsAttaching(false);
    }
  };

  // Unlink Draft from Case
  const handleUnlinkCase = async (draft: DocumentDraft) => {
    if (!draft.case_id) return;
    Alert.alert(
      "Unlink Case",
      `Are you sure you want to unlink this draft from case "${draft.case_title || draft.client_name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const fullDraft = await db.getDocumentDraftById(draft.id);
              if (fullDraft) {
                await db.saveDocumentDraft({
                  ...fullDraft,
                  case_id: null,
                  updated_at: new Date().toISOString(),
                });
              }
              setDrafts((prev) =>
                prev.map((d) =>
                  d.id === draft.id
                    ? {
                        ...d,
                        case_id: null,
                        case_title: undefined,
                        client_name: undefined,
                        case_number: undefined,
                      }
                    : d
                )
              );
              Alert.alert("Success", "Draft unlinked from case successfully.");
            } catch (err) {
              console.error("Error unlinking draft from case:", err);
              Alert.alert("Error", "Could not unlink draft from case.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenEditor = async (draft: DocumentDraft) => {
    try {
      let fullHtml = draft.html_content;
      let fullCaseId = draft.case_id;
      let fullTitle = draft.title;
      let fullType = draft.template_type;

      const fullDraft = await db.getDocumentDraftById(draft.id);
      if (fullDraft) {
        fullHtml = fullDraft.html_content || fullHtml;
        fullCaseId = fullDraft.case_id !== undefined ? fullDraft.case_id : fullCaseId;
        fullTitle = fullDraft.title || fullTitle;
        fullType = fullDraft.template_type || fullType;
      }

      // @ts-ignore
      navigation.navigate("TiptapEditDraft", {
        draftId: draft.id,
        caseId: fullCaseId,
        initialHtml: fullHtml || "",
        templateType: fullType || "draft",
        title: fullTitle,
      });
    } catch (err) {
      console.error("Error opening draft for edit:", err);
      // @ts-ignore
      navigation.navigate("TiptapEditDraft", {
        draftId: draft.id,
        caseId: draft.case_id,
        initialHtml: draft.html_content || "",
        templateType: draft.template_type || "draft",
        title: draft.title,
      });
    }
  };

  const isRecentDraft = (dateStr?: string) => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return !isNaN(t) && Date.now() - t < 24 * 60 * 60 * 1000;
  };

  const renderDraftItem = ({ item }: { item: DocumentDraft }) => {
    const color =
      documentTypeColors[item.template_type] || theme.colors.primary;
    const rawDate = item.updated_at || item.created_at;
    let dateStr = "";
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const datePart = d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const timePart = d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
          dateStr = `${datePart} • ${timePart}`;
        }
      } catch (e) {
        dateStr = String(rawDate);
      }
    }
    const isRecent = isRecentDraft(rawDate);

    return (
      <TouchableOpacity
        style={[styles.draftCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
        activeOpacity={0.9}
        onPress={() => handleOpenEditor(item)}
      >
        {/* Top Header Strip: Badges & Three-Dots Menu */}
        <View style={styles.cardTopRow}>
          <View style={styles.badgeCluster}>
            <View style={[styles.typeBadge, { backgroundColor: `${color}20` }]}>
              <Text style={[styles.typeBadgeText, { color }]}>
                {getTemplateLabel(item.template_type)}
              </Text>
            </View>

            {item.case_title || item.client_name ? (
              <View style={[styles.caseBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Ionicons
                  name="briefcase-outline"
                  size={12}
                  color={theme.colors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.caseBadgeText, { color: theme.colors.primary }]}
                  numberOfLines={1}
                >
                  {item.case_title || item.client_name}
                </Text>
              </View>
            ) : (
              <View style={[styles.caseBadge, { backgroundColor: `${theme.colors.border}30` }]}>
                <Text style={[styles.caseBadgeText, { color: theme.colors.textSecondary }]}>
                  Standalone
                </Text>
              </View>
            )}

            {isRecent && (
              <View style={styles.recentDotBadge}>
                <View style={styles.recentDot} />
                <Text style={styles.recentDotText}>Active</Text>
              </View>
            )}
          </View>

          {/* Three-Dots Menu Button */}
          <TouchableOpacity
            style={styles.moreMenuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              setActionMenuDraft(item);
              setIsActionMenuVisible(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Center Section: Miniature Page Graphic & Title/Date */}
        <View style={styles.cardCenterRow}>
          {/* Miniature Page Graphic */}
          <View style={styles.parchmentThumbnail}>
            <View style={styles.parchmentMarginLine} />
            <View style={styles.parchmentLines}>
              <View style={[styles.dummyLine, { width: "80%" }]} />
              <View style={[styles.dummyLine, { width: "90%" }]} />
              <View style={[styles.dummyLine, { width: "65%" }]} />
              <View style={[styles.dummyLine, { width: "85%" }]} />
              <View style={[styles.dummyLine, { width: "70%" }]} />
            </View>
            <View style={[styles.parchmentPdfTag, { backgroundColor: color }]}>
              <Text style={styles.parchmentPdfTagText}>PDF</Text>
            </View>
          </View>

          {/* Title & Metadata */}
          <View style={styles.cardTitleColumn}>
            <Text style={styles.draftTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.draftDate}>{dateStr}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Clean Action Dock */}
        <View style={styles.actionDock}>
          <TouchableOpacity
            style={[styles.equalActionBtn, { backgroundColor: "#2563eb", borderColor: "#2563eb" }]}
            onPress={() => handleOpenEditor(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={13} color="#ffffff" style={{ marginRight: 3 }} />
            <Text style={[styles.equalActionBtnText, { color: "#ffffff" }]} numberOfLines={1} ellipsizeMode="tail">
              Edit
            </Text>
          </TouchableOpacity>

          {/* Show Link button on main card only for standalone drafts */}
          {!item.case_id && (
            <TouchableOpacity
              style={[
                styles.equalActionBtn,
                {
                  borderColor: `${theme.colors.success}80`,
                  backgroundColor: `${theme.colors.success}12`,
                },
              ]}
              onPress={() => openAttachModal(item)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="link-outline"
                size={13}
                color={theme.colors.success}
                style={{ marginRight: 3 }}
              />
              <Text
                style={[
                  styles.equalActionBtnText,
                  {
                    color: theme.colors.success,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Link
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.equalActionBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }]}
            onPress={() => handleOpenPdf(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="eye-outline" size={13} color={theme.colors.primary} style={{ marginRight: 3 }} />
            <Text style={[styles.equalActionBtnText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">
              PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.equalActionBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }]}
            onPress={() => handleShareDraft(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={13} color={theme.colors.primary} style={{ marginRight: 3 }} />
            <Text style={[styles.equalActionBtnText, { color: theme.colors.primary }]} numberOfLines={1} ellipsizeMode="tail">
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDraftListItem = ({ item }: { item: DocumentDraft }) => {
    const color =
      documentTypeColors[item.template_type] || theme.colors.primary;
    const rawDate = item.updated_at || item.created_at;
    let dateStr = "";
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      } catch (e) {
        dateStr = String(rawDate);
      }
    }

    return (
      <TouchableOpacity
        style={[styles.draftListRow, { borderLeftColor: color, borderLeftWidth: 3.5 }]}
        activeOpacity={0.85}
        onPress={() => handleOpenEditor(item)}
      >
        <View style={[styles.listRowIconBg, { backgroundColor: `${color}15` }]}>
          <Ionicons name="document-text-outline" size={20} color={color} />
        </View>

        <View style={styles.listRowContent}>
          <Text style={styles.listRowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.listRowSubtitle} numberOfLines={1}>
            {item.case_title || item.client_name ? `Case: ${item.case_title || item.client_name} • ` : ""}{dateStr}
          </Text>
        </View>

        <View style={styles.listRowActions}>
          {!item.case_id && (
            <TouchableOpacity
              style={[styles.listActionBtn, { backgroundColor: `${theme.colors.success}18` }]}
              onPress={() => openAttachModal(item)}
            >
              <Ionicons
                name="link-outline"
                size={15}
                color={theme.colors.success}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.listActionBtn, { backgroundColor: "#2563eb12" }]}
            onPress={() => handleOpenEditor(item)}
          >
            <Ionicons name="create-outline" size={15} color="#2563eb" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.listActionBtn}
            onPress={() => {
              setActionMenuDraft(item);
              setIsActionMenuVisible(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTemplateGridItem = ({ item }: { item: any }) => {
    const color =
      documentTypeColors[item.template_type] || theme.colors.primary;
    const displayTitle =
      templateLanguage === "hi" ? (item.titleHi || item.title) : item.title;
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
          let compiledHtml = "";
          if (item.isBuiltIn) {
            try {
              const advocateName =
                (await AsyncStorage.getItem("@advocate_name")) || "";
              const advocateEnrollment =
                (await AsyncStorage.getItem("@advocate_enrollment")) || "";
              const advocateAddress =
                (await AsyncStorage.getItem("@advocate_address")) || "";
              compiledHtml = compileLegalDocumentHtml(
                item.template_type,
                {
                  advocateName,
                  advocateEnrollment,
                  advocateAddress,
                },
                templateLanguage === "hi"
              );
            } catch (e) {
              console.error("Failed to compile template:", e);
            }
          } else {
            try {
              const draft = await db.getDocumentDraftById(item.id);
              if (draft) compiledHtml = draft.html_content;
            } catch (err) {
              console.error("Failed to load template draft:", err);
            }
          }

          // @ts-ignore
          navigation.navigate("TiptapEditDraft", {
            templateType: item.template_type,
            draftId: item.isBuiltIn ? undefined : item.id,
            initialHtml: compiledHtml,
            language: templateLanguage,
            title: `${displayTitle} - Draft`,
          });
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
          {displayTitle}
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
            {item.isBuiltIn
              ? templateLanguage === "hi"
                ? "मानक"
                : "Built-in"
              : templateLanguage === "hi"
              ? "कस्टम"
              : "Custom"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCaseItem = ({ item }: { item: CaseWithDetails }) => {
    return (
      <TouchableOpacity
        style={styles.caseItemCard}
        onPress={() => handleAttachToCase(item)}
        activeOpacity={0.85}
      >
        <View style={styles.caseItemInfo}>
          <Text style={styles.caseItemTitle} numberOfLines={1}>
            {item.CaseTitle ||
              `${item.ClientName} vs ${item.OppositeParty || "Respondent"}`}
          </Text>
          <Text style={styles.caseItemSub}>
            No: {item.case_number || "N/A"} | Court: {item.court_name || "N/A"}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Segment Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "drafts" && styles.activeTabButton,
          ]}
          onPress={() => handleTabChange("drafts")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "drafts" && styles.activeTabText,
            ]}
          >
            Case Drafts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "templates" && styles.activeTabButton,
          ]}
          onPress={() => handleTabChange("templates")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "templates" && styles.activeTabText,
            ]}
          >
            Reusable Templates
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder={
              activeTab === "templates"
                ? "Search templates..."
                : "Search drafts..."
            }
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* View Mode Toggle (Grid vs List) */}
        {activeTab === "drafts" && (
          <TouchableOpacity
            style={styles.viewModeToggleBtn}
            onPress={() => setViewMode((prev) => (prev === "grid" ? "list" : "grid"))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={viewMode === "grid" ? "list-outline" : "grid-outline"}
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Filter Chips for Case Drafts */}
      {activeTab === "drafts" && (
        <View style={styles.filterChipsBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContent}
          >
            {[
              { label: "All Drafts", value: "all" },
              { label: "Linked to Cases", value: "linked" },
              { label: "Standalone", value: "standalone" },
              { label: "Recent (< 24h)", value: "recent" },
            ].map((chip) => {
              const isSelected = draftFilterChip === chip.value;
              return (
                <TouchableOpacity
                  key={chip.value}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipSelected,
                  ]}
                  onPress={() => setDraftFilterChip(chip.value as any)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextSelected,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {activeTab === "templates" && (
        <View
          style={{
            height: 48,
            backgroundColor: theme.colors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              gap: 8,
            }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.value;
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
                  onPress={() => setSelectedCategory(cat.value)}
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
      )}

      {isLoading ? (
        activeTab === "templates" ? (
          <SkeletonTemplateGrid count={6} />
        ) : (
          <SkeletonList count={4} />
        )
      ) : filteredDrafts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="file-tray-outline"
              size={60}
              color={theme.colors.textSecondary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === "templates"
              ? "No Custom Templates"
              : "No Drafts Found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery !== ""
              ? "No entries match your search criteria."
              : activeTab === "templates"
                ? "Save edited petition formats as custom templates to reuse them later."
                : "Generate legal notices or court petitions. They will appear here."}
          </Text>
          <View style={{ width: "60%", marginTop: 24 }}>
            <ActionButton
              title="Draft New Document"
              // @ts-ignore
              onPress={() => navigation.navigate("GenerateDocument")}
              type="primary"
            />
          </View>
        </View>
      ) : activeTab === "templates" ? (
        <FlatList
          key="templates_grid"
          data={filteredDrafts}
          renderItem={renderTemplateGridItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_data, index) => ({
            length: 180,
            offset: 180 * Math.floor(index / 2),
            index,
          })}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews
          onEndReached={loadMoreDrafts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ marginVertical: 10 }}
              />
            ) : null
          }
        />
      ) : (
        <FlatList
          key={viewMode === "grid" ? "drafts_cards" : "drafts_rows"}
          data={filteredDrafts}
          renderItem={viewMode === "grid" ? renderDraftItem : renderDraftListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews
          onEndReached={loadMoreDrafts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ marginVertical: 10 }}
              />
            ) : null
          }
        />
      )}

      {/* 3-Dots Quick Actions Menu Modal */}
      <Modal
        visible={isActionMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsActionMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuModalOverlay}
          activeOpacity={1}
          onPress={() => setIsActionMenuVisible(false)}
        >
          <View style={styles.menuModalContent}>
            <View style={styles.menuModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuModalTitle} numberOfLines={1}>
                  {actionMenuDraft?.title || "Document Actions"}
                </Text>
                <Text style={styles.menuModalSubtitle}>
                  {actionMenuDraft ? getTemplateLabel(actionMenuDraft.template_type) : ""}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.menuModalCloseBtn}
                onPress={() => setIsActionMenuVisible(false)}
              >
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuModalDivider} />

            {actionMenuDraft && (
              <View style={styles.menuModalOptions}>
                <TouchableOpacity
                  style={styles.menuOptionRow}
                  onPress={() => {
                    const draft = actionMenuDraft;
                    setIsActionMenuVisible(false);
                    handleOpenEditor(draft);
                  }}
                >
                  <View style={[styles.menuOptionIconBg, { backgroundColor: "#eff6ff" }]}>
                    <Ionicons name="create-outline" size={18} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuOptionText}>Edit Document</Text>
                    <Text style={styles.menuOptionSub}>Open in rich text legal editor</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOptionRow}
                  onPress={() => {
                    const draft = actionMenuDraft;
                    setIsActionMenuVisible(false);
                    handleOpenPdf(draft);
                  }}
                >
                  <View style={[styles.menuOptionIconBg, { backgroundColor: "#f0fdf4" }]}>
                    <Ionicons name="eye-outline" size={18} color="#16a34a" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuOptionText}>Open PDF</Text>
                    <Text style={styles.menuOptionSub}>Preview printable court layout</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOptionRow}
                  onPress={() => {
                    const draft = actionMenuDraft;
                    setIsActionMenuVisible(false);
                    handleShareDraft(draft);
                  }}
                >
                  <View style={[styles.menuOptionIconBg, { backgroundColor: "#faf5ff" }]}>
                    <Ionicons name="share-outline" size={18} color="#9333ea" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuOptionText}>Share PDF Document</Text>
                    <Text style={styles.menuOptionSub}>Share via WhatsApp, Email or Print</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOptionRow}
                  onPress={() => {
                    const draft = actionMenuDraft;
                    setIsActionMenuVisible(false);
                    openAttachModal(draft);
                  }}
                >
                  <View style={[styles.menuOptionIconBg, { backgroundColor: "#eff6ff" }]}>
                    <Ionicons name="briefcase-outline" size={18} color="#0284c7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuOptionText}>
                      {actionMenuDraft.case_id ? "Change Linked Case" : "Link to a Case"}
                    </Text>
                    <Text style={styles.menuOptionSub}>
                      {actionMenuDraft.case_id
                        ? `Currently linked to ${actionMenuDraft.case_title || actionMenuDraft.client_name || "Case"}`
                        : "Associate draft with an active diary case"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {actionMenuDraft.case_id ? (
                  <TouchableOpacity
                    style={styles.menuOptionRow}
                    onPress={() => {
                      const draft = actionMenuDraft;
                      setIsActionMenuVisible(false);
                      handleUnlinkCase(draft);
                    }}
                  >
                    <View style={[styles.menuOptionIconBg, { backgroundColor: "#fff1f2" }]}>
                      <Ionicons name="unlink-outline" size={18} color="#e11d48" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuOptionText, { color: "#e11d48" }]}>Unlink from Case</Text>
                      <Text style={styles.menuOptionSub}>Convert to standalone draft</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.menuOptionRow}
                  onPress={() => {
                    const draft = actionMenuDraft;
                    setIsActionMenuVisible(false);
                    handleDeleteDraft(draft);
                  }}
                >
                  <View style={[styles.menuOptionIconBg, { backgroundColor: "#fef2f2" }]}>
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuOptionText, { color: "#dc2626" }]}>Delete Draft</Text>
                    <Text style={styles.menuOptionSub}>Permanently remove from device</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Attach to Case Modal */}
      <Modal
        visible={isAttachModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAttachModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attach Draft to Case</Text>
              <TouchableOpacity onPress={() => setIsAttachModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <TextInput
                placeholder="Search cases..."
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.modalSearchInput}
                value={caseSearchQuery}
                onChangeText={setCaseSearchQuery}
              />
            </View>

            {isAttaching ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text
                  style={{ marginTop: 12, color: theme.colors.textSecondary }}
                >
                  Saving PDF & linking in database...
                </Text>
              </View>
            ) : filteredCases.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={{ color: theme.colors.textSecondary }}>
                  No cases found.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredCases}
                renderItem={renderCaseItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.modalList}
                contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default DraftsHubScreen;

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabButton: {
      flex: 1,
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
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    activeTabText: {
      color: theme.colors.primary,
      fontWeight: "bold",
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 40,
    },
    viewModeToggleBtn: {
      marginLeft: 10,
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.colors.inputBackground,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipsBar: {
      height: 44,
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterChipsContent: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: `${theme.colors.border}40`,
      height: 28,
      justifyContent: "center",
      alignItems: "center",
    },
    filterChipSelected: {
      backgroundColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.text,
    },
    filterChipTextSelected: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    listContent: {
      padding: 12,
      paddingBottom: 40,
    },
    draftCard: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    badgeCluster: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      flex: 1,
    },
    caseBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      maxWidth: 180,
    },
    caseBadgeText: {
      fontSize: 11,
      fontWeight: "600",
    },
    recentDotBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ecfdf5",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    recentDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#10b981",
      marginRight: 4,
    },
    recentDotText: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#059669",
    },
    moreMenuButton: {
      padding: 4,
      marginLeft: 6,
    },
    cardCenterRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    parchmentThumbnail: {
      width: 44,
      height: 68,
      backgroundColor: "#fcf9f2",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#e2d2b2",
      position: "relative",
      overflow: "hidden",
      marginRight: 12,
      elevation: 1,
    },
    parchmentMarginLine: {
      position: "absolute",
      left: 8,
      top: 0,
      bottom: 0,
      width: 0.8,
      backgroundColor: "#ef4444",
      opacity: 0.6,
    },
    parchmentLines: {
      marginTop: 8,
      paddingLeft: 11,
      paddingRight: 4,
      gap: 4,
    },
    dummyLine: {
      height: 2,
      backgroundColor: "#d1d5db",
    },
    parchmentPdfTag: {
      position: "absolute",
      bottom: 2,
      right: 2,
      borderRadius: 2,
      paddingHorizontal: 2.5,
      paddingVertical: 1,
    },
    parchmentPdfTagText: {
      color: "#fff",
      fontSize: 6,
      fontWeight: "bold",
    },
    cardTitleColumn: {
      flex: 1,
    },
    draftTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 4,
      lineHeight: 20,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    typeBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 4,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: "700",
    },
    draftDate: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    actionDock: {
      flexDirection: "row",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: `${theme.colors.border}60`,
      paddingTop: 10,
      gap: 6,
    },
    equalActionBtn: {
      flex: 1,
      height: 34,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 4,
    },
    equalActionBtnText: {
      fontSize: 11.5,
      fontWeight: "700",
      textAlign: "center",
    },
    draftListRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 1,
    },
    listRowIconBg: {
      width: 36,
      height: 36,
      borderRadius: 6,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    listRowContent: {
      flex: 1,
    },
    listRowTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 2,
    },
    listRowSubtitle: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    listRowActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    listActionBtn: {
      padding: 6,
      borderRadius: 6,
    },
    menuModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    menuModalContent: {
      backgroundColor: theme.colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      paddingBottom: Platform.OS === "ios" ? 36 : 20,
      elevation: 10,
    },
    menuModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    menuModalTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    menuModalSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    menuModalCloseBtn: {
      padding: 6,
    },
    menuModalDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    menuModalOptions: {
      gap: 4,
    },
    menuOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    menuOptionIconBg: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    menuOptionText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    menuOptionSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
      paddingTop: 60,
    },
    emptyIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.inputBackground,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: Dimensions.get("window").height * 0.82,
      height: Dimensions.get("window").height * 0.70,
      padding: 16,
      paddingBottom: Platform.OS === "ios" ? 36 : 24,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    modalSearchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 40,
      marginBottom: 12,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
    },
    modalLoading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    modalEmpty: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    modalList: {
      flex: 1,
    },
    caseItemCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    caseItemInfo: {
      flex: 1,
      marginRight: 12,
    },
    caseItemTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 4,
    },
    caseItemSub: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });
