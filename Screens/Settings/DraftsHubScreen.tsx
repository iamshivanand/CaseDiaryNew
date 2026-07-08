// Screens/Settings/DraftsHubScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useState, useEffect, useContext } from "react";
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
} from "react-native";

import * as db from "../../DataBase";
import { CaseWithDetails, DocumentDraft } from "../../DataBase";
import { ThemeContext } from "../../Providers/ThemeProvider";
import ActionButton from "../CommonComponents/ActionButton";

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
    id: "built_in_vakalatnama",
    template_type: "vakalatnama",
    title: "Vakalatnama",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_adjournment",
    template_type: "adjournment",
    title: "Adjournment Application",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_bail",
    template_type: "bail",
    title: "Bail Application",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_affidavit",
    template_type: "affidavit",
    title: "Affidavit",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_written_statement",
    template_type: "written_statement",
    title: "Written Statement",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_legal_notice",
    template_type: "legal_notice",
    title: "Legal Notice",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_caveat",
    template_type: "caveat",
    title: "Caveat Petition",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_injunction",
    template_type: "injunction",
    title: "Temporary Injunction",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_plaint",
    template_type: "plaint",
    title: "Plaint (Civil Suit)",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_rejoinder",
    template_type: "rejoinder",
    title: "Replication / Rejoinder",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_execution",
    template_type: "execution",
    title: "Execution Petition",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_anticipatory_bail",
    template_type: "anticipatory_bail",
    title: "Anticipatory Bail",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_private_complaint",
    template_type: "private_complaint",
    title: "Private Complaint",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_fir_quashing",
    template_type: "fir_quashing",
    title: "FIR Quashing Petition",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_exemption",
    template_type: "exemption",
    title: "Exemption Application",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_cheque_bounce",
    template_type: "cheque_bounce",
    title: "Cheque Bounce Notice",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_arbitration_sec9",
    template_type: "arbitration_sec9",
    title: "Arbitration Sec 9",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_consumer_complaint",
    template_type: "consumer_complaint",
    title: "Consumer Complaint",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_rent_agreement",
    template_type: "rent_agreement",
    title: "Rent Agreement",
    is_custom_template: 0,
    isBuiltIn: true,
  },
  {
    id: "built_in_power_of_attorney",
    template_type: "power_of_attorney",
    title: "Power of Attorney",
    is_custom_template: 0,
    isBuiltIn: true,
  },
];

const getTemplateLabel = (type: string): string => {
  switch (type) {
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

const DraftsHubScreen: React.FC = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [activeTab, setActiveTab] = useState<"drafts" | "templates">("drafts");
  const [drafts, setDrafts] = useState<DocumentDraft[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<DocumentDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  const getFormattedHtmlForPrint = (html: string) => {
    let font = "'Times New Roman', Georgia, serif";
    let lineHeight = "1.6";
    let stampMargin = 0;
    let cleanedHtml = html;

    const metadataMatch = html.match(/<!-- CD_LAYOUT:(.*?) -->/);
    if (metadataMatch) {
      try {
        const layout = JSON.parse(metadataMatch[1]);
        if (layout.font) font = layout.font;
        if (layout.lineHeight) lineHeight = layout.lineHeight;
        if (layout.stampMargin !== undefined) stampMargin = layout.stampMargin;
        cleanedHtml = html.replace(/<!-- CD_LAYOUT:(.*?) -->/, "");
      } catch (e) {
        console.error("Failed to parse layout metadata in DraftsHub:", e);
      }
    }

    return `
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
        ${cleanedHtml}
      </body>
      </html>
    `;
  };

  // Load drafts and templates from SQLite
  const loadDrafts = async (resetPage: boolean = false) => {
    const isSearching = searchQuery.trim() !== "";
    const targetPage = resetPage ? 0 : page;

    if (targetPage === 0) {
      setIsLoading(true);
    } else if (!isSearching) {
      setIsFetchingNextPage(true);
    }

    try {
      if (activeTab === "templates") {
        const limit = isSearching ? null : PAGE_SIZE;
        const offset = isSearching ? null : targetPage * PAGE_SIZE;

        // Fetch custom templates metadata-only (excludeHtml = true)
        const results = await db.getDocumentDrafts(null, 1, true, limit, offset);
        
        const builtIn = (targetPage === 0 || isSearching) ? BUILT_IN_TEMPLATES : [];
        const mappedResults = results.map((r) => ({ ...r, isBuiltIn: false }));
        const combined = [...builtIn, ...mappedResults];
        
        if (targetPage === 0 || isSearching) {
          setDrafts(combined as any);
          setFilteredDrafts(combined as any);
        } else {
          setDrafts((prev) => [...prev, ...combined as any]);
          setFilteredDrafts((prev) => [...prev, ...combined as any]);
        }
        
        setHasMore(!isSearching && results.length === PAGE_SIZE);
        if (!isSearching) {
          setPage(targetPage + 1);
        }
      } else {
        const limit = isSearching ? null : PAGE_SIZE;
        const offset = isSearching ? null : targetPage * PAGE_SIZE;

        // Fetch drafts metadata-only (excludeHtml = true)
        const results = await db.getDocumentDrafts(null, 0, true, limit, offset);
        
        if (targetPage === 0 || isSearching) {
          setDrafts(results);
          setFilteredDrafts(results);
        } else {
          setDrafts((prev) => [...prev, ...results]);
          setFilteredDrafts((prev) => [...prev, ...results]);
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
    if (isLoading || isFetchingNextPage || !hasMore || searchQuery.trim() !== "") return;
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

  // Filter drafts based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDrafts(drafts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = drafts.filter(
        (draft) =>
          draft.title.toLowerCase().includes(query) ||
          getTemplateLabel(draft.template_type).toLowerCase().includes(query)
      );
      setFilteredDrafts(filtered);
    }
  }, [searchQuery, drafts]);

  // Load cases from Database for Attach Modal
  const loadCases = async () => {
    try {
      const allCases = await db.getCases();
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

  // View/Share Draft (Compiles HTML on-the-fly to PDF)
  const handleShareDraft = async (draft: DocumentDraft) => {
    try {
      setIsLoading(true);
      const formattedHtml = getFormattedHtmlForPrint(draft.html_content);
      const { uri } = await Print.printToFileAsync({
        html: formattedHtml,
        width: 612,
        height: 1008,
      });

      setIsLoading(false);
      Alert.alert(draft.title, "Choose an action for this document:", [
        {
          text: "Open in App",
          onPress: () => {
            // @ts-ignore
            navigation.navigate("PdfViewer", {
              pdfUri: uri,
              title: draft.title,
            });
          },
        },
        {
          text: "Share PDF",
          onPress: async () => {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(uri, {
                mimeType: "application/pdf",
                dialogTitle: draft.title,
                UTI: "com.adobe.pdf",
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
      setIsLoading(false);
      console.error("Error sharing draft:", error);
      Alert.alert("Error", "Failed to generate PDF document.");
    }
  };

  // Delete Draft
  const handleDeleteDraft = (draft: DocumentDraft) => {
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
              await db.deleteDocumentDraft(draft.id);
              loadDrafts();
            } catch (error) {
              console.error("Error deleting draft:", error);
              Alert.alert("Error", "Failed to delete the draft document.");
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

      // 1. Compile PDF dynamically to a temp file
      const formattedHtml = getFormattedHtmlForPrint(
        selectedDraft.html_content
      );
      const { uri } = await Print.printToFileAsync({
        html: formattedHtml,
        width: 612,
        height: 1008,
      });
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSize = fileInfo.exists ? fileInfo.size : null;

      // 2. Upload/Save PDF copy in Case attachments
      const successId = await db.uploadCaseDocument({
        originalFileName: `${getTemplateLabel(selectedDraft.template_type)}_${Date.now()}.pdf`,
        fileType: "application/pdf",
        fileUri: uri,
        caseId: selectedCase.id,
        userId,
        fileSize,
      });

      if (successId) {
        // 3. Associate the editable draft in SQLite with this case
        await db.saveDocumentDraft({
          ...selectedDraft,
          case_id: selectedCase.id,
          updated_at: new Date().toISOString(),
        });

        setIsAttachModalVisible(false);
        Alert.alert(
          "Success",
          `Document successfully attached to case: ${selectedCase.CaseTitle || selectedCase.ClientName}`,
          [{ text: "OK", onPress: () => loadDrafts() }]
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

  const renderDraftItem = ({ item }: { item: DocumentDraft }) => {
    const color =
      documentTypeColors[item.template_type] || theme.colors.primary;
    const dateStr = new Date(
      item.created_at || item.updated_at
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return (
      <View style={styles.draftCard}>
        <View style={styles.draftHeader}>
          <View style={{ marginRight: 12 }}>
            <View
              style={{
                width: 48,
                height: 76,
                backgroundColor: "#fcf9f2",
                borderRadius: 4,
                borderWidth: 1,
                borderColor: "#e2d2b2",
                position: "relative",
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: 9,
                  top: 0,
                  bottom: 0,
                  width: 0.8,
                  backgroundColor: "#ef4444",
                  opacity: 0.6,
                }}
              />
              <View
                style={{
                  marginTop: 10,
                  paddingLeft: 12,
                  paddingRight: 4,
                  gap: 4,
                }}
              >
                <View
                  style={{
                    height: 2,
                    backgroundColor: "#d1d5db",
                    width: "80%",
                  }}
                />
                <View
                  style={{
                    height: 2,
                    backgroundColor: "#d1d5db",
                    width: "90%",
                  }}
                />
                <View
                  style={{
                    height: 2,
                    backgroundColor: "#d1d5db",
                    width: "65%",
                  }}
                />
                <View
                  style={{
                    height: 2,
                    backgroundColor: "#e5e7eb",
                    width: "85%",
                  }}
                />
                <View
                  style={{
                    height: 2,
                    backgroundColor: "#e5e7eb",
                    width: "70%",
                  }}
                />
                <View
                  style={{
                    height: 2,
                    backgroundColor: "#e5e7eb",
                    width: "90%",
                  }}
                />
                <View
                  style={{
                    height: 2,
                    backgroundColor: "#e5e7eb",
                    width: "50%",
                  }}
                />
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  backgroundColor: color,
                  borderRadius: 2,
                  paddingHorizontal: 3,
                  paddingVertical: 1.5,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 6, fontWeight: "bold" }}
                >
                  PDF
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.draftTitleContainer}>
            <Text style={styles.draftTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.badgeRow}>
              <View
                style={[styles.typeBadge, { backgroundColor: `${color}20` }]}
              >
                <Text style={[styles.typeBadgeText, { color }]}>
                  {getTemplateLabel(item.template_type)}
                </Text>
              </View>
              <Text style={styles.draftDate}>{dateStr}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            // @ts-ignore
            onPress={() =>
              navigation.navigate("EditDraft", { draftId: item.id })
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.actionBtnText, { color: theme.colors.primary }]}
            >
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            onPress={() => handleShareDraft(item)}
            activeOpacity={0.85}
          >
            <Ionicons
              name="share-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.actionBtnText, { color: theme.colors.primary }]}
            >
              Share PDF
            </Text>
          </TouchableOpacity>

          {activeTab === "drafts" && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: theme.colors.border }]}
              onPress={() => openAttachModal(item)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="link-outline"
                size={16}
                color={theme.colors.success}
              />
              <Text
                style={[styles.actionBtnText, { color: theme.colors.success }]}
              >
                Link Case
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            onPress={() => handleDeleteDraft(item)}
            activeOpacity={0.85}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={theme.colors.danger}
            />
            <Text
              style={[styles.actionBtnText, { color: theme.colors.danger }]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTemplateGridItem = ({ item }: { item: any }) => {
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
        onPress={() => {
          // @ts-ignore
          navigation.navigate("GenerateDocument", {
            templateType: item.template_type,
            draftId: item.isBuiltIn ? undefined : item.id,
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
          onPress={() => setActiveTab("drafts")}
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
          onPress={() => setActiveTab("templates")}
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
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Fetching drafts from SQLite...</Text>
        </View>
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
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
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
          key="drafts_list"
          data={filteredDrafts}
          renderItem={renderDraftItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
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

      {/* Attach to Case Modal */}
      <Modal
        visible={isAttachModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAttachModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
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
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
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
      padding: 12,
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 40,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      paddingVertical: 0,
    },
    listContent: {
      padding: 12,
      paddingBottom: 40,
    },
    draftCard: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    draftHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    draftTitleContainer: {
      flex: 1,
    },
    draftTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 6,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      marginRight: 8,
    },
    typeBadgeText: {
      fontSize: 11,
      fontWeight: "600",
    },
    draftDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      flex: 1,
      marginHorizontal: 3,
    },
    actionBtnText: {
      fontSize: 11,
      fontWeight: "bold",
      marginLeft: 4,
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
      height: Dimensions.get("window").height * 0.65,
      padding: 16,
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
