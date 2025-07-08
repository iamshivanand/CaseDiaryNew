import { Formik, FormikProps } from "formik";
import React, { useEffect, useMemo } from "react"; // Added useMemo
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import * as Yup from "yup";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { v4 as uuidv4 } from "uuid"; // For uniqueId generation

import {
  addCase,
  updateCase,
  CaseInsertData,
  CaseUpdateData,
} from "../../DataBase";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen";
import { CaseData, DropdownOption as AppDropdownOption, caseStatusOptions, priorityOptions } from "../../Types/appTypes";

import FormInput from '../CommonComponents/FormInput';
import DropdownPicker from '../CommonComponents/DropdownPicker';
import DatePickerField from '../CommonComponents/DatePickerField';
import ActionButton from "../CommonComponents/ActionButton";
import { EditCaseScreenStyles } from "../EditCase/EditCaseScreenStyle";

interface FieldDefinition {
  name: keyof CaseData;
  type: "text" | "select" | "date" | "multiline";
  placeholder?: string;
  label: string;
  options?: AppDropdownOption[];
}

type AddCaseScreenRouteProp = RouteProp<HomeStackParamList, "AddCaseDetails">; // Changed to AddCaseDetails as this is its context

interface AddCaseProps {
  route: AddCaseScreenRouteProp;
}

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

const validationSchema = Yup.object().shape({
  CaseTitle: Yup.string().required("Case Title is required"),
});

const FormFieldRenderer: React.FC<{
  fieldConfig: FieldDefinition;
  formik: FormikProps<Partial<CaseData>>;
}> = ({ fieldConfig, formik }) => {
  const { values, errors, touched, setFieldValue } = formik;
  const fieldName = fieldConfig.name;
  const commonInputProps = {
    label: fieldConfig.label,
    error: (touched[fieldName] && errors[fieldName]) ? errors[fieldName] : undefined,
  };

  switch (fieldConfig.type) {
    case "text":
      return <FormInput {...commonInputProps} value={values[fieldName] as string || ''} placeholder={fieldConfig.placeholder} onChangeText={(text) => setFieldValue(fieldName, text)} />;
    case "multiline":
      return <FormInput {...commonInputProps} value={values[fieldName] as string || ''} placeholder={fieldConfig.placeholder} onChangeText={(text) => setFieldValue(fieldName, text)} multiline numberOfLines={4} style={{ minHeight: 80 }} />;
    case "select":
      return <DropdownPicker {...commonInputProps} selectedValue={values[fieldName] as string | number | undefined} onValueChange={(itemValue) => setFieldValue(fieldName, itemValue)} options={fieldConfig.options || []} placeholder={fieldConfig.placeholder || `Select ${fieldConfig.label}...`} />;
    case "date":
      return <DatePickerField {...commonInputProps} value={values[fieldName] ? new Date(values[fieldName] as string) : null} onChange={(date) => setFieldValue(fieldName, date ? date.toISOString() : null)} placeholder={fieldConfig.placeholder || "Select date"} />;
    default:
      console.warn("Unsupported field type:", fieldConfig.type);
      return null;
  }
};

const AddCase: React.FC<AddCaseProps> = ({ route }) => {
  const params = route.params; // Route params for AddCaseDetails
  const { update = false, initialValues, uniqueId: routeUniqueId } = params ?? {};

  const navigation = useNavigation();
  const generatedUniqueId = useMemo(() => uuidv4(), []);
  const uniqueIdToUse = routeUniqueId || initialValues?.uniqueId || generatedUniqueId;

  const prepareFormInitialValues = (): Partial<CaseData> => {
    const defaults: Partial<CaseData> = {};
    formFieldsDefinition.forEach(field => {
      defaults[field.name] = field.type === "date" ? null : (field.type === "select" ? (field.options?.[0]?.value ?? '') : '');
    });
    if (update && initialValues) {
      return {
        ...defaults,
        uniqueId: initialValues.uniqueId,
        id: initialValues.id,
        CaseTitle: initialValues.caseNumber || '',
        FiledDate: initialValues.dateFiled ? initialValues.dateFiled.toISOString() : null,
        // Note: initialValues (CaseDetails) doesn't have IDs for court/caseType.
        // For update mode, EditCaseScreen is preferred as it handles full CaseData.
        // This form will show placeholders for court/caseType if initialValues are from summary CaseDetails.
      };
    }
    return { ...defaults, uniqueId: uniqueIdToUse };
  };

  const handleSubmitForm = async (formValues: Partial<CaseData>) => {
    console.log("Submitting form values:", formValues);

    if (update && initialValues?.id) {
      const caseIdToUpdate = initialValues.id;
      const updatePayload: CaseUpdateData = {};
      // Map relevant formValues to CaseUpdateData, ensure correct types
      if (formValues.CaseTitle !== undefined) updatePayload.OnBehalfOf = formValues.CaseTitle; // Example, align with your DB schema
      if (formValues.FiledDate !== undefined) updatePayload.dateFiled = formValues.FiledDate;
      if (formValues.case_number !== undefined) updatePayload.case_number = formValues.case_number;

      // For court_id and case_type_id, send NULL as per user clarification for update too
      updatePayload.court_id = null;
      updatePayload.case_type_id = null;
      // User needs to add text columns like 'court_name_text', 'case_type_name_text' to DB
      // and update CaseUpdateData type and updateCase function accordingly.
      const selectedCourtOption = dummyCourtOptionsForAdd.find(opt => opt.value === formValues.court_id);
      const courtNameString = selectedCourtOption?.label;
      const selectedCaseTypeOption = dummyCaseTypeOptionsForAdd.find(opt => opt.value === formValues.case_type_id);
      const caseTypeNameString = selectedCaseTypeOption?.label;
      console.log("INFO (Update): Intended Court Name:", courtNameString);
      console.log("INFO (Update): Intended Case Type Name:", caseTypeNameString);
      // Example: if schema had 'court_name_text': updatePayload.court_name_text = courtNameString;


      if (formValues.Status !== undefined) updatePayload.CaseStatus = formValues.Status;
      // ... map other updatable fields ...

      if (Object.keys(updatePayload).length === 0 && (!courtNameString && !caseTypeNameString)) { // check if any actual data changed
        console.log("No changes to update.");
        navigation.goBack();
        return;
      }
      try {
        const success = await updateCase(caseIdToUpdate, updatePayload);
        if (success) {
          console.log("Case updated successfully");
          const navDetails: CaseDetails = {
            uniqueId: formValues.uniqueId || initialValues.uniqueId,
            id: caseIdToUpdate,
            caseNumber: formValues.CaseTitle || initialValues.caseNumber,
            court: courtNameString || initialValues.court,
            caseType: caseTypeNameString || initialValues.caseType,
            dateFiled: formValues.FiledDate ? new Date(formValues.FiledDate) : initialValues.dateFiled,
          };
          navigation.navigate("CaseDetail", { caseDetails: navDetails });
        } else { console.error("Failed to update case."); }
      } catch (e) { console.error("Error updating case:", e); }
    } else { // ADD LOGIC
      const selectedCourtOption = dummyCourtOptionsForAdd.find(opt => opt.value === formValues.court_id);
      const courtNameString = selectedCourtOption && selectedCourtOption.value !== '' ? selectedCourtOption.label : null;
      const selectedCaseTypeOption = dummyCaseTypeOptionsForAdd.find(opt => opt.value === formValues.case_type_id);
      const caseTypeNameString = selectedCaseTypeOption && selectedCaseTypeOption.value !== '' ? selectedCaseTypeOption.label : null;

      const insertPayload: CaseInsertData = {
        uniqueId: formValues.uniqueId || uniqueIdToUse,
        user_id: null,
        CNRNumber: formValues.CNRNumber || null,
        court_id: null, // Send NULL for FK ID
        case_type_id: null, // Send NULL for FK ID
        dateFiled: formValues.FiledDate || null,
        case_number: formValues.case_number || null,
        case_year: formValues.case_year ? parseInt(formValues.case_year as string, 10) : null,
        crime_number: formValues.crime_number || null,
        crime_year: formValues.crime_year ? parseInt(formValues.crime_year as string, 10) : null,
        OnBehalfOf: formValues.ClientName || formValues.OnBehalfOf || null,
        FirstParty: formValues.FirstParty || null,
        OppositeParty: formValues.OppositeParty || null,
        ClientContactNumber: formValues.ClientContactNumber || null,
        Accussed: formValues.Accussed || null,
        Undersection: formValues.Undersection || null,
        police_station_id: typeof formValues.police_station_id === 'number' ? formValues.police_station_id : null,
        OppositeAdvocate: formValues.OpposingCounsel || formValues.OppositeAdvocate || null,
        OppAdvocateContactNumber: formValues.OppAdvocateContactNumber || null,
        CaseStatus: formValues.Status || formValues.CaseStatus || null,
        PreviousDate: formValues.PreviousDate || null,
        NextDate: formValues.HearingDate || formValues.NextDate || null,
        // To store names, user needs to add TEXT columns to Cases table & CaseInsertData type:
        // e.g., court_name_text: courtNameString, case_type_name_text: caseTypeNameString
      };

      console.log("INFO (Add): Intended Court Name (for future TEXT column):", courtNameString);
      console.log("INFO (Add): Intended Case Type Name (for future TEXT column):", caseTypeNameString);
      console.log("Actual insertPayload (with court_id & case_type_id as NULL):", JSON.stringify(insertPayload, null, 2));

      try {
        const newCaseId = await addCase(insertPayload);
        if (newCaseId) {
          console.log("Case added successfully with ID:", newCaseId);
          const navDetails: CaseDetails = {
            id: newCaseId,
            uniqueId: insertPayload.uniqueId,
            caseNumber: formValues.CaseTitle || "N/A",
            dateFiled: formValues.FiledDate ? new Date(formValues.FiledDate) : undefined,
            court: courtNameString || undefined,
            caseType: caseTypeNameString || undefined,
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
