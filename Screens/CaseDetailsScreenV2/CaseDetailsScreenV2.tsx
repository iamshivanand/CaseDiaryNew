// Screens/CaseDetailsScreenV2/CaseDetailsScreenV2.tsx
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Example, choose your icon set

import { HomeStackParamList } from '../../Types/navigationtypes'; // Assuming it's in HomeStack
import { CaseData, Document, TimelineEvent } from '../../Types/appTypes'; // Main data types
import * as db from '../../DataBase'; // Database functions
import { CaseWithDetails } from '../../DataBase'; // Type from DB functions

import { CaseDetailsScreenV2Styles as styles } from './CaseDetailsScreenV2Style';
// Import sub-components
import StatusBadgeV2 from './components/StatusBadgeV2';
import DateRowV2 from './components/DateRowV2';
import DocumentCardV2 from './components/DocumentCardV2';
import TimelineEventItemV2 from './components/TimelineEventItemV2';
import SectionHeader from '../CommonComponents/SectionHeader';
import ActionButton from '../CommonComponents/ActionButton';


// Define Route Prop Type for this screen
// Assuming 'CaseDetailsV2' will be the route name in HomeStackParamList
// And it will receive a 'caseId'
type CaseDetailsScreenV2RouteProp = RouteProp<HomeStackParamList, 'CaseDetailsV2'>;


const CaseDetailsScreenV2: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CaseDetailsScreenV2RouteProp>();
  const caseId = route.params?.caseId; // Expecting caseId to be passed

  const [caseDetailsData, setCaseDetailsData] = useState<CaseWithDetails | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]); // Using dummy for now
  const [isLoading, setIsLoading] = useState(true);

  // Set Header Title
  useLayoutEffect(() => {
    if (caseDetailsData?.CaseTitle) {
      navigation.setOptions({ title: caseDetailsData.CaseTitle });
    } else if (route.params?.caseTitleHeader) { // Fallback if full data not yet loaded but title passed
        navigation.setOptions({ title: route.params.caseTitleHeader });
    } else {
      navigation.setOptions({ title: 'Case Details' });
    }
  }, [navigation, caseDetailsData, route.params?.caseTitleHeader]);

  // Fetch Case Details and Documents
  useEffect(() => {
    if (!caseId) {
      Alert.alert("Error", "No Case ID provided.");
      setIsLoading(false);
      navigation.goBack();
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fetchedCase = await db.getCaseById(caseId);
        if (fetchedCase) {
          setCaseDetailsData(fetchedCase);
          // Fetch documents separately
          const fetchedDocs = await db.getCaseDocuments(caseId);
          const uiDocs: Document[] = fetchedDocs.map(dbDoc => ({
            id: dbDoc.id, case_id: dbDoc.case_id, fileName: dbDoc.original_display_name,
            uploadDate: dbDoc.created_at, fileType: dbDoc.file_type, fileSize: dbDoc.file_size,
            stored_filename: dbDoc.stored_filename,
          }));
          setDocuments(uiDocs);

          // Dummy Timeline Data (replace with actual fetch if available)
          setTimelineEvents([
            { id: 'tl1', date: '2023-10-20T00:00:00.000Z', description: 'Initial consultation with client.' },
            { id: 'tl2', date: '2023-10-25T00:00:00.000Z', description: 'Case filed with the court.' },
          ]);

        } else {
          Alert.alert("Error", "Case not found.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
        Alert.alert("Error", "Could not load case details.");
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [caseId, navigation]);

  const handleEditCase = () => {
    if (caseDetailsData) {
      // Map CaseWithDetails to Partial<CaseData> for EditCaseScreen
      const caseDataForEdit: Partial<CaseData> = {
        ...caseDetailsData, // Spread all common fields
        Status: caseDetailsData.CaseStatus, // Map DB CaseStatus to form's Status
        FiledDate: caseDetailsData.dateFiled, // Map DB dateFiled to form's FiledDate
        HearingDate: caseDetailsData.NextDate, // Map DB NextDate to form's HearingDate
        documents: documents, // Pass loaded documents
        timelineEvents: timelineEvents // Pass timeline events
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
      // Consider navigating to a specific part of EditCaseScreen if possible/needed,
      // or EditCaseScreen could have logic to show document section if a param is passed.
      Alert.alert("Add Document", "Navigating to Edit Case to add documents.");
    }
  };


  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
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

  // Placeholder for document download/view action
  const handleDocumentInteraction = (doc: Document) => {
    Alert.alert("Document Action", `Interacting with: ${doc.fileName}`);
    // Here you would implement actual view/download logic using doc.stored_filename or doc.uri
  };

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Case Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.mainCaseTitle}>{caseDetailsData.CaseTitle || 'N/A'}</Text>
          <Text style={styles.clientName}>Client: {caseDetailsData.ClientName || caseDetailsData.OnBehalfOf || 'N/A'}</Text>
          <StatusBadgeV2 status={caseDetailsData.CaseStatus} />
          <DateRowV2 label="Filed" dateString={caseDetailsData.dateFiled} iconName="gavel" />
          {/* Changed icon to gavel for filed, event for closed */}
          {caseDetailsData.CaseStatus === 'Closed' && (
             <DateRowV2 label="Closed" dateString={caseDetailsData.ClosedDate || caseDetailsData.updated_at} iconName="event-busy" />
             // Using updated_at as a fallback for ClosedDate if not present
          )}
        </View>

        {/* Case Description */}
        {caseDetailsData.CaseDescription && (
            <View style={styles.descriptionSection}>
                <SectionHeader title="Case Description" />
                <Text style={styles.descriptionText}>{caseDetailsData.CaseDescription}</Text>
            </View>
        )}

        {/* Documents Section */}
        <View style={styles.documentsSection}>
            <SectionHeader title="Documents" />
            {documents.length > 0 ? (
                <FlatList
                    data={documents}
                    renderItem={({item}) => (
                        <DocumentCardV2
                            document={item}
                            onPress={() => handleDocumentInteraction(item)}
                            onDownloadPress={() => handleDocumentInteraction(item)} // Same action for now
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <Text style={styles.noItemsText}>{isLoadingDocuments ? "Loading documents..." : "No documents available."}</Text>
            )}
        </View>

        {/* Case Timeline Section */}
        <View style={styles.timelineSection}>
            <SectionHeader title="Case Timeline" />
             {timelineEvents.length > 0 ? (
                <FlatList
                    data={timelineEvents}
                    renderItem={({item, index}) => <TimelineEventItemV2 event={item} isLast={index === timelineEvents.length -1} />}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <Text style={styles.noItemsText}>No timeline events available.</Text>
            )}
        </View>
      </ScrollView>

       {/* Bottom Actions */}
      <View style={styles.bottomActionsContainer}>
        <ActionButton
          title="Edit Case"
          onPress={handleEditCase}
          type="primary"
          style={styles.bottomActionPrimary}
          disabled={isLoading} // Disable if still loading initial details
        />
        <ActionButton
          title="Add New Document"
          onPress={handleAddNewDocument}
          type="secondary"
          style={styles.bottomActionSecondary}
          disabled={isLoading} // Disable if still loading initial details
        />
      </View>
    </View>
  );
};

// Removed temporary inline styles, styles should be fully from CaseDetailsScreenV2Style.ts

export default CaseDetailsScreenV2;

// Add to HomeStackParamList in Types/navigationtypes.ts:
// CaseDetailsV2: { caseId: number, caseTitleHeader?: string };
// Ensure CaseData in Types/appTypes.ts includes:
// ClosedDate?: string | null; (already there from EditCaseScreen work)
