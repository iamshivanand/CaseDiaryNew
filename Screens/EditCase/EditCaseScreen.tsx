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

  // Safely access initialCaseData, ensuring it's defined or falls back to undefined
  const initialCaseDataFromParams = route.params?.initialCaseData;

  const [caseData, setCaseData] = useState<Partial<CaseData>>(() => {
    const defaults: Partial<CaseData> = {
      CaseStatus: caseStatusOptions.find(opt => opt.label === "Open")?.value || caseStatusOptions[0].value,
      Priority: priorityOptions.find(opt => opt.label === "Medium")?.value || priorityOptions[0].value,
    };
    let initialData = initialCaseDataFromParams ? { ...defaults, ...initialCaseDataFromParams } : { ...defaults };

    // If initialData has names but not IDs for court/caseType, try to find IDs from dummy options
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

  useEffect(() => {
    navigation.setOptions({ title: initialCaseDataFromParams ? 'Edit Case Details' : 'Add New Case' });
  }, [navigation, initialCaseDataFromParams]);

  const handleInputChange = (field: keyof CaseData, value: string | number | Date | null | undefined) => {
    setCaseData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!caseData.CaseTitle?.trim()) {
      Alert.alert('Validation Error', 'Case Title is required.');
      return;
    }
    // Add more validations as needed
    console.log('Saving Case Data:', JSON.stringify(caseData, null, 2));
    console.log('Saving Documents:', JSON.stringify(documents, null, 2));
    console.log('Saving Timeline Events:', JSON.stringify(timelineEvents, null, 2));
    Alert.alert('Case Saved', 'Case details have been successfully saved (simulated).');
    // navigation.goBack(); // Or navigate to a relevant screen
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
  const handleDeleteDocument = (docToDelete: Document) => {
    Alert.alert('Confirm Deletion', `Are you sure you want to delete "${docToDelete.fileName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => setDocuments(docs => docs.filter(d => d.id !== docToDelete.id)), style: 'destructive' }
    ]);
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
          <ActionButton title="Cancel" onPress={handleCancel} type="secondary" />
        </View>
        <View style={EditCaseScreenStyles.buttonWrapper}>
          <ActionButton title="Save Changes" onPress={handleSave} type="primary" loading={false} />
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
