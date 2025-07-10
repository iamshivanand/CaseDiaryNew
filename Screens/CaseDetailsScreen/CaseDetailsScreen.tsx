// Screens/CaseDetailsScreen/CaseDetailsScreen.tsx
import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, FlatList, Alert, StyleSheet as RNStyleSheet, Platform } from 'react-native'; // Added Platform
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher'; // For Android
import * as Sharing from 'expo-sharing'; // For iOS or cross-platform sharing

import { HomeStackParamList } from '../../Types/navigationtypes';
import { CaseData, Document, TimelineEvent } from '../../Types/appTypes';
import * as db from '../../DataBase';
import { CaseWithDetails } from '../../DataBase';
import { ThemeContext, Theme } from '../../Providers/ThemeProvider'; // Import ThemeContext and Theme type

import { getCaseDetailsScreenStyles } from './CaseDetailsScreenStyle'; // Import the function
// Import sub-components - these will be created in ./components/ with new names
import StatusBadge from './components/StatusBadge';
import DateRow from './components/DateRow';
import DocumentCard from './components/DocumentCard';
import TimelineEventItem from './components/TimelineEventItem';
import SectionHeader from '../CommonComponents/SectionHeader';
import ActionButton from '../CommonComponents/ActionButton';

type CaseDetailsScreenRouteProp = RouteProp<HomeStackParamList, 'CaseDetail'>;

// Define PRIMARY_BLUE_COLOR_FOR_LOADER or import from theme if available
const PRIMARY_BLUE_COLOR_FOR_LOADER = '#3B82F6';

const CaseDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CaseDetailsScreenRouteProp>();
  const { theme } = useContext(ThemeContext); // Get theme from context
  const styles = getCaseDetailsScreenStyles(theme); // Generate styles with theme

  const caseId = route.params?.caseId;

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

      setTimelineEvents([ // Dummy Timeline Data
        { id: 'tl1', date: '2023-10-20T00:00:00.000Z', description: 'Initial consultation with client. Case details discussed extensively.' },
        { id: 'tl2', date: '2023-10-25T00:00:00.000Z', description: 'Case filed with the District Court of Cityville. All necessary paperwork submitted.' },
        { id: 'tl3', date: '2023-11-05T00:00:00.000Z', description: 'First hearing scheduled. Client and legal team prepared initial arguments.' },
      ]);
    } catch (error) {
      console.error("Error loading associated data for case:", error);
      Alert.alert("Error", "Could not load associated case data.");
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    const caseIdToLoad = route.params?.caseId;
    const fetchData = async () => {
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
    fetchData();
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
      Alert.alert("Not Available", "This document is not stored locally or its path is missing.");
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
        Alert.alert("Error", "File not found. It might have been deleted or is not accessible.");
        return;
      }

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(localDocumentPath);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: doc.fileType || '*/*', // Use stored MIME type
        });
      } else if (Platform.OS === 'ios') {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localDocumentPath, {
            mimeType: doc.fileType || undefined, // Use stored MIME type
            dialogTitle: `Open or Share ${doc.fileName}`,
            UTI: doc.fileType || undefined, // Provide UTI if known, helps iOS pick apps
          });
        } else {
          Alert.alert("Unavailable", "Sharing is not available on this device.");
        }
      } else {
        // For other platforms or as a generic fallback
        Alert.alert("Open Document", `File saved at: ${localDocumentPath}. Please open manually.`);
      }
    } catch (error: any) {
      console.error("Error opening document:", error);
      Alert.alert("Error Opening File", error.message || "Could not open document. Please ensure you have a compatible app installed.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE_COLOR_FOR_LOADER} />
        <Text>Loading Case Details...</Text>
      </View>
    );
  }

  if (!caseDetailsData) {
    return (
      <View style={styles.centered}>
        <Text>No case data found or error loading.</Text>
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
            {isLoadingDocuments ? <ActivityIndicator /> : documents.length > 0 ? (
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
                    keyExtractor={(item) => item.id.toString()}
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
