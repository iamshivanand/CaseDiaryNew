// Screens/EditCase/EditCaseScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Alert, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as db from '../../DataBase';

import { EditCaseScreenStyles } from './EditCaseScreenStyle';
import FormInput from '../CommonComponents/FormInput';
import DropdownPicker from '../CommonComponents/DropdownPicker';
import DatePickerField from '../CommonComponents/DatePickerField';
import SectionHeader from '../CommonComponents/SectionHeader';
import ActionButton from '../CommonComponents/ActionButton';
import DocumentItem from './components/DocumentItem';
import TimelineItem from './components/TimelineItem';

import { CaseData, Document, TimelineEvent, DropdownOption, caseStatusOptions, priorityOptions } from "../../Types/appTypes";
import { RootStackParamList } from "../../Types/navigationtypes";
import { CaseWithDetails } from '../../DataBase';


const dummyCaseTypeOptions: DropdownOption[] = [
  { label: 'Select Case Type...', value: '' }, { label: 'Civil Suit', value: 1 }, { label: 'Criminal Defense', value: 2 }, { label: 'Family Law', value: 3 }, { label: 'Corporate', value: 4 }, { label: 'Other', value: 99 },
];
const dummyCourtOptions: DropdownOption[] = [
  { label: 'Select Court...', value: '' }, { label: 'District Court - City Center', value: 1 }, { label: 'High Court - State Capital', value: 2 }, { label: 'Supreme Court', value: 3 },
];

type EditCaseScreenRouteProp = RouteProp<RootStackParamList, 'EditCase'>;

const EditCaseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditCaseScreenRouteProp>();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCaseDetails, setIsLoadingCaseDetails] = useState(true);
  const initialCaseId = route.params?.initialCaseData?.id; // Get ID from initial summary data

  const [caseData, setCaseData] = useState<Partial<CaseData>>({});
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]); // Assuming timeline might also be fetched or part of CaseData
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const loadDocuments = useCallback(async (currentCaseId: number) => {
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
    } catch (error) {
      console.error("Error loading documents for case:", error);
      Alert.alert("Error", "Could not load documents.");
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);


  useEffect(() => {
    const caseIdToLoad = initialCaseId; // Use the ID passed in navigation params

    const fetchCaseDetailsAndDocuments = async () => {
      if (!caseIdToLoad || typeof caseIdToLoad !== 'number') {
        Alert.alert("Error", "No valid Case ID provided to edit.");
        setIsLoadingCaseDetails(false);
        navigation.goBack();
        return;
      }

      setIsLoadingCaseDetails(true);
      try {
        const fetchedCase = await db.getCaseById(caseIdToLoad);
        if (fetchedCase) {
          // Map CaseWithDetails (from DB) to CaseData (for form state)
          const formState: Partial<CaseData> = {
            id: fetchedCase.id,
            uniqueId: fetchedCase.uniqueId,
            CaseTitle: fetchedCase.CaseTitle,
            ClientName: fetchedCase.ClientName,
            OnBehalfOf: fetchedCase.OnBehalfOf,
            CNRNumber: fetchedCase.CNRNumber,
            case_number: fetchedCase.case_number,
            court_id: fetchedCase.court_id,
            court_name: fetchedCase.court_name, // From DB
            case_type_id: fetchedCase.case_type_id,
            case_type_name: fetchedCase.case_type_name, // From DB
            FiledDate: fetchedCase.dateFiled, // DB stores as dateFiled, form uses FiledDate
            dateFiled: fetchedCase.dateFiled, // Keep original for comparison if needed
            JudgeName: fetchedCase.JudgeName,
            OpposingCounsel: fetchedCase.OpposingCounsel,
            OppositeAdvocate: fetchedCase.OppositeAdvocate,
            Status: fetchedCase.CaseStatus, // DB stores as CaseStatus, form uses Status
            CaseStatus: fetchedCase.CaseStatus, // Keep original
            Priority: fetchedCase.Priority,
            HearingDate: fetchedCase.NextDate, // DB stores as NextDate, form uses HearingDate
            NextDate: fetchedCase.NextDate, // Keep original
            StatuteOfLimitations: fetchedCase.StatuteOfLimitations,
            ClosedDate: null, // Assuming ClosedDate is not directly in CaseRow yet, or needs specific logic
            FirstParty: fetchedCase.FirstParty,
            OppositeParty: fetchedCase.OppositeParty,
            ClientContactNumber: fetchedCase.ClientContactNumber,
            Accussed: fetchedCase.Accussed,
            Undersection: fetchedCase.Undersection,
            police_station_id: fetchedCase.police_station_id,
            OppAdvocateContactNumber: fetchedCase.OppAdvocateContactNumber,
            PreviousDate: fetchedCase.PreviousDate,
            CaseDescription: fetchedCase.CaseDescription,
            CaseNotes: fetchedCase.CaseNotes,
            // documents and timelineEvents are handled separately or if part of CaseData from DB
          };
          setCaseData(formState);
          navigation.setOptions({ title: `Edit: ${fetchedCase.CaseTitle || 'Case'}` });
          await loadDocuments(caseIdToLoad);
          // TODO: Load timeline events if they are separate
        } else {
          Alert.alert("Error", "Case not found.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
        Alert.alert("Error", "Could not load case details.");
        navigation.goBack();
      } finally {
        setIsLoadingCaseDetails(false);
      }
    };

    fetchCaseDetailsAndDocuments();
  }, [navigation, initialCaseId, loadDocuments]);

  const handleInputChange = (field: keyof CaseData, value: string | number | Date | null | undefined) => {
    setCaseData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!caseData.id || typeof caseData.id !== 'number') {
      Alert.alert("Error", "Case ID is missing or invalid. Cannot update.");
      return;
    }
    if (!caseData.CaseTitle?.trim()) {
      Alert.alert('Validation Error', 'Case Title is required.');
      return;
    }
    setIsSaving(true);
    let overallSuccess = true;
    try {
      const selectedCourtOption = dummyCourtOptions.find(opt => opt.value === caseData.court_id);
      const courtNameForDb = selectedCourtOption && selectedCourtOption.value !== '' ? selectedCourtOption.label : caseData.court_name || null;
      const selectedCaseTypeOption = dummyCaseTypeOptions.find(opt => opt.value === caseData.case_type_id);
      const caseTypeNameForDb = selectedCaseTypeOption && selectedCaseTypeOption.value !== '' ? selectedCaseTypeOption.label : caseData.case_type_name || null;

      const updatePayload: db.CaseUpdateData = {
        CaseTitle: caseData.CaseTitle, ClientName: caseData.ClientName, CNRNumber: caseData.CNRNumber,
        court_id: caseData.court_id || null, court_name: courtNameForDb,
        dateFiled: caseData.FiledDate || caseData.dateFiled,
        case_type_id: caseData.case_type_id || null, case_type_name: caseTypeNameForDb,
        case_number: caseData.case_number, case_year: caseData.case_year ? Number(caseData.case_year) : null,
        crime_number: caseData.crime_number, crime_year: caseData.crime_year ? Number(caseData.crime_year) : null,
        JudgeName: caseData.JudgeName, OnBehalfOf: caseData.OnBehalfOf, FirstParty: caseData.FirstParty,
        OppositeParty: caseData.OppositeParty, ClientContactNumber: caseData.ClientContactNumber,
        Accussed: caseData.Accussed, Undersection: caseData.Undersection,
        police_station_id: caseData.police_station_id || null, StatuteOfLimitations: caseData.StatuteOfLimitations,
        OpposingCounsel: caseData.OpposingCounsel, OppositeAdvocate: caseData.OppositeAdvocate,
        OppAdvocateContactNumber: caseData.OppAdvocateContactNumber, CaseStatus: caseData.Status || caseData.CaseStatus,
        Priority: caseData.Priority, PreviousDate: caseData.PreviousDate,
        NextDate: caseData.HearingDate || caseData.NextDate,
        CaseDescription: caseData.CaseDescription, CaseNotes: caseData.CaseNotes,
      };
      Object.keys(updatePayload).forEach(key => {
        const K = key as keyof db.CaseUpdateData;
        if (updatePayload[K] === undefined) { delete updatePayload[K]; }
      });

      const caseUpdateSuccess = await db.updateCase(caseData.id as number, updatePayload);

      if (caseUpdateSuccess) {
        console.log('Case data updated successfully.');
        const newDocsToUpload = documents.filter(doc => doc.uri && typeof doc.id === 'number' && doc.id > 1000000);
        for (const newDoc of newDocsToUpload) {
          try {
            if (typeof caseData.id !== 'number') throw new Error("Invalid case ID for document upload.");
            const uploadedDocId = await db.uploadCaseDocument({
              caseId: caseData.id, originalFileName: newDoc.fileName,
              fileType: newDoc.fileType || 'application/octet-stream', fileUri: newDoc.uri as string,
              fileSize: newDoc.fileSize, userId: null,
            });
            if (!uploadedDocId) { overallSuccess = false; console.error(`Failed to upload document: ${newDoc.fileName}`);}
            else { console.log(`Document ${newDoc.fileName} uploaded with ID ${uploadedDocId}`);}
          } catch (uploadError) { overallSuccess = false; console.error(`Error during upload of ${newDoc.fileName}:`, uploadError); }
        }

        if (typeof caseData.id === 'number') await loadDocuments(caseData.id);

        if (overallSuccess) { Alert.alert('Success', 'Case details and documents saved successfully.'); navigation.goBack(); }
        else { Alert.alert('Partial Success', 'Case details saved, but some document operations may have failed. Please review.'); }
      } else { overallSuccess = false; Alert.alert('Error', 'Failed to update case details. Documents were not processed.'); }
    } catch (error) { overallSuccess = false; console.error("Error saving case details:", error); Alert.alert('Error', 'An error occurred while saving.'); }
    finally { setIsSaving(false); }
  };

  const handleCancel = () => { navigation.goBack(); };

  const handleAddDocument = async () => {
    if (typeof caseData.id !== 'number') {
        Alert.alert("Error", "Cannot add document: Case ID is not available. Save the case first if this is a new record being edited (unusual flow).");
        return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      if (!asset.uri) { Alert.alert("Error", "Could not get document URI."); return; }
      const newDocument: Document = {
        id: Date.now(), case_id: caseData.id, fileName: asset.name || `document_${Date.now()}`,
        uploadDate: new Date().toISOString(), fileType: asset.mimeType || asset.name?.split('.').pop() || 'unknown',
        fileSize: asset.size, uri: asset.uri,
      };
      setDocuments((prevDocs) => [...prevDocs, newDocument]);
      Alert.alert("Document Added", `${newDocument.fileName} added. Save changes to persist.`);
    } catch (error) { console.error("Error picking document:", error); Alert.alert("Error", "Error picking document."); }
  };

  const handleViewDocument = (doc: Document) => { Alert.alert('View Document', `Viewing: ${doc.fileName}`); };
  const handleEditDocument = (doc: Document) => { Alert.alert('Edit Document Metadata', `Editing metadata for: ${doc.fileName}`); };

  const handleDeleteDocument = async (docToDelete: Document) => {
    const isNewUnsavedDoc = !!docToDelete.uri && typeof docToDelete.id === 'number' && docToDelete.id > 1000000;
    if (isNewUnsavedDoc) {
      setDocuments(docs => docs.filter(d => d.id !== docToDelete.id));
      Alert.alert("Document Removed", `${docToDelete.fileName} removed from list.`);
      return;
    }
    if (typeof docToDelete.id !== 'number') {
        Alert.alert("Error", "Document ID is invalid for deletion.");
        return;
    }
    Alert.alert("Confirm Deletion", `Delete "${docToDelete.fileName}"? This cannot be undone.`,
      [{ text: "Cancel", style: "cancel" },
       { text: "Delete Permanently", style: "destructive", onPress: async () => {
           try {
             setIsLoadingDocuments(true);
             const success = await db.deleteCaseDocument(docToDelete.id);
             if (success) { setDocuments(docs => docs.filter(d => d.id !== docToDelete.id)); Alert.alert("Deleted", `"${docToDelete.fileName}" deleted.`); }
             else { Alert.alert("Error", `Failed to delete "${docToDelete.fileName}" from DB.`); }
           } catch (error) { console.error("Error deleting document from DB:", error); Alert.alert("Error", "Error deleting document."); }
           finally { setIsLoadingDocuments(false); }
         }
       }]
    );
  };

  const handleAddTimelineEvent = () => { Alert.alert('Add Timeline Event', 'Implement form.'); };
  const handleEditTimelineEvent = (event: TimelineEvent) => { Alert.alert('Edit Timeline Event', event.description.substring(0,30)); };
  const handleDeleteTimelineEvent = (eventToDelete: TimelineEvent) => {
     Alert.alert('Confirm Deletion', `Delete this event?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => setTimelineEvents(events => events.filter(e => e.id !== eventToDelete.id)), style: 'destructive' }
    ]);
  };

  if (isLoadingCaseDetails) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={EditCaseScreenStyles.screen.backgroundColor === '#F3F4F6' ? "#1D4ED8" : undefined} />
        <Text>Loading case details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={EditCaseScreenStyles.screen} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
        <View style={EditCaseScreenStyles.formContainer}>
          <FormInput label="Case Title*" value={caseData.CaseTitle || ''} onChangeText={(text) => handleInputChange('CaseTitle', text)} placeholder="e.g., Acme Corp vs. Beta Inc." />
          <FormInput label="Client Name" value={caseData.ClientName || ''} onChangeText={(text) => handleInputChange('ClientName', text)} placeholder="Enter client's full name" />
          <FormInput label="On Behalf Of" value={caseData.OnBehalfOf || ''} onChangeText={(text) => handleInputChange('OnBehalfOf', text)} placeholder="Representing whom?" />
          <FormInput label="Case Number" value={caseData.case_number || ''} onChangeText={(text) => handleInputChange('case_number', text)} placeholder="e.g., CS/123/2023" />
          <FormInput label="CNR Number" value={caseData.CNRNumber || ''} onChangeText={(text) => handleInputChange('CNRNumber', text)} placeholder="Enter CNR Number" />

          <DropdownPicker label="Case Type" selectedValue={caseData.case_type_id || ""} onValueChange={(val) => handleInputChange('case_type_id', val as number)} options={dummyCaseTypeOptions} placeholder="Select Case Type..." />
          <DropdownPicker label="Court" selectedValue={caseData.court_id || ""} onValueChange={(val) => handleInputChange('court_id', val as number)} options={dummyCourtOptions} placeholder="Select Court..." />

          <FormInput label="Presiding Judge" value={caseData.JudgeName || ''} onChangeText={(text) => handleInputChange('JudgeName', text)} placeholder="Enter judge's name" />
          <FormInput label="Opposing Counsel" value={caseData.OpposingCounsel || ''} onChangeText={(text) => handleInputChange('OpposingCounsel', text)} placeholder="Enter opposing counsel's name" />
          {/* <FormInput label="Opposite Advocate" value={caseData.OppositeAdvocate || ''} onChangeText={(text) => handleInputChange('OppositeAdvocate', text)} placeholder="Enter opposite advocate (if different)" /> */}

          <DropdownPicker label="Case Status" selectedValue={caseData.Status || ""} onValueChange={(val) => handleInputChange('Status', val as string)} options={caseStatusOptions} placeholder="Select Status..." />
          <DropdownPicker label="Priority Level" selectedValue={caseData.Priority || ""} onValueChange={(val) => handleInputChange('Priority', val as string)} options={priorityOptions} placeholder="Select Priority..." />

          <DatePickerField label="Date Filed" value={caseData.FiledDate ? new Date(caseData.FiledDate) : null} onChange={(date) => handleInputChange('FiledDate', date ? date.toISOString() : null)} placeholder="Select date case was filed" />
          <DatePickerField label="Next Hearing Date" value={caseData.HearingDate ? new Date(caseData.HearingDate) : null} onChange={(date) => handleInputChange('HearingDate', date ? date.toISOString() : null)} placeholder="Select next hearing date" />
          <DatePickerField label="Statute of Limitations" value={caseData.StatuteOfLimitations ? new Date(caseData.StatuteOfLimitations) : null} onChange={(date) => handleInputChange('StatuteOfLimitations', date ? date.toISOString() : null)} placeholder="Select SOL date" />

          {(caseData.Status === 'Closed') && (
            <DatePickerField label="Date Closed" value={caseData.ClosedDate ? new Date(caseData.ClosedDate) : null} onChange={(date) => handleInputChange('ClosedDate', date ? date.toISOString() : null)} placeholder="Select date case was closed" />
          )}

          <FormInput label="First Party" value={caseData.FirstParty || ''} onChangeText={(text) => handleInputChange('FirstParty', text)} placeholder="Enter First Party Name" />
          <FormInput label="Opposite Party" value={caseData.OppositeParty || ''} onChangeText={(text) => handleInputChange('OppositeParty', text)} placeholder="Enter Opposite Party Name" />
          <FormInput label="Client Contact No." value={caseData.ClientContactNumber || ''} onChangeText={(text) => handleInputChange('ClientContactNumber', text)} placeholder="Enter Client's Contact Number" keyboardType="phone-pad" />
          <FormInput label="Accused" value={caseData.Accussed || ''} onChangeText={(text) => handleInputChange('Accussed', text)} placeholder="Enter Accused Name(s)" />
          <FormInput label="Under Section(s)" value={caseData.Undersection || ''} onChangeText={(text) => handleInputChange('Undersection', text)} placeholder="e.g., Section 302 IPC" />

          <FormInput label="Case Description" value={caseData.CaseDescription || ''} onChangeText={(text) => handleInputChange('CaseDescription', text)} placeholder="Provide a brief summary..." multiline numberOfLines={4} style={{minHeight: 80}} />
          <FormInput label="Internal Notes / Strategy" value={caseData.CaseNotes || ''} onChangeText={(text) => handleInputChange('CaseNotes', text)} placeholder="Add any private notes..." multiline numberOfLines={4} style={{minHeight: 80}}/>

          <SectionHeader title="Case Documents" />
          <View style={EditCaseScreenStyles.listContainer}>
            {documents.length > 0 ? documents.map(doc => (
              <DocumentItem key={doc.id.toString()} document={doc} onView={handleViewDocument} onEdit={handleEditDocument} onDelete={handleDeleteDocument} />
            )) : <Text style={styles.emptyListText}>{isLoadingDocuments ? 'Loading documents...' : 'No documents uploaded yet.'}</Text>}
            <View style={EditCaseScreenStyles.addNewButtonContainer}>
              <ActionButton title="Add New Document" onPress={handleAddDocument} type="dashed" style={EditCaseScreenStyles.fullWidthDashedButton} leftIcon={<MaterialIcons name="attach-file" size={20} color="#1D4ED8" />} />
            </View>
          </View>

          <SectionHeader title="Case Timeline" />
          <View style={EditCaseScreenStyles.listContainer}>
            {timelineEvents.length > 0 ? timelineEvents.map((event, index) => (
              <TimelineItem key={event.id} item={event} onEdit={handleEditTimelineEvent} onDelete={handleDeleteTimelineEvent} isLastItem={index === timelineEvents.length - 1} />
            )) : <Text style={styles.emptyListText}>No timeline events recorded yet.</Text>}
            <View style={EditCaseScreenStyles.addNewButtonContainer}>
              <ActionButton title="Add New Timeline Event" onPress={handleAddTimelineEvent} type="dashed" style={EditCaseScreenStyles.fullWidthDashedButton} leftIcon={<Ionicons name="calendar-outline" size={20} color="#1D4ED8" />} />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={EditCaseScreenStyles.bottomButtonContainer}>
        <View style={EditCaseScreenStyles.buttonWrapper}>
          <ActionButton title="Cancel" onPress={handleCancel} type="secondary" disabled={isSaving} />
        </View>
        <View style={EditCaseScreenStyles.buttonWrapper}>
          <ActionButton title="Save Changes" onPress={handleSave} type="primary" loading={isSaving} disabled={isSaving} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContentContainer: { flexGrow: 1 },
  emptyListText: { textAlign: 'center', color: '#6B7280', fontSize: 14, paddingVertical: 20 }
});

export default EditCaseScreen;
