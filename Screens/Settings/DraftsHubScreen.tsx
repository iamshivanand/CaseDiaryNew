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
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import * as db from "../../DataBase";
import { CaseWithDetails } from "../../DataBase";
import ActionButton from "../CommonComponents/ActionButton";
import { formatDate } from "../../utils/commonFunctions";

interface DraftDocument {
  id: string;
  title: string;
  templateType: string;
  filePath: string;
  createdAt: string;
}

const documentTypeColors: { [key: string]: string } = {
  vakalatnama: "#10B981", // Emerald/Green
  adjournment: "#3B82F6", // Blue
  bail: "#F59E0B", // Amber
  affidavit: "#8B5CF6", // Violet
  written_statement: "#EC4899", // Pink
  legal_notice: "#EF4444", // Red
  caveat: "#06B6D4", // Cyan
  injunction: "#6366F1", // Indigo
};

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
    default:
      return "Draft";
  }
};

const DraftsHubScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [drafts, setDrafts] = useState<DraftDocument[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<DraftDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Attach Modal state
  const [isAttachModalVisible, setIsAttachModalVisible] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<DraftDocument | null>(null);
  const [cases, setCases] = useState<CaseWithDetails[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseWithDetails[]>([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);

  // Load drafts from AsyncStorage
  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const rawDrafts = await AsyncStorage.getItem("@unassociated_documents");
      if (rawDrafts) {
        const parsed = JSON.parse(rawDrafts) as DraftDocument[];
        // Sort by creation date descending
        const sorted = parsed.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setDrafts(sorted);
        setFilteredDrafts(sorted);
      } else {
        setDrafts([]);
        setFilteredDrafts([]);
      }
    } catch (error) {
      console.error("Failed to load unassociated drafts:", error);
      Alert.alert("Error", "Could not load drafts from storage.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  // Filter drafts based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDrafts(drafts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = drafts.filter(
        (draft) =>
          draft.title.toLowerCase().includes(query) ||
          getTemplateLabel(draft.templateType).toLowerCase().includes(query)
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

  // Share/View Draft
  const handleShareDraft = async (draft: DraftDocument) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(draft.filePath);
      if (!fileInfo.exists) {
        Alert.alert("File Not Found", "The PDF file for this draft could not be found.");
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(draft.filePath, {
          mimeType: "application/pdf",
          dialogTitle: draft.title,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Error sharing draft:", error);
      Alert.alert("Error", "Failed to share PDF document.");
    }
  };

  // Delete Draft
  const handleDeleteDraft = (draft: DraftDocument) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to permanently delete this draft?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete from filesystem
              const fileInfo = await FileSystem.getInfoAsync(draft.filePath);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(draft.filePath, { idempotent: true });
              }

              // Update registry
              const updatedDrafts = drafts.filter((d) => d.id !== draft.id);
              await AsyncStorage.setItem(
                "@unassociated_documents",
                JSON.stringify(updatedDrafts)
              );
              setDrafts(updatedDrafts);
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
  const openAttachModal = (draft: DraftDocument) => {
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

      // Extract file size
      const fileInfo = await FileSystem.getInfoAsync(selectedDraft.filePath);
      const fileSize = fileInfo.exists ? fileInfo.size : null;

      // Import to case documents database
      const successId = await db.uploadCaseDocument({
        originalFileName: `${getTemplateLabel(selectedDraft.templateType)}_${Date.now()}.pdf`,
        fileType: "application/pdf",
        fileUri: selectedDraft.filePath,
        caseId: selectedCase.id,
        userId: userId,
        fileSize: fileSize,
      });

      if (successId) {
        // Remove from unassociated drafts registry
        const updatedDrafts = drafts.filter((d) => d.id !== selectedDraft.id);
        await AsyncStorage.setItem("@unassociated_documents", JSON.stringify(updatedDrafts));
        setDrafts(updatedDrafts);

        setIsAttachModalVisible(false);
        Alert.alert(
          "Success",
          `Document successfully attached to case: ${selectedCase.CaseTitle || selectedCase.ClientName}`
        );
      } else {
        Alert.alert("Error", "Could not copy document to case files.");
      }
    } catch (error) {
      console.error("Failed to attach draft to case:", error);
      Alert.alert("Error", "An unexpected error occurred while attaching draft.");
    } finally {
      setIsAttaching(false);
    }
  };

  const renderDraftItem = ({ item }: { item: DraftDocument }) => {
    const color = documentTypeColors[item.templateType] || theme.colors.primary;
    const dateStr = new Date(item.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return (
      <View style={styles.draftCard}>
        <View style={styles.draftHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name="document-text-outline" size={24} color={color} />
          </View>
          <View style={styles.draftTitleContainer}>
            <Text style={styles.draftTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: `${color}20` }]}>
                <Text style={[styles.typeBadgeText, { color }]}>
                  {getTemplateLabel(item.templateType)}
                </Text>
              </View>
              <Text style={styles.draftDate}>{dateStr}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            onPress={() => handleShareDraft(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>View/Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            onPress={() => openAttachModal(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="link-outline" size={16} color={theme.colors.success} />
            <Text style={[styles.actionBtnText, { color: theme.colors.success }]}>Attach to Case</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            onPress={() => handleDeleteDraft(item)}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
            <Text style={[styles.actionBtnText, { color: theme.colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
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
            {item.CaseTitle || `${item.ClientName} vs ${item.OppositeParty || "Respondent"}`}
          </Text>
          <Text style={styles.caseItemSub}>
            No: {item.case_number || "N/A"} | Court: {item.court_name || "N/A"}
          </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search drafts..."
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Fetching drafts registry...</Text>
        </View>
      ) : filteredDrafts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="file-tray-outline" size={60} color={theme.colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Drafts Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery !== ""
              ? "No drafts matches your search criteria."
              : "Generate legal notices or court petitions in stand-alone mode. They will appear here."}
          </Text>
          <View style={{ width: "60%", marginTop: 24 }}>
            <ActionButton
              title="Draft New Document"
              onPress={() => navigation.navigate("GenerateDocument" as any)}
              type="primary"
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredDrafts}
          renderItem={renderDraftItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
              <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
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
                <Text style={{ marginTop: 12, color: theme.colors.textSecondary }}>
                  Copying draft to case folder...
                </Text>
              </View>
            ) : filteredCases.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={{ color: theme.colors.textSecondary }}>No cases found.</Text>
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

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    searchBarContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      padding: 0,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    draftCard: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    draftHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    draftTitleContainer: {
      flex: 1,
    },
    draftTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: theme.colors.text,
      lineHeight: 20,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      flexWrap: "wrap",
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
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
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    actionBtnText: {
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
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
      backgroundColor: "rgba(15, 23, 42, 0.65)", // Dark slate semi-transparent backdrop
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.colors.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: Dimensions.get("window").height * 0.75,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
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
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 16,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      padding: 0,
    },
    modalList: {
      marginBottom: 20,
    },
    caseItemCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    caseItemInfo: {
      flex: 1,
      marginRight: 16,
    },
    caseItemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    caseItemSub: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    modalLoading: {
      paddingVertical: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    modalEmpty: {
      paddingVertical: 40,
      alignItems: "center",
    },
  });

export default DraftsHubScreen;
