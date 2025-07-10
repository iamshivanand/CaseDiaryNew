// Screens/CaseDetailsScreen/CaseDetailsScreen.tsx
import React, { useState, useEffect, useLayoutEffect, useCallback, useContext } from 'react';
import { View, Text, ScrollView, ActivityIndicator, FlatList, Alert, Platform, StyleSheet as ReactNativeStyleSheet } from 'react-native'; // Use ReactNativeStyleSheet alias for local styles if needed
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

import { HomeStackParamList } from '../../Types/navigationtypes';
import { CaseData, Document, TimelineEvent } from '../../Types/appTypes';
import * as db from '../../DataBase';
import { CaseWithDetails } from '../../DataBase';
import { ThemeContext, Theme } from '../../Providers/ThemeProvider';

import { getCaseDetailsScreenStyles } from './CaseDetailsScreenStyle';
import StatusBadge from './components/StatusBadge';
import DateRow from './components/DateRow';
import DocumentCard from './components/DocumentCard';
import TimelineEventItem from './components/TimelineEventItem';
import SectionHeader from '../CommonComponents/SectionHeader';
import ActionButton from '../CommonComponents/ActionButton';

type CaseDetailsScreenRouteProp = RouteProp<HomeStackParamList, 'CaseDetail'>;

const PRIMARY_BLUE_COLOR_FOR_LOADER = '#3B82F6'; // Fallback if theme not providing it

const CaseDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CaseDetailsScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const styles = getCaseDetailsScreenStyles(theme); // Generate themed styles

  const caseId = route.params?.caseId;

  const [caseDetailsData, setCaseDetailsData] = useState<CaseWithDetails | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Overall loading for the screen
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false); // Specific for document list

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
    setIsLoadingDocuments(true); // This can be true while main details are also loading or after
    try {
      const fetchedDocs = await db.getCaseDocuments(currentCaseId);
      const uiDocs: Document[] = fetchedDocs.map(dbDoc => ({
        id: dbDoc.id, case_id: dbDoc.case_id, fileName: dbDoc.original_display_name,
        uploadDate: dbDoc.created_at, fileType: dbDoc.file_type, fileSize: dbDoc.file_size,
        stored_filename: dbDoc.stored_filename,
      }));
      setDocuments(uiDocs);

      // Dummy Timeline Data (Replace with actual fetch: await db.getTimelineEventsByCaseId(currentCaseId))
      setTimelineEvents([
        { id: 'tl1', date: '2023-10-20T00:00:00.000Z', description: 'Initial consultation with client. Case details discussed extensively.', _status: 'synced' },
        { id: 'tl2', date: '2023-10-25T00:00:00.000Z', description: 'Case filed with the District Court of Cityville. All necessary paperwork submitted.', _status: 'synced' },
        { id: 'tl3', date: '2023-11-05T00:00:00.000Z', description: 'First hearing scheduled. Client and legal team prepared initial arguments.', _status: 'synced' },
      ]);
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
        timelineEvents: timelineEvents
      };
      navigation.navigate('EditCase', { initialCaseData: caseDataForEdit });
    }
  };

  const handleAddNewDocument = () => {
    if (caseDetailsData) {
       const caseDataForEdit: Partial<CaseData> = {
        ...caseDetailsData, Status: caseDetailsData.CaseStatus, FiledDate: caseDetailsData.dateFiled, HearingDate: caseDetailsData.NextDate, documents: documents, timelineEvents: timelineEvents
      };
      navigation.navigate('EditCase', { initialCaseData: caseDataForEdit });
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
        Alert.alert("Error", "File not found."); return;
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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary || PRIMARY_BLUE_COLOR_FOR_LOADER} />
        <Text style={styles.centeredText}>Loading Case Details...</Text>
      </View>
    );
  }

  if (!caseDetailsData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>No case data found or error loading.</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.summarySection}>
          <Text style={styles.mainCaseTitle}>{caseDetailsData.CaseTitle || 'N/A'}</Text>
          <Text style={styles.clientName}>Client: {caseDetailsData.ClientName || caseDetailsData.OnBehalfOf || 'N/A'}</Text>
          <StatusBadge status={caseDetailsData.CaseStatus} />
          <DateRow label="Filed" dateString={caseDetailsData.dateFiled} iconName="gavel" />
          {caseDetailsData.CaseStatus === 'Closed' && (
             <DateRow label="Closed" dateString={caseDetailsData.ClosedDate || caseDetailsData.updated_at} iconName="event-busy" />
          )}
        </View>

        {caseDetailsData.CaseDescription && (
            <View style={styles.descriptionSection}>
                <SectionHeader title="Case Description" />
                <Text style={styles.descriptionText}>{caseDetailsData.CaseDescription}</Text>
            </View>
        )}

        <View style={styles.documentsSection}>
            <SectionHeader title="Documents" />
            {isLoadingDocuments ? <ActivityIndicator color={theme.colors.primary || PRIMARY_BLUE_COLOR_FOR_LOADER} /> : documents.length > 0 ? (
                <FlatList
                    data={documents}
                    renderItem={({item}) => (
                        <DocumentCard
                            document={item}
                            onPress={() => handleDocumentInteraction(item)}
                            onDownloadPress={() => handleDocumentInteraction(item)}
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <Text style={styles.noItemsText}>No documents available.</Text>
            )}
        </View>

        <View style={styles.timelineSection}>
            <SectionHeader title="Case Timeline" />
             {timelineEvents.length > 0 ? (
                <FlatList
                    data={timelineEvents}
                    renderItem={({item, index}) => <TimelineEventItem event={item} isLast={index === timelineEvents.length -1} />}
                    keyExtractor={(item) => item._clientSideId || item.id.toString()} // Use clientSideId for new items
                />
            ) : (
                <Text style={styles.noItemsText}>No timeline events available.</Text>
            )}
        </View>
      </ScrollView>

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
