// Screens/EditCase/EditCaseScreen.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; // Import DocumentPicker

import { EditCaseScreenStyles } from './EditCaseScreenStyle';
import FormInput from '../CommonComponents/FormInput';
import DropdownPicker from '../CommonComponents/DropdownPicker';
import DatePickerField from '../CommonComponents/DatePickerField';
import SectionHeader from '../CommonComponents/SectionHeader';
import ActionButton from '../CommonComponents/ActionButton';
import DocumentItem from './components/DocumentItem';
import TimelineItem from './components/TimelineItem';

// Ensuring these paths are correct and explicit
import { CaseData, Document, TimelineEvent, DropdownOption, caseStatusOptions, priorityOptions } from "../../Types/appTypes";
import { RootStackParamList } from "../../Types/navigationtypes";

// Dummy data for dropdowns - in a real app, these would come from DB or constants file
const dummyCaseTypeOptions: DropdownOption[] = [
  { label: 'Select Case Type...', value: '' },
  { label: 'Civil Suit', value: 1 },
  { label: 'Criminal Defense', value: 2 },
  { label: 'Family Law', value: 3 },
  { label: 'Corporate', value: 4 },
  { label: 'Other', value: 99 },
];
const dummyCourtOptions: DropdownOption[] = [
    { label: 'Select Court...', value: '' },
    { label: 'District Court - City Center', value: 1 },
    { label: 'High Court - State Capital', value: 2 },
    { label: 'Supreme Court', value: 3 },
];

type EditCaseScreenRouteProp = RouteProp<RootStackParamList, 'EditCase'>;

const EditCaseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditCaseScreenRouteProp>();
  const [isSaving, setIsSaving] = useState(false); // For loading state on save button

  // Safely access initialCaseData, ensuring it's defined or falls back to undefined
  const initialCaseDataFromParams = route.params?.initialCaseData;

  const [caseData, setCaseData] = useState<Partial<CaseData>>(() => {
    const defaults: Partial<CaseData> = {
      // Default status and priority from imported options
      Status: caseStatusOptions.find(opt => opt.label === "Open")?.value || caseStatusOptions[0].value,
      Priority: priorityOptions.find(opt => opt.label === "Medium")?.value || priorityOptions[0].value,
    };
    // Merge defaults with params, giving precedence to params
    let initialData = initialCaseDataFromParams
      ? { ...defaults, ...initialCaseDataFromParams }
      : { ...defaults };

    // If initialData has names but not IDs for court/caseType, try to find IDs from dummy options
    // This helps pre-select dropdowns if only names were passed via navigation params.
    // This helps pre-select dropdowns if only names were passed via navigation params.
    if (initialData.court_name && (initialData.court_id === undefined || initialData.court_id === null || initialData.court_id === '')) {
      const foundCourt = dummyCourtOptions.find(opt => opt.label === initialData.court_name);
      if (foundCourt && foundCourt.value !== '') { // Ensure we don't set an empty string as ID
        initialData.court_id = foundCourt.value as number;
      }
    }
    if (initialData.case_type_name && (initialData.case_type_id === undefined || initialData.case_type_id === null || initialData.case_type_id === '')) {
      const foundCaseType = dummyCaseTypeOptions.find(opt => opt.label === initialData.case_type_name);
      if (foundCaseType && foundCaseType.value !== '') { // Ensure we don't set an empty string as ID
        initialData.case_type_id = foundCaseType.value as number;
      }
    }
    return initialData;
  });

  // Reverted DEBUGGING STEP: Use initialCaseDataFromParams for documents or fallback to dummy.
  const [documents, setDocuments] = useState<Document[]>(initialCaseDataFromParams?.documents || [
    { id: 1, case_id: 1, fileName: 'Merger Agreement Final.pdf', uploadDate: '2023-09-15T10:30:00.000Z', fileType: 'application/pdf', fileSize: 2048000, stored_filename: 'doc_1_1.pdf' },
    { id: 2, case_id: 1, fileName: 'Client Intake Form.docx', uploadDate: '2023-09-10T14:00:00.000Z', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 512000, stored_filename: 'doc_1_2.docx' },
    { id: 3, case_id: 1, fileName: 'Evidence Photos (Set 1).zip', uploadDate: '2023-10-02T09:15:00.000Z', fileType: 'application/zip', fileSize: 15360000, stored_filename: 'doc_1_3.zip' },
  ]);
  // Original line:
  // const [documents, setDocuments] = useState<Document[]>(initialCaseDataFromParams?.documents || [ /* dummy data */ ]);


  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialCaseDataFromParams?.timelineEvents || [
    { id: 'tl1', date: '2023-10-20T00:00:00.000Z', description: 'Initial consultation with the client. Discussed case details and potential strategies.' },
    { id: 'tl2', date: '2023-10-25T00:00:00.000Z', description: 'Case filed with the District Court. Filing fee paid and receipt obtained.' },
    { id: 'tl3', date: '2023-11-05T00:00:00.000Z', description: 'First hearing scheduled by the court for Nov 20, 2023. Sent notification to client.' },
  ]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const loadDocuments = async (currentCaseId: number | string | undefined) => {
    if (!currentCaseId || typeof currentCaseId !== 'number') { // Ensure currentCaseId is a valid number
        setDocuments(initialCaseDataFromParams?.documents || []); // Fallback to initial or empty
        return;
    }
    setIsLoadingDocuments(true);
    try {
        const fetchedDocs = await db.getCaseDocuments(currentCaseId as number);
        // Map CaseDocument (from DB) to Document (for UI state)
        const uiDocs: Document[] = fetchedDocs.map(dbDoc => ({
            id: dbDoc.id,
            case_id: dbDoc.case_id,
            fileName: dbDoc.original_display_name,
            uploadDate: dbDoc.created_at, // This is ISO string from DB
            fileType: dbDoc.file_type,
            fileSize: dbDoc.file_size,
            stored_filename: dbDoc.stored_filename,
            // uri is not present for documents fetched from DB
        }));
        setDocuments(uiDocs);
    } catch (error) {
        console.error("Error loading documents for case:", error);
        Alert.alert("Error", "Could not load documents.");
        // Potentially set documents to initial or empty on error
        setDocuments(initialCaseDataFromParams?.documents || []);
    } finally {
        setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: initialCaseDataFromParams ? 'Edit Case Details' : 'Add New Case' });
    if (initialCaseDataFromParams?.id) {
        loadDocuments(initialCaseDataFromParams.id);
    } else {
        // If it's a new case (no id), or initialCaseDataFromParams.documents is preferred source for new screen
        setDocuments(initialCaseDataFromParams?.documents || []);
    }
  }, [navigation, initialCaseDataFromParams]);

  const handleInputChange = (field: keyof CaseData, value: string | number | Date | null | undefined) => {
import * as db from '../../DataBase'; // Import database functions
// ... other imports ...

// ... (dummy data and component definition) ...

const EditCaseScreen: React.FC = () => {
  // ... (navigation, route, state initializations including isSaving) ...

  const handleInputChange = (field: keyof CaseData, value: string | number | Date | null | undefined) => {
    setCaseData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!caseData.id) {
      Alert.alert("Error", "Case ID is missing. Cannot update.");
      return;
    }
    if (!caseData.CaseTitle?.trim()) {
      Alert.alert('Validation Error', 'Case Title is required.');
      return;
    }

    setIsSaving(true);
    try {
      // Resolve names for court and case type
      const selectedCourtOption = dummyCourtOptions.find(opt => opt.value === caseData.court_id);
      const courtNameForDb = selectedCourtOption && selectedCourtOption.value !== '' ? selectedCourtOption.label : caseData.court_name || null;

      const selectedCaseTypeOption = dummyCaseTypeOptions.find(opt => opt.value === caseData.case_type_id);
      const caseTypeNameForDb = selectedCaseTypeOption && selectedCaseTypeOption.value !== '' ? selectedCaseTypeOption.label : caseData.case_type_name || null;

      const updatePayload: db.CaseUpdateData = {
        // Map all fields from caseData (Partial<CaseData>) to CaseUpdateData
        // CaseUpdateData is Partial<Omit<CaseRow, 'id' | 'uniqueId' | 'created_at' | 'updated_at'>>
        // CaseRow now includes all the new text fields.
        CaseTitle: caseData.CaseTitle,
        ClientName: caseData.ClientName,
        CNRNumber: caseData.CNRNumber,
        court_id: caseData.court_id || null, // Keep the ID
        court_name: courtNameForDb,          // Save the name
        dateFiled: caseData.FiledDate || caseData.dateFiled, // Prefer FiledDate from form
        case_type_id: caseData.case_type_id || null, // Keep the ID
        case_type_name: caseTypeNameForDb,       // Save the name
        case_number: caseData.case_number,
        case_year: caseData.case_year ? Number(caseData.case_year) : null,
        crime_number: caseData.crime_number,
        crime_year: caseData.crime_year ? Number(caseData.crime_year) : null,
        JudgeName: caseData.JudgeName,
        OnBehalfOf: caseData.OnBehalfOf, // If ClientName is primary, this might be different or derived
        FirstParty: caseData.FirstParty,
        OppositeParty: caseData.OppositeParty,
        ClientContactNumber: caseData.ClientContactNumber,
        Accussed: caseData.Accussed,
        Undersection: caseData.Undersection,
        police_station_id: caseData.police_station_id || null,
        StatuteOfLimitations: caseData.StatuteOfLimitations,
        OpposingCounsel: caseData.OpposingCounsel, // This is the form field
        OppositeAdvocate: caseData.OppositeAdvocate, // This is also in CaseData, ensure mapping is clear
        OppAdvocateContactNumber: caseData.OppAdvocateContactNumber,
        CaseStatus: caseData.Status || caseData.CaseStatus, // Status from dropdown
        Priority: caseData.Priority,
        PreviousDate: caseData.PreviousDate,
        NextDate: caseData.HearingDate || caseData.NextDate, // HearingDate from form
        CaseDescription: caseData.CaseDescription,
        CaseNotes: caseData.CaseNotes,
      };

      // Remove undefined properties from updatePayload to avoid sending them in SQL
      Object.keys(updatePayload).forEach(key => {
        const K = key as keyof db.CaseUpdateData;
        if (updatePayload[K] === undefined) {
          delete updatePayload[K];
        }
      });

      console.log('Updating Case Data with payload:', JSON.stringify(updatePayload, null, 2));
      const success = await db.updateCase(caseData.id as number, updatePayload);

      if (success) {
        console.log('Case data updated successfully.');
        // Now handle document uploads for new documents
        // New documents are identified by having a local 'uri' and a temporary ID (timestamp)
        const newDocsToUpload = documents.filter(doc => doc.uri && typeof doc.id === 'number' && doc.id > 1000000);
        let allDocUploadsSuccessful = true;
        if (newDocsToUpload.length > 0) {
          Alert.alert("Uploading Documents", `Attempting to upload ${newDocsToUpload.length} new document(s)...`);
        }

        for (const newDoc of newDocsToUpload) {
          try {
            const uploadedDocId = await db.uploadCaseDocument({
              caseId: caseData.id as number,
              originalFileName: newDoc.fileName,
              fileType: newDoc.fileType || 'application/octet-stream', // Default MIME type
              fileUri: newDoc.uri as string, // newDoc.uri is guaranteed by filter
              fileSize: newDoc.fileSize,
              userId: null, // TODO: Pass actual user ID when available
            });
            if (!uploadedDocId) {
              allDocUploadsSuccessful = false;
              console.error(`Failed to upload document: ${newDoc.fileName}`);
              Alert.alert("Upload Error", `Failed to upload document: ${newDoc.fileName}`);
              // Decide if you want to stop or continue with other uploads
            } else {
              console.log(`Document ${newDoc.fileName} uploaded with ID ${uploadedDocId}`);
            }
          } catch (uploadError) {
            allDocUploadsSuccessful = false;
            console.error(`Error during upload of ${newDoc.fileName}:`, uploadError);
            Alert.alert("Upload Exception", `Error uploading ${newDoc.fileName}.`);
          }
        }

        let overallSuccess = true; // Track overall success of all operations

        if (allDocUploadsSuccessful) {
          console.log('All new documents (if any) uploaded successfully.');
        } else {
          overallSuccess = false; // Mark overall success as false if any doc upload failed
          console.log('Some document uploads failed.');
          // Individual alerts for failed uploads are already shown.
          // A summary alert for partial success could be added here if desired.
        }

        // Refresh document list from DB to get proper IDs and stored_filenames
        // This ensures UI shows the latest state, including newly uploaded docs with DB IDs.
        if (caseData.id) await loadDocuments(caseData.id as number);

        if (overallSuccess) {
           Alert.alert('Success', 'Case details and documents saved successfully.');
           navigation.goBack(); // Navigate back on full success
        } else {
           Alert.alert('Partial Success', 'Case details saved, but some document operations may have failed. Please review.');
           // Optionally, still navigate back or stay on screen for user to review
           // navigation.goBack();
        }

      } else { // Case data update failed
        Alert.alert('Error', 'Failed to update case details. Documents were not processed.');
      }
    } catch (error) {
      console.error("Error saving case details:", error);
      Alert.alert('Error', 'An error occurred while saving case details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow all file types, or be more specific
        copyToCacheDirectory: true, // Recommended for reliability
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('Document picking cancelled or no assets found');
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert("Error", "Could not get document URI.");
        return;
      }

      const newDocument: Document = {
        // For a new, unsaved document, 'id' would typically be generated client-side temporarily
        // or assigned after saving to DB. Using Date.now() for a temporary unique key for the list.
        // The actual DB 'id' and 'case_id' will be set upon saving the case.
        id: Date.now(), // Temporary ID for UI list key. This is NOT the DB ID.
        case_id: caseData.id as number, // Assuming caseData.id is present when editing an existing case
        fileName: asset.name || `document_${Date.now()}`,
        uploadDate: new Date().toISOString(), // Set current date as upload date for this new item
        fileType: asset.mimeType || asset.name?.split('.').pop() || 'unknown',
        fileSize: asset.size,
        uri: asset.uri, // Local cache URI of the picked file
        // stored_filename will be determined when the file is actually saved persistently
      };

      setDocuments((prevDocs) => [...prevDocs, newDocument]);
      Alert.alert("Document Added", `${newDocument.fileName} has been added to the list. Save the case to persist changes.`);

    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "An error occurred while picking the document.");
    }
  };

  const handleViewDocument = (doc: Document) => { Alert.alert('View Document', `Viewing: ${doc.fileName}`); };
  const handleEditDocument = (doc: Document) => { Alert.alert('Edit Document Metadata', `Editing metadata for: ${doc.fileName}`); };

  const handleDeleteDocument = async (docToDelete: Document) => {
    // If the document has a URI, it's a newly added client-side file not yet in DB.
    // If it has a numeric ID and no URI, assume it's a DB record.
    // Temporary IDs (Date.now()) are numbers, so check for URI presence to differentiate.
    const isNewUnsavedDoc = !!docToDelete.uri && typeof docToDelete.id === 'number' && docToDelete.id > 1000000; // Heuristic for Date.now() IDs

    if (isNewUnsavedDoc) {
      // Just remove from local state
      setDocuments(docs => docs.filter(d => d.id !== docToDelete.id));
      Alert.alert("Document Removed", `${docToDelete.fileName} has been removed from the list.`);
      return;
    }

    // For existing documents, confirm and delete from DB
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to permanently delete "${docToDelete.fileName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoadingDocuments(true); // Use general loader or a specific one
              const success = await db.deleteCaseDocument(docToDelete.id as number);
              if (success) {
                setDocuments(docs => docs.filter(d => d.id !== docToDelete.id));
                Alert.alert("Deleted", `"${docToDelete.fileName}" has been deleted.`);
              } else {
                Alert.alert("Error", `Failed to delete "${docToDelete.fileName}" from the database.`);
              }
            } catch (error) {
              console.error("Error deleting document from DB:", error);
              Alert.alert("Error", "An error occurred while deleting the document.");
            } finally {
              setIsLoadingDocuments(false);
            }
          }
        }
      ]
    );
  };

  const handleAddTimelineEvent = () => { Alert.alert('Add New Timeline Event', 'Implement form to add a new timeline event.'); };
  const handleEditTimelineEvent = (event: TimelineEvent) => { Alert.alert('Edit Timeline Event', `Editing event: ${event.description.substring(0,30)}...`); };
  const handleDeleteTimelineEvent = (eventToDelete: TimelineEvent) => {
     Alert.alert('Confirm Deletion', `Are you sure you want to delete this timeline event?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => setTimelineEvents(events => events.filter(e => e.id !== eventToDelete.id)), style: 'destructive' }
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined} // "height" can sometimes be problematic
      style={EditCaseScreenStyles.screen}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // Standard header height + some buffer
    >
      <ScrollView
        style={styles.scrollView} // Use local styles for ScrollView if specific needs
        contentContainerStyle={styles.scrollContentContainer} // Use local styles for content container
        keyboardShouldPersistTaps="handled"
      >
        <View style={EditCaseScreenStyles.formContainer}>
          {/* Case Core Details */}
          <FormInput
            label="Case Title*"
            value={caseData.CaseTitle || ''}
            onChangeText={(text) => handleInputChange('CaseTitle', text)}
            placeholder="e.g., Acme Corp vs. Beta Inc."
          />
          <FormInput
            label="Client Name"
            value={caseData.ClientName || caseData.OnBehalfOf || ''}
            onChangeText={(text) => handleInputChange('ClientName', text)}
            placeholder="Enter client's full name"
          />
          <FormInput
            label="Case Number / CNR Number"
            value={caseData.case_number || caseData.CNRNumber ||''}
            onChangeText={(text) => handleInputChange('case_number', text)} // Or CNRNumber
            placeholder="e.g., CS/123/2023 or UCN..."
          />
          <DropdownPicker
            label="Case Type"
            selectedValue={caseData.case_type_id || ""}
            onValueChange={(val) => handleInputChange('case_type_id', val as number)}
            options={dummyCaseTypeOptions}
            placeholder="Select Case Type..."
          />
          <DropdownPicker
            label="Court"
            selectedValue={caseData.court_id || ""}
            onValueChange={(val) => handleInputChange('court_id', val as number)}
            options={dummyCourtOptions}
            placeholder="Select Court..."
          />
          <FormInput
            label="Presiding Judge"
            value={caseData.JudgeName || ''}
            onChangeText={(text) => handleInputChange('JudgeName', text)}
            placeholder="Enter judge's name (if known)"
          />
          <FormInput
            label="Opposing Counsel / Advocate"
            value={caseData.OpposingCounsel || caseData.OppositeAdvocate || ''}
            onChangeText={(text) => handleInputChange('OpposingCounsel', text)}
            placeholder="Enter opposing counsel's name"
          />

          {/* Status and Dates */}
          <DropdownPicker
            label="Case Status"
            selectedValue={caseData.Status || caseData.CaseStatus || ""}
            onValueChange={(val) => handleInputChange('Status', val as string)}
            options={caseStatusOptions}
            placeholder="Select Status..."
          />
          <DropdownPicker
            label="Priority Level"
            selectedValue={caseData.Priority || ""}
            onValueChange={(val) => handleInputChange('Priority', val as string)}
            options={priorityOptions}
            placeholder="Select Priority..."
          />
          <DatePickerField
            label="Date Filed"
            value={caseData.FiledDate || caseData.dateFiled ? new Date(caseData.FiledDate || caseData.dateFiled!) : null}
            onChange={(date) => handleInputChange('FiledDate', date ? date.toISOString() : null)}
            placeholder="Select date case was filed"
          />
          <DatePickerField
            label="Next Hearing Date"
            value={caseData.HearingDate || caseData.NextDate ? new Date(caseData.HearingDate || caseData.NextDate!) : null}
            onChange={(date) => handleInputChange('HearingDate', date ? date.toISOString() : null)}
            placeholder="Select next hearing date"
          />
           <DatePickerField
            label="Statute of Limitations"
            value={caseData.StatuteOfLimitations ? new Date(caseData.StatuteOfLimitations) : null}
            onChange={(date) => handleInputChange('StatuteOfLimitations', date ? date.toISOString() : null)}
            placeholder="Select SOL date (if applicable)"
          />
          {(caseData.Status === 'Closed' || caseData.CaseStatus === 'Closed') && (
            <DatePickerField
              label="Date Closed"
              value={caseData.ClosedDate ? new Date(caseData.ClosedDate) : null}
              onChange={(date) => handleInputChange('ClosedDate', date ? date.toISOString() : null)}
              placeholder="Select date case was closed"
            />
          )}

          {/* Descriptions and Notes */}
          <FormInput
            label="Case Description"
            value={caseData.CaseDescription || ''}
            onChangeText={(text) => handleInputChange('CaseDescription', text)}
            placeholder="Provide a brief summary or description of the case..."
            multiline
            numberOfLines={4} // Initial number of lines
            style={{minHeight: 80}} // Ensure it's visibly multiline
          />
          <FormInput
            label="Internal Notes / Strategy"
            value={caseData.CaseNotes || ''}
            onChangeText={(text) => handleInputChange('CaseNotes', text)}
            placeholder="Add any private notes, strategic considerations, or reminders..."
            multiline
            numberOfLines={4}
            style={{minHeight: 80}}
          />

          {/* Documents Section */}
          <SectionHeader title="Case Documents" />
          <View style={EditCaseScreenStyles.listContainer}>
            {documents.length > 0 ? documents.map(doc => (
              <DocumentItem
                key={doc.id.toString()}
                document={doc}
                onView={handleViewDocument}
                onEdit={handleEditDocument}
                onDelete={handleDeleteDocument}
              />
            )) : <Text style={styles.emptyListText}>No documents uploaded yet.</Text>}
             <View style={EditCaseScreenStyles.addNewButtonContainer}>
                <ActionButton
                    title="Add New Document"
                    onPress={handleAddDocument}
                    type="dashed"
                    style={EditCaseScreenStyles.fullWidthDashedButton}
                    leftIcon={<MaterialIcons name="attach-file" size={20} color="#1D4ED8" />}
                />
            </View>
          </View>

          {/* Case Timeline Section */}
          <SectionHeader title="Case Timeline" />
          <View style={EditCaseScreenStyles.listContainer}>
            {timelineEvents.length > 0 ? timelineEvents.map((event, index) => (
              <TimelineItem
                key={event.id}
                item={event}
                onEdit={handleEditTimelineEvent}
                onDelete={handleDeleteTimelineEvent}
                isLastItem={index === timelineEvents.length - 1}
              />
            )) : <Text style={styles.emptyListText}>No timeline events recorded yet.</Text>}
            <View style={EditCaseScreenStyles.addNewButtonContainer}>
                 <ActionButton
                    title="Add New Timeline Event"
                    onPress={handleAddTimelineEvent}
                    type="dashed"
                    style={EditCaseScreenStyles.fullWidthDashedButton}
                    leftIcon={<Ionicons name="calendar-outline" size={20} color="#1D4ED8" />}
                />
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

// Local styles for ScrollView to avoid prop conflicts with generated styles if any.
const styles = StyleSheet.create({
  scrollView: {
    flex: 1, // Ensures ScrollView takes up available space within KeyboardAvoidingView
  },
  scrollContentContainer: {
    flexGrow: 1, // Important for ScrollView to allow scrolling when content exceeds screen height
  },
  emptyListText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingVertical: 20,
  }
});

// Ensure 'EditCase' route is defined in your RootStackParamList (e.g., Types/navigationtypes.ts)
// export type RootStackParamList = {
//   // ... other routes
//   EditCase?: { // Make params optional for "Add New Case" scenario
//     initialCaseData?: Partial<CaseData> & {
//       documents?: Document[],
//       timelineEvents?: TimelineEvent[]
//     }
//   };
// };

export default EditCaseScreen;
