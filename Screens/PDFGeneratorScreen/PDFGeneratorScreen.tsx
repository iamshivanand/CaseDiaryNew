import React, { useState, useContext, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform, Alert, PermissionsAndroid } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../Types/navigationtypes';
import { ThemeContext } from '../../Providers/ThemeProvider';
import { getStyles } from './PDFGeneratorScreenStyles'; // Import styles
import TemplateSelector, { Template } from './components/TemplateSelector'; // Import TemplateSelector
import DynamicFormBuilder, { FormField } from './components/DynamicFormBuilder'; // Import DynamicFormBuilder
import CaseSelector, { CaseOption } from './components/CaseSelector'; // Import CaseSelector
import PDFPreviewer from './components/PDFPreviewer'; // Import PDFPreviewer
import { uploadCaseDocument } from '../../DataBase'; // Import DB function
import * as FileSystem from 'expo-file-system'; // To get file size

// Import common components if available and suitable
// For example, if you have a generic DropdownPicker or ActionButton:
// import DropdownPicker from '../CommonComponents/DropdownPicker';
// import ActionButton from '../CommonComponents/ActionButton';
// import Header from '../CommonComponents/Header'; // If you have a custom header

type PDFGeneratorScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'PDFGeneratorScreen'>;
};

// Mock data for templates and cases - replace with actual data source or state management
const MOCK_TEMPLATES: Template[] = [ // Use Template interface
  { label: 'Agreement Draft', value: 'agreement_draft' },
  { label: 'Legal Notice', value: 'legal_notice' },
  { label: 'Affidavit', value: 'affidavit' },
  { label: 'Case Summary', value: 'case_summary' },
  { label: 'Custom Template', value: 'custom_template' },
];

const MOCK_CASES: CaseOption[] = [ // Use CaseOption interface
  { label: 'Case 001: John Doe vs Richard Roe', value: '1' }, // Assuming '1' is a valid case ID for mocking
  { label: 'Case 002: Jane Smith Property Dispute', value: '2' }, // Assuming '2' is a valid case ID
  // Add more cases as needed
  // In a real app, fetch this from DB: e.g., case.title + " (" + case.caseNumber + ")"
];

const PDFGeneratorScreen: React.FC<PDFGeneratorScreenProps> = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(theme), [theme]); // Memoize styles

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [generatedPdfPath, setGeneratedPdfPath] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const getTemplateFields = (templateValue: string | null): FormField[] => {
    if (!templateValue) return [];

    switch (templateValue) {
      case 'agreement_draft':
        return [
          { name: 'caseTitle', placeholder: 'Case Title', type: 'text' },
          { name: 'clientName', placeholder: 'Client Name', type: 'text' },
          { name: 'agreementDate', placeholder: 'Agreement Date', type: 'date' },
          { name: 'clauses', placeholder: 'Clauses (separate with new lines)', type: 'textarea' },
          { name: 'partyASignatory', placeholder: 'Party A Signatory', type: 'text' },
          { name: 'partyBSignatory', placeholder: 'Party B Signatory', type: 'text' },
        ];
      case 'legal_notice':
        return [
          { name: 'recipientName', placeholder: 'Recipient Name', type: 'text' },
          { name: 'recipientAddress', placeholder: 'Recipient Address', type: 'textarea' },
          { name: 'issueDate', placeholder: 'Issue Date', type: 'date' },
          { name: 'subject', placeholder: 'Subject of Notice', type: 'text' },
          { name: 'noticeBody', placeholder: 'Body of the Notice', type: 'textarea' },
          { name: 'senderName', placeholder: 'Sender Name/Lawyer Name', type: 'text' },
        ];
      case 'affidavit':
        return [
          { name: 'deponentName', placeholder: 'Deponent Name', type: 'text' },
          { name: 'deponentAddress', placeholder: 'Deponent Address', type: 'textarea' },
          { name: 'dateOfAffidavit', placeholder: 'Date of Affidavit', type: 'date' },
          { name: 'statement', placeholder: 'Statement/Declaration', type: 'textarea'},
          { name: 'placeOfSwearing', placeholder: 'Place of Swearing', type: 'text' },
        ];
      case 'case_summary':
        return [
            { name: 'caseTitle', placeholder: 'Case Title', type: 'text' },
            { name: 'courtName', placeholder: 'Court Name', type: 'text' },
            { name: 'judgeName', placeholder: 'Presiding Judge (if any)', type: 'text' },
            { name: 'caseDate', placeholder: 'Date of Summary', type: 'date' },
            { name: 'facts', placeholder: 'Brief Facts', type: 'textarea'},
            { name: 'arguments', placeholder: 'Key Arguments', type: 'textarea'},
            { name: 'outcome', placeholder: 'Outcome/Status', type: 'text' },
        ];
      case 'custom_template':
        return [
            // Example for a custom template - perhaps allow users to define these?
            // For now, a generic field.
            { name: 'customField1', placeholder: 'Custom Field 1', type: 'text'},
            { name: 'customDetails', placeholder: 'Custom Details', type: 'textarea'},
        ];
      default:
        return [];
    }
  };

  const currentTemplateFields = useMemo(() => getTemplateFields(selectedTemplate), [selectedTemplate]);

  // Function to generate HTML, used for both preview and final PDF
  const generateHtmlContent = (template: string | null, data: Record<string, string>): string | null => {
    if (!template) return null;

    // Basic HTML structure. Enhance with CSS for better styling.
    let contentHtml = `<h1>${template.replace(/_/g, ' ').toUpperCase()}</h1>`;
    currentTemplateFields.forEach(field => {
      if (data[field.name]) {
        contentHtml += `<p><strong>${field.placeholder}:</strong> ${data[field.name]}</p>`;
      }
    });

    if (data.additionalNotes) {
      contentHtml += `<h2>Additional Notes</h2><p>${data.additionalNotes}</p>`;
    }

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 15px; color: #333; background-color: ${theme.colors.card}; }
            h1 { color: ${theme.colors.primary}; border-bottom: 1px solid ${theme.colors.primary}; padding-bottom: 5px; font-size: 1.5em; }
            h2 { color: ${theme.colors.secondary || theme.colors.primary}; margin-top: 15px; font-size: 1.2em; }
            p { line-height: 1.5; margin-bottom: 8px; font-size: 0.9em; }
            strong { font-weight: bold; }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `;
  };

  // Update preview HTML whenever formValues or selectedTemplate changes
  useMemo(() => {
    if (selectedTemplate && Object.keys(formValues).length > 0) {
      const html = generateHtmlContent(selectedTemplate, formValues);
      setPreviewHtml(html);
    } else if (!selectedTemplate || Object.keys(formValues).length === 0 ) {
        setPreviewHtml(null); // Clear preview if no template or data
    }
  }, [formValues, selectedTemplate, currentTemplateFields, theme]);

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Needed',
            message: 'This app needs access to your storage to save PDFs.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS does not require explicit permission for app's own sandbox
  };

  const handleGeneratePdf = async () => {
    if (!selectedTemplate || Object.keys(formValues).length === 0) {
      Alert.alert('Missing Information', 'Please select a template and fill in the required fields.');
      return;
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required to save the PDF.');
      return;
    }

    const htmlString = generateHtmlContent(selectedTemplate, formValues);
    if (!htmlString) {
      Alert.alert('Error', 'Could not generate HTML content for the PDF.');
      return;
    }

    const templateName = MOCK_TEMPLATES.find(t => t.value === selectedTemplate)?.label || 'Document';
    const fileName = `${templateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    const options = {
      html: htmlString, // Use the generated htmlString
      fileName: fileName,
      directory: 'Documents', // This will be in app's cache/documents directory. For public storage, more setup is needed.
    };

    try {
      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('PDF Generated!', `PDF saved to: ${file.filePath}`);
      setGeneratedPdfPath(file.filePath || null); // Store the path
      // TODO: Allow sharing/opening the PDF from here if needed
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
      setGeneratedPdfPath(null);
    }
  };

  const handleAttachToCase = async () => {
    if (!selectedCase) {
      Alert.alert('No Case Selected', 'Please select a case to attach the PDF to.');
      return;
    }
    if (!generatedPdfPath) {
      Alert.alert('No PDF Generated', 'Please generate a PDF first before attaching.');
      return;
    }
    if (!selectedTemplate) {
        Alert.alert('No Template Selected', 'Something went wrong, template type is unknown.');
        return;
    }

    try {
      // Attempt to get file size
      let fileSize: number | undefined = undefined;
      const fileInfo = await FileSystem.getInfoAsync(generatedPdfPath);
      if (fileInfo.exists && fileInfo.size !== undefined) {
        fileSize = fileInfo.size;
      }

      const templateName = MOCK_TEMPLATES.find(t => t.value === selectedTemplate)?.label || 'Document';
      const originalFileName = `${templateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Assuming selectedCase value is the case_id as a string, convert to number
      const caseIdNumber = parseInt(selectedCase, 10);
      if (isNaN(caseIdNumber)) {
        Alert.alert('Invalid Case ID', 'The selected case ID is not valid.');
        return;
      }

      // TODO: Get actual userId if your app has user authentication
      const currentUserId: number | null = null; // Placeholder

      const documentId = await uploadCaseDocument({
        originalFileName,
        fileType: 'application/pdf', // More specific MIME type
        fileUri: generatedPdfPath, // This is the local file path
        caseId: caseIdNumber,
        userId: currentUserId,
        fileSize,
        templateType: selectedTemplate,
      });

      if (documentId) {
        Alert.alert('Success', `PDF attached to case ${MOCK_CASES.find(c=>c.value === selectedCase)?.label} successfully. Document ID: ${documentId}`);
        // Reset states after successful attachment
        setGeneratedPdfPath(null);
        // Optionally clear form or navigate away
        // setSelectedTemplate(null);
        // setFormValues({});
        // setPreviewHtml(null);
        // setSelectedCase(null); // Keep case selected or clear based on desired UX
      } else {
        Alert.alert('Error', 'Failed to attach PDF to the case. Please try again.');
      }
    } catch (error) {
      console.error('Error attaching PDF to case:', error);
      Alert.alert('Error', 'An unexpected error occurred while attaching the PDF.');
    }
  };


  return (
    <View style={styles.container}>
      {/* Use react-navigation header options for back button and title if possible,
          or a custom Header component if the app uses one consistently. */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Generate Legal Document</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Select Template */}
        <Text style={styles.sectionTitle}>Step 1: Select Template</Text>
        <TemplateSelector
          templates={MOCK_TEMPLATES}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={(value) => {
            setSelectedTemplate(value);
            setFormValues({}); // Reset form when template changes
          }}
          theme={theme} // Pass the theme to the component
        />
        {/* Alternative: DropdownPicker component
        <DropdownPicker
          items={MOCK_TEMPLATES}
          selectedValue={selectedTemplate}
          onValueChange={(itemValue) => setSelectedTemplate(itemValue as string)}
          placeholder={{ label: 'Select a template...', value: null }}
        /> */}

        {/* Step 2: Enter Input Fields */}
        <Text style={styles.sectionTitle}>Step 2: Enter Input Fields</Text>
        <DynamicFormBuilder
          templateFields={currentTemplateFields}
          formValues={formValues}
          onInputChange={handleInputChange}
          theme={theme}
        />
        <TextInput
          placeholder="Additional Notes (Optional)"
          style={[styles.input, styles.inputMultiline]}
          value={formValues['additionalNotes'] || ''}
          onChangeText={(text) => handleInputChange('additionalNotes', text)}
          placeholderTextColor={theme.colors.textMuted || '#888'}
          multiline
          numberOfLines={3}
        />

        {/* Step 3: Preview & Generate */}
        <Text style={styles.sectionTitle}>Step 3: Preview & Generate</Text>
        <PDFPreviewer htmlContent={previewHtml} theme={theme} />
        <TouchableOpacity style={styles.actionButton} onPress={handleGeneratePdf}>
          <Text style={styles.actionButtonText}>Generate PDF</Text>
          {/* Optional: Add an icon here */}
        </TouchableOpacity>

        {/* Step 4: Attach to Case */}
        {/* This section might only appear after PDF is generated */}
        <Text style={styles.sectionTitle}>Step 4: Attach to Case</Text>
        <CaseSelector
          cases={MOCK_CASES}
          selectedCase={selectedCase}
          onSelectCase={setSelectedCase}
          theme={theme}
          placeholder="Select a case to attach document"
        />
        <TouchableOpacity
             style={[
                styles.actionButton,
                {backgroundColor: (selectedCase && generatedPdfPath) ? (theme.colors.secondary || '#007bff') : theme.colors.disabled || '#ccc' , marginTop: 10}
             ]}
            onPress={handleAttachToCase}
             disabled={!selectedCase || !generatedPdfPath}
        >
          <Text style={styles.actionButtonText}>Attach to Selected Case</Text>
        </TouchableOpacity>


        {/* Spacer at the bottom to ensure content is not hidden by tab bar or OS navigation */}
        <View style={{ height: Platform.OS === 'ios' ? 60 : 80 }} />
      </ScrollView>
    </View>
  );
};

export default PDFGeneratorScreen;
