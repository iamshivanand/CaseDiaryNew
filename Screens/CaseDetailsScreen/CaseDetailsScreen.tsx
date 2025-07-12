// Screens/CaseDetailsScreen/CaseDetailsScreen.tsx
import React, { useState, useEffect, useLayoutEffect, useCallback, useContext } from 'react';
import { View, Text, ActivityIndicator, FlatList, Alert, Platform, StyleSheet as ReactNativeStyleSheet } from 'react-native'; // Removed ScrollView
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// Icon import seems unused, can be removed if not needed for other parts not shown or future use.
// import Icon from 'react-native-vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

import { HomeStackParamList } from '../../Types/navigationtypes';
import { CaseData, Document, TimelineEvent } from '../../Types/appTypes';
import * as db from '../../DataBase';
import { CaseWithDetails } from '../../DataBase';
import { ThemeContext } from '../../Providers/ThemeProvider';

import { getCaseDetailsScreenStyles } from './CaseDetailsScreenStyle';
import StatusBadge from './components/StatusBadge';
import DateRow from './components/DateRow';
import DocumentCard from './components/DocumentCard';
import TimelineEventItem from './components/TimelineEventItem';
import SectionHeader from '../CommonComponents/SectionHeader';
import ActionButton from '../CommonComponents/ActionButton';

type CaseDetailsScreenRouteProp = RouteProp<HomeStackParamList, 'CaseDetail'>;

const PRIMARY_BLUE_COLOR_FOR_LOADER = '#3B82F6';

// Define item types for the main FlatList
type ListItemType =
  | { type: 'summary'; data: CaseWithDetails }
  | { type: 'description'; text: string }
  | { type: 'documentsHeader' }
  | { type: 'document'; data: Document; id: string }
  | { type: 'noDocuments' }
  | { type: 'timelineHeader' }
  | { type: 'timelineEvent'; data: TimelineEvent; isLast: boolean; id: string }
  | { type: 'noTimelineEvents' }
  | { type: 'loadingDocuments' };


const CaseDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CaseDetailsScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const styles = getCaseDetailsScreenStyles(theme);

  // const caseId = route.params?.caseId; // Already available via route.params.caseId

  const [caseDetailsData, setCaseDetailsData] = useState<CaseWithDetails | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  useLayoutEffect(() => {
    if (caseDetailsData?.CaseTitle) {
      navigation.setOptions({ title: caseDetailsData.CaseTitle });
    } else if (route.params?.caseTitleHeader) {
        navigation.setOptions({ title: route.params.caseTitleHeader });
    } else {
      navigation.setOptions({ title: 'Case Details' });
    }
  }, [navigation, caseDetailsData, route.params?.caseTitleHeader]);

  const loadDocumentsAndTimeline = useCallback(async (currentCaseId: number) => {
    if (!currentCaseId) return;
    setIsLoadingDocuments(true);
    try {
      const fetchedDocs = await db.getCaseDocuments(currentCaseId);
      const uiDocs: Document[] = fetchedDocs.map(dbDoc => ({
        id: dbDoc.id, case_id: dbDoc.case_id, fileName: dbDoc.original_display_name,
        uploadDate: dbDoc.created_at, fileType: dbDoc.file_type, fileSize: dbDoc.file_size,
        stored_filename: dbDoc.stored_filename,
      }));
      setDocuments(uiDocs);

      // Replace with actual fetch: await db.getTimelineEventsByCaseId(currentCaseId)
      const fetchedTimelineEvents = await db.getTimelineEventsByCaseId(currentCaseId);
      setTimelineEvents(fetchedTimelineEvents.map(tle => ({...tle, id: tle.id.toString() })));

    } catch (error) {
      console.error("Error loading associated data (documents/timeline) for case:", error);
      Alert.alert("Error", "Could not load associated case data.");
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    const caseIdToLoad = route.params?.caseId;
    const fetchAllData = async () => {
      if (!caseIdToLoad || typeof caseIdToLoad !== 'number') {
        Alert.alert("Error", "No valid Case ID provided.");
        setIsLoading(false);
        if(navigation.canGoBack()) navigation.goBack();
        return;
      }
      setIsLoading(true);
      try {
        const fetchedCase = await db.getCaseById(caseIdToLoad);
        if (fetchedCase) {
          setCaseDetailsData(fetchedCase);
          await loadDocumentsAndTimeline(caseIdToLoad);
        } else {
          Alert.alert("Error", "Case not found.");
          if(navigation.canGoBack()) navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
        Alert.alert("Error", "Could not load case details.");
        if(navigation.canGoBack()) navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [route.params?.caseId, navigation, loadDocumentsAndTimeline]);


  const handleEditCase = () => {
    if (caseDetailsData) {
      const caseDataForEdit: Partial<CaseData> = {
        ...caseDetailsData,
        Status: caseDetailsData.CaseStatus,
        FiledDate: caseDetailsData.dateFiled,
        HearingDate: caseDetailsData.NextDate,
        documents: documents,
        timelineEvents: timelineEvents // Ensure timeline events are also passed if needed
      };
      navigation.navigate('EditCase', { initialCaseData: caseDataForEdit });
    }
  };

  const handleAddNewDocument = () => {
     if (caseDetailsData) { // Navigating to EditCase, which now handles document additions
      const caseDataForEdit: Partial<CaseData> = {
        ...caseDetailsData, Status: caseDetailsData.CaseStatus, FiledDate: caseDetailsData.dateFiled, HearingDate: caseDetailsData.NextDate, documents: documents, timelineEvents: timelineEvents
      };
      navigation.navigate('EditCase', { initialCaseData: caseDataForEdit, focusOn: 'documents' });
    }
  };


  const handleDocumentInteraction = async (doc: Document) => {
    if (!doc.stored_filename) {
      Alert.alert("Not Available", "Document path not found."); return;
    }
    const localDocumentPath = db.getFullDocumentPath(doc.stored_filename);
    if (!localDocumentPath) {
      Alert.alert("Error", "Could not construct document path."); return;
    }
    try {
      const fileInfo = await FileSystem.getInfoAsync(localDocumentPath);
      if (!fileInfo.exists) {
        Alert.alert("Error", "File not found at: " + localDocumentPath); return;
      }
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(localDocumentPath);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri, flags: 1, type: doc.fileType || '*/*',
        });
      } else if (Platform.OS === 'ios') {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localDocumentPath, {
            mimeType: doc.fileType || undefined, dialogTitle: `Open ${doc.fileName}`, UTI: doc.fileType || undefined,
          });
        } else { Alert.alert("Unavailable", "Sharing is not available."); }
      } else { Alert.alert("Open Document", `File at: ${localDocumentPath}. Open manually.`); }
    } catch (error: any) {
      console.error("Error opening document:", error);
      Alert.alert("Error Opening File", error.message || "Could not open document.");
    }
  };


  const listData: ListItemType[] = [];
  if (caseDetailsData) {
    listData.push({ type: 'summary', data: caseDetailsData });
    if (caseDetailsData.CaseDescription) {
      listData.push({ type: 'description', text: caseDetailsData.CaseDescription });
    }

    listData.push({ type: 'documentsHeader' });
    if (isLoadingDocuments) {
        listData.push({ type: 'loadingDocuments'});
    } else if (documents.length > 0) {
      documents.forEach(doc => listData.push({ type: 'document', data: doc, id: `doc-${doc.id}` }));
    } else {
      listData.push({ type: 'noDocuments' });
    }

    listData.push({ type: 'timelineHeader' });
    if (timelineEvents.length > 0) {
      timelineEvents.forEach((event, index) => listData.push({ type: 'timelineEvent', data: event, isLast: index === timelineEvents.length - 1, id: `tl-${event.id}` }));
    } else {
      listData.push({ type: 'noTimelineEvents' });
    }
  }


  const renderListItem = ({ item }: { item: ListItemType }) => {
    switch (item.type) {
      case 'summary':
        return (
          <View style={styles.summarySection}>
            <Text style={styles.mainCaseTitle}>{item.data.CaseTitle || 'N/A'}</Text>
            <Text style={styles.clientName}>Client: {item.data.ClientName || item.data.OnBehalfOf || 'N/A'}</Text>
            <StatusBadge status={item.data.CaseStatus} />
            <DateRow label="Filed" dateString={item.data.dateFiled} iconName="gavel" />
            {item.data.CaseStatus === 'Closed' && (
              <DateRow label="Closed" dateString={item.data.ClosedDate || item.data.updated_at} iconName="event-busy" />
            )}
          </View>
        );
      case 'description':
        return (
          <View style={styles.descriptionSection}>
            <SectionHeader title="Case Description" />
            <Text style={styles.descriptionText}>{item.text}</Text>
          </View>
        );
      case 'documentsHeader':
        return <View style={styles.documentsSection}><SectionHeader title="Documents" /></View>;
      case 'loadingDocuments':
        return <View style={styles.centered}><ActivityIndicator color={theme.colors.primary || PRIMARY_BLUE_COLOR_FOR_LOADER} /></View>;
      case 'document':
        return (
          <DocumentCard
            document={item.data}
            onPress={() => handleDocumentInteraction(item.data)}
            onDownloadPress={() => handleDocumentInteraction(item.data)} // Assuming press and download do same for now
          />
        );
      case 'noDocuments':
        return <View style={styles.documentsSection}><Text style={styles.noItemsText}>No documents available.</Text></View>;
      case 'timelineHeader':
        return <View style={styles.timelineSection}><SectionHeader title="Case Timeline" /></View>;
      case 'timelineEvent':
        return <TimelineEventItem event={item.data} isLast={item.isLast} />;
      case 'noTimelineEvents':
        return <View style={styles.timelineSection}><Text style={styles.noItemsText}>No timeline events available.</Text></View>;
      default:
        return null;
    }
  };


  if (isLoading && !caseDetailsData) { // Show full screen loader only if no data at all yet
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary || PRIMARY_BLUE_COLOR_FOR_LOADER} />
        <Text style={styles.centeredText}>Loading Case Details...</Text>
      </View>
    );
  }

  if (!caseDetailsData && !isLoading) { // No data and not loading -> error or empty state
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>No case data found or error loading.</Text>
      </View>
    );
  }


  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={listData}
        renderItem={renderListItem}
        keyExtractor={(item, index) => {
            // Ensure unique keys based on type and content
            if ('id' in item && item.id) return item.id.toString();
            if ('type' in item) return `${item.type}-${index}`;
            return `item-${index}`;
        }}
        style={styles.container} // Use the old ScrollView's container style
        contentContainerStyle={styles.contentContainer} // Use the old ScrollView's contentContainerStyle
        // ListHeaderComponent could be used if there's content that should always be at the top
        // and not part of the itemized listData, but here everything is an item.
      />
      <View style={styles.bottomActionsContainer}>
        <ActionButton
          title="Edit Case"
          onPress={handleEditCase}
          type="primary"
          style={styles.bottomActionPrimary}
          disabled={isLoading || !caseDetailsData}
        />
        <ActionButton
          title="Add New Document"
          onPress={handleAddNewDocument}
          type="secondary"
          style={styles.bottomActionSecondary}
          disabled={isLoading || !caseDetailsData}
        />
      </View>
    </View>
  );
};

export default CaseDetailsScreen;
