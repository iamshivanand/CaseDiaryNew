// Screens/CaseDetailsScreen/CaseDetailsScreen.tsx
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"; // Removed ScrollView
import * as db from "../../DataBase";
import { getCaseTimelineEventsByCaseId, getCaseById } from "../../DataBase";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { CaseData, CaseDataScreen, Document, TimelineEvent } from "../../Types/appTypes";
import { HomeStackParamList } from "../../Types/navigationtypes";
import ActionButton from "../CommonComponents/ActionButton";
import SectionHeader from "../CommonComponents/SectionHeader";
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
    const details = await getCaseById(caseId);
    if (details) {
      setCaseDetails(details);
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
    if (caseId) {
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
      fetchAllData();
    }
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

  if (!caseDetails) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
        return (
          <View style={styles.summarySection}>
            <Text style={styles.mainCaseTitle}>{caseDetails.CaseTitle}</Text>
            <Text style={styles.clientName}>Client: {caseDetails.ClientName}</Text>
            <StatusBadge status={caseDetails.CaseStatus} />
            <DateRow
              label="Next Hearing"
              dateString={caseDetails.NextDate}
              iconName="gavel"
            />
            <DateRow
              label="Previous Hearing"
              dateString={caseDetails.PreviousDate}
              iconName="history"
            />
            <DateRow
              label="Last Update"
              dateString={caseDetails.updated_at}
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
            <ActionButton
              title="Edit Case"
              onPress={handleEditCase}
              type="primary"
            />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Ensure content is not hidden by bottom actions
  },
  summarySection: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  mainCaseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    marginBottom: 12,
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
  },
  detailValue: {
    fontSize: 14,
  },
});

export default CaseDetailsScreen;
