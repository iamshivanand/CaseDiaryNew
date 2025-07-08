import { Formik, FormikProps } from "formik"; // Removed FormikFieldProps as it wasn't used
import { v4 as uuidv4 } from "uuid"; // Import uuidv4 for generating unique IDs
import React, { useEffect } from "react"; // Removed useState as it's not directly used by AddCase anymore (Formik handles state)
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import * as Yup from "yup";
import { RouteProp, useNavigation } from "@react-navigation/native"; // useNavigation is used
// Removed unused imports: Fontisto, DateTimePicker, Picker, TextInput, Button, TouchableOpacity, Autocomplete

import {
  addCase,
  updateCase,
  CaseInsertData,
  CaseUpdateData,
} from "../../DataBase";
import { HomeStackParamList } from "../../Types/navigationtypes"; // Assuming AddCase is part of HomeStack
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen"; // Summary type for initialValues
import { CaseData, DropdownOption as AppDropdownOption, caseStatusOptions, priorityOptions } from "../../Types/appTypes";

// Import new common components
import FormInput from '../CommonComponents/FormInput';
import DropdownPicker from '../CommonComponents/DropdownPicker';
import DatePickerField from '../CommonComponents/DatePickerField';
import ActionButton from "../CommonComponents/ActionButton";
import { EditCaseScreenStyles } from "../EditCase/EditCaseScreenStyle"; // For consistent page layout styles

// Interface for field definitions
interface FieldDefinition {
  name: keyof CaseData;
  type: "text" | "select" | "date" | "multiline";
  placeholder?: string;
  label: string;
  options?: AppDropdownOption[];
}

// Props for AddCase screen
// The route params for "AddCase" come from HomeStackParamList
type AddCaseScreenRouteProp = RouteProp<HomeStackParamList, "AddCase">;
// If AddCase is also used for "AddCaseDetails" route, that needs to be handled if params differ
// type AddCaseDetailsScreenRouteProp = RouteProp<HomeStackParamList, "AddCaseDetails">;


interface AddCaseProps {
  // route prop is automatically provided by React Navigation
  route: AddCaseScreenRouteProp; // | AddCaseDetailsScreenRouteProp; // Use specific route prop
  // navigation prop is also automatically provided
}


// --- Field Definitions ---
const dummyCaseTypeOptionsForAdd: AppDropdownOption[] = [
  { label: 'Select Case Type...', value: '' }, { label: 'Civil Suit', value: 1 }, { label: 'Criminal Defense', value: 2 }, { label: 'Family Law', value: 3 }, { label: 'Corporate', value: 4 }, { label: 'Other', value: 99 },
];
const dummyCourtOptionsForAdd: AppDropdownOption[] = [
  { label: 'Select Court...', value: '' }, { label: 'District Court - City Center', value: 1 }, { label: 'High Court - State Capital', value: 2 }, { label: 'Supreme Court', value: 3 },
];

const formFieldsDefinition: FieldDefinition[] = [
  { name: "CaseTitle", type: "text", placeholder: "Enter Case Title", label: "Case Title*" },
  { name: "ClientName", type: "text", placeholder: "Enter Client's Full Name", label: "Client Name" },
  { name: "case_number", type: "text", placeholder: "e.g., CS/123/2023", label: "Case Number" },
  { name: "case_type_id", type: "select", label: "Case Type", options: dummyCaseTypeOptionsForAdd, placeholder: "Select Case Type..." },
  { name: "court_id", type: "select", label: "Court", options: dummyCourtOptionsForAdd, placeholder: "Select Court..." },
  { name: "FiledDate", type: "date", label: "Date Filed", placeholder: "Select date case was filed" },
  { name: "JudgeName", type: "text", placeholder: "Enter Judge's Name", label: "Presiding Judge" },
  { name: "OpposingCounsel", type: "text", placeholder: "Enter Opposing Counsel's Name", label: "Opposing Counsel" },
  { name: "Status", type: "select", label: "Case Status", options: caseStatusOptions, placeholder: "Select Status..." },
  { name: "Priority", type: "select", label: "Priority Level", options: priorityOptions, placeholder: "Select Priority..." },
  { name: "HearingDate", type: "date", label: "Next Hearing Date", placeholder: "Select next hearing date" },
  { name: "StatuteOfLimitations", type: "date", label: "Statute of Limitations", placeholder: "Select SOL date" },
  { name: "FirstParty", type: "text", placeholder: "Enter First Party Name", label: "First Party" },
  { name: "OppositeParty", type: "text", placeholder: "Enter Opposite Party Name", label: "Opposite Party" },
  { name: "ClientContactNumber", type: "text", placeholder: "Enter Client's Contact Number", label: "Client Contact No." },
  { name: "Accussed", type: "text", placeholder: "Enter Accused Name(s)", label: "Accused" },
  { name: "Undersection", type: "text", placeholder: "e.g., Section 302 IPC", label: "Under Section(s)" },
  { name: "CaseDescription", type: "multiline", placeholder: "Provide a brief summary...", label: "Case Description" },
  { name: "CaseNotes", type: "multiline", placeholder: "Add any private notes...", label: "Internal Notes" },
];

// --- Validation Schema ---
const validationSchema = Yup.object().shape({
  CaseTitle: Yup.string().required("Case Title is required"),
  // Add other validations as needed
});

// --- FormField Renderer Sub-component ---
const FormFieldRenderer: React.FC<{
  fieldConfig: FieldDefinition;
  // Formik props are passed implicitly or via context by <Field> or directly
  formik: FormikProps<Partial<CaseData>>; // Pass all of Formik's props
}> = ({ fieldConfig, formik }) => {
  const { values, errors, touched, setFieldValue } = formik;
  const fieldName = fieldConfig.name;

  const commonInputProps = {
    label: fieldConfig.label,
    error: (touched[fieldName] && errors[fieldName]) ? errors[fieldName] : undefined,
  };

  switch (fieldConfig.type) {
    case "text":
      return (
        <FormInput
          {...commonInputProps}
          value={values[fieldName] as string || ''}
          placeholder={fieldConfig.placeholder}
          onChangeText={(text) => setFieldValue(fieldName, text)}
        />
      );
    case "multiline":
      return (
        <FormInput
          {...commonInputProps}
          value={values[fieldName] as string || ''}
          placeholder={fieldConfig.placeholder}
          onChangeText={(text) => setFieldValue(fieldName, text)}
          multiline
          numberOfLines={4}
          style={{ minHeight: 80 }}
        />
      );
    case "select":
      return (
        <DropdownPicker
          {...commonInputProps}
          selectedValue={values[fieldName] as string | number | undefined}
          onValueChange={(itemValue) => setFieldValue(fieldName, itemValue)}
          options={fieldConfig.options || []}
          placeholder={fieldConfig.placeholder || `Select ${fieldConfig.label}...`}
        />
      );
    case "date":
      return (
        <DatePickerField
          {...commonInputProps}
          value={values[fieldName] ? new Date(values[fieldName] as string) : null}
          onChange={(date) => setFieldValue(fieldName, date ? date.toISOString() : null)}
          placeholder={fieldConfig.placeholder || "Select date"}
        />
      );
    default:
      console.warn("Unsupported field type in FormFieldRenderer:", fieldConfig.type);
      return null;
  }
};

// --- Main AddCase Component ---
const AddCase: React.FC<AddCaseProps> = ({ route }) => {
  // Extract params. Note: AddCaseDetails route might pass different params than AddCase route.
  // This component is now primarily for the 'AddCaseDetails' route context (from HomeStack).
  // It can also be theoretically used for 'AddCase' route if params are aligned.
  const params = route.params as HomeStackParamList['AddCaseDetails']; // Explicitly type params
  const { update = false, initialValues, uniqueId: routeUniqueId } = params ?? {};

  const navigation = useNavigation();

  const generatedUniqueId = React.useMemo(() => uuidv4(), []);
  const uniqueIdToUse = routeUniqueId || initialValues?.uniqueId || generatedUniqueId;


  const prepareFormInitialValues = (): Partial<CaseData> => {
    const defaults: Partial<CaseData> = {};
    formFieldsDefinition.forEach(field => {
      defaults[field.name] = field.type === "date" ? null : (field.type === "select" ? (field.options?.[0]?.value ?? '') : '');
    });

    if (update && initialValues) { // initialValues is CaseDetails (summary)
      return {
        ...defaults,
        uniqueId: initialValues.uniqueId,
        id: initialValues.id,
        CaseTitle: initialValues.caseNumber || '', // Map from summary
        // Cannot map court_id/case_type_id from names in CaseDetails without lookups
        FiledDate: initialValues.dateFiled ? initialValues.dateFiled.toISOString() : null,
        // other fields from initialValues if they map directly to CaseData keys
      };
    }
    return { ...defaults, uniqueId: uniqueIdToUse }; // For new case
  };

  const handleSubmitForm = async (formValues: Partial<CaseData>) => {
    console.log("Submitting form values:", formValues);

    if (update && initialValues?.id) { // UPDATE LOGIC
      const caseIdToUpdate = initialValues.id;
      const updatePayload: CaseUpdateData = { /* map formValues to CaseUpdateData */ };
      // This mapping needs to be comprehensive, similar to what was in previous handleFinalSubmit
      // Example:
      if (formValues.CaseTitle !== undefined) updatePayload.OnBehalfOf = formValues.CaseTitle; // Or map to appropriate field
      if (formValues.FiledDate !== undefined) updatePayload.dateFiled = formValues.FiledDate;
      if (formValues.case_number !== undefined) updatePayload.case_number = formValues.case_number;
      if (formValues.court_id !== undefined) updatePayload.court_id = formValues.court_id;
      if (formValues.case_type_id !== undefined) updatePayload.case_type_id = formValues.case_type_id;
      if (formValues.Status !== undefined) updatePayload.CaseStatus = formValues.Status;
      // ... etc. for all relevant fields ...

      if (Object.keys(updatePayload).length === 0) {
        console.log("No changes to update.");
        navigation.goBack();
        return;
      }
      try {
        const success = await updateCase(caseIdToUpdate, updatePayload);
        if (success) {
          console.log("Case updated successfully");
          // Navigate to CaseDetail with updated summary
          const navDetails: CaseDetails = {
            uniqueId: formValues.uniqueId || initialValues.uniqueId,
            id: caseIdToUpdate,
            caseNumber: formValues.CaseTitle || initialValues.caseNumber,
            court: initialValues.court, // Old name, ideally fetch new name
            caseType: initialValues.caseType, // Old name, ideally fetch new name
            dateFiled: formValues.FiledDate ? new Date(formValues.FiledDate) : initialValues.dateFiled,
          };
          navigation.navigate("CaseDetail", { caseDetails: navDetails });
        } else { console.error("Failed to update case."); }
      } catch (e) { console.error("Error updating case:", e); }
    } else { // ADD LOGIC
      const insertPayload: CaseInsertData = {
        uniqueId: formValues.uniqueId || uniqueIdToUse, // Ensure uniqueId
        user_id: null, // Placeholder for user ID
        CNRNumber: formValues.CNRNumber || null,
        court_id: formValues.court_id || null,
        dateFiled: formValues.FiledDate || null,
        case_type_id: formValues.case_type_id || null,
        case_number: formValues.case_number || null,
        OnBehalfOf: formValues.ClientName || null,
        FirstParty: formValues.FirstParty || null,
        OppositeParty: formValues.OppositeParty || null,
        ClientContactNumber: formValues.ClientContactNumber || null,
        Accussed: formValues.Accussed || null,
        Undersection: formValues.Undersection || null,
        OppositeAdvocate: formValues.OpposingCounsel || null,
        OppAdvocateContactNumber: formValues.OppAdvocateContactNumber || null,
        CaseStatus: formValues.Status || null,
        NextDate: formValues.HearingDate || null,
        // crime_number, crime_year, case_year, police_station_id, PreviousDate etc.
        // CaseDescription, CaseNotes are not in CaseInsertData schema
      };
      try {
        const newCaseId = await addCase(insertPayload);
        if (newCaseId) {
          console.log("Case added successfully with ID:", newCaseId);
          const navDetails: CaseDetails = {
            id: newCaseId,
            uniqueId: insertPayload.uniqueId,
            caseNumber: formValues.CaseTitle || "N/A",
            dateFiled: formValues.FiledDate ? new Date(formValues.FiledDate) : undefined,
          };
          navigation.navigate("CaseDetail", { caseDetails: navDetails });
        } else { console.error("Failed to add case."); }
      } catch (e) { console.error("Error adding case:", e); }
    }
  };

  return (
    <ScrollView
      style={styles.scrollViewStyle}
      contentContainerStyle={styles.scrollContentContainerStyle}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formScreenContainer}>
        <Text style={styles.screenTitle}>{update ? "Update Case Details" : "Add New Case"}</Text>
        <Formik
          initialValues={prepareFormInitialValues()}
          validationSchema={validationSchema}
          onSubmit={handleSubmitForm}
          enableReinitialize
        >
          {(formikProps) => (
            <View>
              {formFieldsDefinition.map((fieldConfig) => (
                <FormFieldRenderer key={fieldConfig.name} fieldConfig={fieldConfig} formik={formikProps} />
              ))}
              <View style={styles.actionButtonContainer}>
                <ActionButton
                  title={update ? "Save Changes" : "Save Case"}
                  onPress={() => formikProps.handleSubmit()}
                  type="primary"
                />
                <ActionButton
                  title="Cancel"
                  onPress={() => navigation.goBack()}
                  type="secondary"
                />
              </View>
            </View>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
};

export default AddCase;

const styles = StyleSheet.create({
  scrollViewStyle: {
    flex: 1,
    backgroundColor: EditCaseScreenStyles.screen.backgroundColor,
  },
  scrollContentContainerStyle: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formScreenContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1F2937',
    textAlign: 'center',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
});
