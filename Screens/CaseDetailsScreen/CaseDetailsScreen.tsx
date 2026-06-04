// Screens/CaseDetailsScreen/CaseDetailsScreen.tsx
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { formatDate } from "../../utils/commonFunctions";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native"; // Removed ScrollView
import { Ionicons } from "@expo/vector-icons";
import * as db from "../../DataBase";
import { getCaseTimelineEventsByCaseId, getCaseById } from "../../DataBase";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import { CaseData, CaseDataScreen, Document, TimelineEvent } from "../../Types/appTypes";
import { HomeStackParamList } from "../../Types/navigationtypes";
import ActionButton from "../CommonComponents/ActionButton";
import SectionHeader from "../CommonComponents/SectionHeader";
import { exportCaseToPdf } from "../../utils/pdfExporter";
import { useAdTrigger } from "../CommonComponents/AdManager";
import DateRow from "./components/DateRow";
import DocumentCard from "./components/DocumentCard";
import StatusBadge from "./components/StatusBadge";
import TimelineEventItem from "./components/TimelineEventItem";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import DocumentUpload from "../Addcase/DocumentUpload";

type CaseDetailsScreenRouteProp = RouteProp<HomeStackParamList, "CaseDetails">;

export const PRIMARY_BLUE_COLOR_FOR_LOADER = "#3B82F6";

// Define item types for the main FlatList
type ListItemType =
  | { type: "summary"; data: CaseDataScreen }
  | { type: "documentsHeader" }
  | { type: "document"; data: Document; id: string }
  | { type: "noDocuments" }
  | { type: "timelineHeader" }
  | { type: "timelineEvent"; data: TimelineEvent; isLast: boolean; id: string }
  | { type: "noTimelineEvents" }
  | { type: "loadingDocuments" };

const CaseDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CaseDetailsScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  const { showAdWithPreload } = useAdTrigger();
  const { caseId } = route.params;
  const [caseDetails, setCaseDetails] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: caseDetails?.CaseTitle || "Case Details" });
  }, [navigation, caseDetails]);

  const loadCaseDetails = useCallback(async (caseId: number) => {
    console.log("Loading case details for caseId:", caseId);
    const details = await getCaseById(caseId);
    if (details) {
      console.log("Case details found:", details);
      setCaseDetails(details);
    } else {
      console.log("Case details not found for caseId:", caseId);
    }
  }, []);

  const loadDocumentsAndTimeline = useCallback(async (currentCaseId: number) => {
    if (!currentCaseId) return;
    setIsLoadingDocuments(true);
    try {
      const fetchedDocs = await db.getCaseDocuments(currentCaseId);
      const uiDocs: Document[] = fetchedDocs.map((dbDoc) => ({
        id: dbDoc.id,
        case_id: dbDoc.case_id,
        fileName: dbDoc.original_display_name,
        uploadDate: dbDoc.created_at,
        fileType: dbDoc.file_type,
        fileSize: dbDoc.file_size,
        stored_filename: dbDoc.stored_filename,
      }));
      setDocuments(uiDocs);

      const fetchedTimelineEvents = await getCaseTimelineEventsByCaseId(
        currentCaseId
      );
      setTimelineEvents(
        fetchedTimelineEvents.map((tle) => ({
          id: tle.id.toString(),
          date: tle.hearing_date,
          description: tle.notes,
        }))
      );
    } catch (error) {
      console.error(
        "Error loading associated data (documents/timeline) for case:",
        error
      );
      Alert.alert("Error", "Could not load associated case data.");
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    if (!caseId) return;
    const caseIdToLoad = parseInt(caseId.toString(), 10);

    const fetchAllData = async () => {
      if (!caseIdToLoad || isNaN(caseIdToLoad)) {
        Alert.alert("Error", "No valid Case ID provided.");
        setIsLoading(false);
        if (navigation.canGoBack()) navigation.goBack();
        return;
      }
      setIsLoading(true);
      try {
        await loadCaseDetails(caseIdToLoad);
        await loadDocumentsAndTimeline(caseIdToLoad);
      } catch (error) {
        console.error("Error fetching case details:", error);
        Alert.alert("Error", "Could not load case details.");
        if (navigation.canGoBack()) navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    // Load data initially on mount
    fetchAllData();

    // Reload data when the screen is focused (e.g., when returning from Edit Case)
    const unsubscribe = navigation.addListener("focus", () => {
      fetchAllData();
    });

    return unsubscribe;
  }, [caseId, navigation, loadDocumentsAndTimeline, loadCaseDetails]);

  const handleEditCase = () => {
    // Navigate to an EditCase screen, passing the case details
    // @ts-ignore
    navigation.navigate("EditCase", { caseId: parseInt(caseDetails.id, 10) });
  };

  const handleAddNewDocument = () => {
    // Navigate to a screen for adding documents
    // @ts-ignore
    navigation.navigate("AddDocument", { caseId: caseDetails.id });
  };

  const handleExportPdf = async () => {
    if (!caseDetails) return;
    await showAdWithPreload("rewarded", async () => {
      try {
        await exportCaseToPdf(caseDetails);
      } catch (error) {
        Alert.alert("Export Failed", "Could not compile case details PDF.");
      }
    });
  };

  const handleGenerateDocument = () => {
    if (!caseDetails) return;
    // @ts-ignore
    navigation.navigate("GenerateDocument", { caseId: parseInt(caseDetails.id, 10) });
  };

  const handlePhoneCall = () => {
    if (caseDetails?.ClientContactNumber) {
      Linking.openURL(`tel:${caseDetails.ClientContactNumber}`);
    } else {
      Alert.alert("No Contact Number", "No client contact number is available for this case.");
    }
  };

  const handleWhatsAppChat = () => {
    if (caseDetails?.ClientContactNumber) {
      const cleanNumber = caseDetails.ClientContactNumber.replace(/\D/g, "");
      Linking.openURL(`https://wa.me/${cleanNumber}`);
    } else {
      Alert.alert("No Contact Number", "No client contact number is available for this case.");
    }
  };

  const handleDocumentInteraction = async (doc: Document) => {
    if (!doc.stored_filename) {
      Alert.alert("Not Available", "Document path not found.");
      return;
    }
    const localDocumentPath = db.getFullDocumentPath(doc.stored_filename);
    if (!localDocumentPath) {
      Alert.alert("Error", "Could not construct document path.");
      return;
    }
    try {
      const fileInfo = await FileSystem.getInfoAsync(localDocumentPath);
      if (!fileInfo.exists) {
        Alert.alert("Error", "File not found at: " + localDocumentPath);
        return;
      }
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(localDocumentPath);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: doc.fileType || "*/*",
        });
      } else if (Platform.OS === "ios") {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localDocumentPath, {
            mimeType: doc.fileType || undefined,
            dialogTitle: `Open ${doc.fileName}`,
            UTI: doc.fileType || undefined,
          });
        } else {
          Alert.alert("Unavailable", "Sharing is not available.");
        }
      } else {
        Alert.alert("Open Document", `File at: ${localDocumentPath}. Open manually.`);
      }
    } catch (error: any) {
      console.error("Error opening document:", error);
      Alert.alert("Error Opening File", error.message || "Could not open document.");
    }
  };


  const listData: ListItemType[] = [];
  listData.push({ type: "summary", data: caseDetails });

  listData.push({ type: "documentsHeader" });
  if (isLoadingDocuments) {
    listData.push({ type: "loadingDocuments" });
  } else {
    // We will render the DocumentUpload component directly, so we don't need to push documents here.
  }

  listData.push({ type: "timelineHeader" });
  if (timelineEvents.length > 0) {
    timelineEvents.forEach((event, index) =>
      listData.push({
        type: "timelineEvent",
        data: event,
        isLast: index === timelineEvents.length - 1,
        id: `tl-${event.id}`,
      })
    );
  } else {
    listData.push({ type: "noTimelineEvents" });
  }

  const renderListItem = ({ item }: { item: ListItemType }) => {
    switch (item.type) {
      case "summary":
        if (!caseDetails) {
          return (
            <View style={styles.centered}>
              <ActivityIndicator size="large" />
            </View>
          );
        }
        return (
          <View style={styles.summarySection}>
            <Text style={styles.mainCaseTitle}>{caseDetails.CaseTitle}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={[styles.clientName, { marginBottom: 0 }]}>Client: {caseDetails.ClientName}</Text>
              {caseDetails.ClientContactNumber ? (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={handlePhoneCall} activeOpacity={0.85} style={{ padding: 8, backgroundColor: '#E0F2FE', borderRadius: 20, marginRight: 8 }}>
                    <Ionicons name="call" size={20} color="#0284C7" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleWhatsAppChat} activeOpacity={0.85} style={{ padding: 8, backgroundColor: '#DCFCE7', borderRadius: 20 }}>
                    <Ionicons name="logo-whatsapp" size={20} color="#15803D" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
            <StatusBadge status={caseDetails.CaseStatus} />
            <DateRow
              label="Next Hearing"
              dateString={formatDate(caseDetails.NextDate)}
              iconName="gavel"
            />
            <DateRow
              label="Previous Hearing"
              dateString={formatDate(caseDetails.PreviousDate)}
              iconName="history"
            />
            <DateRow
              label="Last Update"
              dateString={formatDate(caseDetails.updated_at)}
              iconName="update"
            />
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Case Number:</Text>
                <Text style={styles.detailValue}>{caseDetails.case_number || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Case Year:</Text>
                <Text style={styles.detailValue}>{caseDetails.case_year || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Court Name:</Text>
                <Text style={styles.detailValue}>{caseDetails.court_name || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Case Type:</Text>
                <Text style={styles.detailValue}>{caseDetails.case_type_name || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>On Behalf Of:</Text>
                <Text style={styles.detailValue}>{caseDetails.OnBehalfOf || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>First Party:</Text>
                <Text style={styles.detailValue}>{caseDetails.FirstParty || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Opposite Party:</Text>
                <Text style={styles.detailValue}>{caseDetails.OppositeParty || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Accused:</Text>
                <Text style={styles.detailValue}>{caseDetails.Accussed || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Under Section:</Text>
                <Text style={styles.detailValue}>{caseDetails.Undersection || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Priority:</Text>
                <Text style={styles.detailValue}>{caseDetails.Priority || 'N/A'}</Text>
              </View>
            </View>
            <Text style={styles.detailLabel}>Case Description:</Text>
            <Text style={styles.detailValue}>{caseDetails.CaseDescription || 'N/A'}</Text>
            <Text style={styles.detailLabel}>Case Notes:</Text>
            <Text style={styles.detailValue}>{caseDetails.CaseNotes || 'N/A'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <View style={{ width: '48%' }}>
                <ActionButton
                  title="Edit Case"
                  onPress={handleEditCase}
                  type="primary"
                />
              </View>
              <View style={{ width: '48%' }}>
                <ActionButton
                  title="Export PDF"
                  onPress={handleExportPdf}
                  type="secondary"
                />
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <ActionButton
                title="Generate Court Document"
                onPress={handleGenerateDocument}
                type="dashed"
              />
            </View>
          </View>
        );
      case "documentsHeader":
        return (
          <View style={styles.documentsSection}>
            <SectionHeader title="Documents" />
            <DocumentUpload caseId={caseId} />
          </View>
        );
      case "timelineHeader":
        return (
          <View style={styles.timelineSection}>
            <SectionHeader title="Case Timeline" />
          </View>
        );
      case "timelineEvent":
        return <TimelineEventItem event={item.data} isLast={item.isLast} />;
      case "noTimelineEvents":
        return (
          <View style={styles.timelineSection}>
            <Text style={styles.noItemsText}>No timeline events available.</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={listData}
        renderItem={renderListItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Ensure content is not hidden by bottom actions
  },
  summarySection: {
    padding: 16,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mainCaseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: theme.colors.text,
  },
  clientName: {
    fontSize: 16,
    marginBottom: 12,
    color: theme.colors.text,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailRow: {
    width: '48%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  noItemsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    padding: 16,
  },
  documentsSection: {
    backgroundColor: theme.colors.background,
  },
  timelineSection: {
    backgroundColor: theme.colors.background,
  },
});

export default CaseDetailsScreen;
