// Screens/EditCase/EditCaseScreen.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
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
  const initialCaseDataFromParams = route.params?.initialCaseData;

  const [caseData, setCaseData] = useState<Partial<CaseData>>(() => {
    const defaults: Partial<CaseData> = {
      Status: caseStatusOptions.find(opt => opt.label === "Open")?.value || caseStatusOptions[0].value,
      Priority: priorityOptions.find(opt => opt.label === "Medium")?.value || priorityOptions[0].value,
    };
    let initialData = initialCaseDataFromParams ? { ...defaults, ...initialCaseDataFromParams } : { ...defaults };
    if (initialData.court_name && (initialData.court_id === undefined || initialData.court_id === null || initialData.court_id === '')) {
      const foundCourt = dummyCourtOptions.find(opt => opt.label === initialData.court_name);
      if (foundCourt && foundCourt.value !== '') { initialData.court_id = foundCourt.value as number; }
    }
    if (initialData.case_type_name && (initialData.case_type_id === undefined || initialData.case_type_id === null || initialData.case_type_id === '')) {
      const foundCaseType = dummyCaseTypeOptions.find(opt => opt.label === initialData.case_type_name);
      if (foundCaseType && foundCaseType.value !== '') { initialData.case_type_id = foundCaseType.value as number; }
    }
    return initialData;
  });

  const [documents, setDocuments] = useState<Document[]>(initialCaseDataFromParams?.documents || []);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialCaseDataFromParams?.timelineEvents || []);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const loadDocuments = async (currentCaseId: number | string | undefined) => {
    if (!currentCaseId || typeof currentCaseId !== 'number') {
      setDocuments(initialCaseDataFromParams?.documents || []);
      return;
    }
    setIsLoadingDocuments(true);
    try {
      const fetchedDocs = await db.getCaseDocuments(currentCaseId as number);
      const uiDocs: Document[] = fetchedDocs.map(dbDoc => ({
        id: dbDoc.id, case_id: dbDoc.case_id, fileName: dbDoc.original_display_name,
        uploadDate: dbDoc.created_at, fileType: dbDoc.file_type, fileSize: dbDoc.file_size,
        stored_filename: dbDoc.stored_filename,
      }));
      setDocuments(uiDocs);
    } catch (error) {
      console.error("Error loading documents for case:", error);
      Alert.alert("Error", "Could not load documents.");
      setDocuments(initialCaseDataFromParams?.documents || []);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: initialCaseDataFromParams ? 'Edit Case Details' : 'Add New Case (Error state - EditScreen should have ID)' });
    if (initialCaseDataFromParams?.id) {
      loadDocuments(initialCaseDataFromParams.id);
    } else {
       // This screen is for EDITING, so an ID should always be present.
       // If no ID, it implies a new case, which should use AddCaseScreen.
       // Or, if initialCaseDataFromParams is truly for a new case being "edited" before first save:
       setDocuments(initialCaseDataFromParams?.documents || []);
       if (!initialCaseDataFromParams?.uniqueId && !initialCaseDataFromParams?.id) {
         // If it's truly a new case without even a uniqueId, this screen might not be appropriate.
         // For now, we assume `initialCaseDataFromParams` implies an existing case if `id` is present.
         console.warn("EditCaseScreen loaded without case ID or uniqueId in initialCaseDataFromParams.");
       }
    }
  }, [navigation, initialCaseDataFromParams]);

  const handleInputChange = (field: keyof CaseData, value: string | number | Date | null | undefined) => {
    setCaseData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!caseData.id || typeof caseData.id !== 'number') { // Ensure ID is a number for DB operations
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

      // Construct payload based on CaseUpdateData (derived from CaseRow schema)
      const updatePayload: db.CaseUpdateData = {
        CaseTitle: caseData.CaseTitle,
        ClientName: caseData.ClientName,
        CNRNumber: caseData.CNRNumber,
        court_id: caseData.court_id || null,
        court_name: courtNameForDb,
        dateFiled: caseData.FiledDate || caseData.dateFiled, // Use form's FiledDate first
        case_type_id: caseData.case_type_id || null,
        case_type_name: caseTypeNameForDb,
        case_number: caseData.case_number,
        case_year: caseData.case_year ? Number(caseData.case_year) : null,
        crime_number: caseData.crime_number,
        crime_year: caseData.crime_year ? Number(caseData.crime_year) : null,
        JudgeName: caseData.JudgeName,
        OnBehalfOf: caseData.OnBehalfOf, // If form has ClientName, ensure mapping is correct for DB
        FirstParty: caseData.FirstParty,
        OppositeParty: caseData.OppositeParty,
        ClientContactNumber: caseData.ClientContactNumber,
        Accussed: caseData.Accussed,
        Undersection: caseData.Undersection,
        police_station_id: caseData.police_station_id || null,
        StatuteOfLimitations: caseData.StatuteOfLimitations,
        OpposingCounsel: caseData.OpposingCounsel, // From form
        OppositeAdvocate: caseData.OppositeAdvocate, // From loaded data if not on form
        OppAdvocateContactNumber: caseData.OppAdvocateContactNumber,
        CaseStatus: caseData.Status || caseData.CaseStatus, // Form 'Status' maps to DB 'CaseStatus'
        Priority: caseData.Priority,
        PreviousDate: caseData.PreviousDate,
        NextDate: caseData.HearingDate || caseData.NextDate, // Form 'HearingDate' maps to DB 'NextDate'
        CaseDescription: caseData.CaseDescription,
        CaseNotes: caseData.CaseNotes,
      };

      // Remove undefined properties from updatePayload to prevent errors with some DB drivers
      Object.keys(updatePayload).forEach(key => {
        const K = key as keyof db.CaseUpdateData;
        if (updatePayload[K] === undefined) { delete updatePayload[K]; }
      });

      console.log('Updating Case Data with payload:', JSON.stringify(updatePayload, null, 2));
      const caseUpdateSuccess = await db.updateCase(caseData.id as number, updatePayload);

      if (caseUpdateSuccess) {
        console.log('Case data updated successfully.');
        const newDocsToUpload = documents.filter(doc => doc.uri && typeof doc.id === 'number' && doc.id > 1000000); // Heuristic for temp ID
        if (newDocsToUpload.length > 0) {
          // Consider a more user-friendly feedback for multiple uploads
        }
        for (const newDoc of newDocsToUpload) {
          try {
            // Ensure caseData.id is valid before using it
            if (typeof caseData.id !== 'number') throw new Error("Invalid case ID for document upload.");
            const uploadedDocId = await db.uploadCaseDocument({
              caseId: caseData.id, originalFileName: newDoc.fileName,
              fileType: newDoc.fileType || 'application/octet-stream', fileUri: newDoc.uri as string,
              fileSize: newDoc.fileSize, userId: null, // TODO: User ID
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
        Alert.alert("Error", "Cannot add document: Case ID is not available. Save the case first.");
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

  // Render logic using all the state and handlers...
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
