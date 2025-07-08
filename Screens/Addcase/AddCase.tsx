import { Fontisto } from "@expo/vector-icons"; // Keep for now if DatePickerField doesn't fully replace its usage pattern with Formik
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker"; // Potentially remove if DatePickerField handles all
import { Picker } from "@react-native-picker/picker"; // To be replaced by DropdownPicker
import { RouteProp, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Formik, FormikProps, FieldProps as FormikFieldProps } from "formik"; // Added FormikFieldProps
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import * as Yup from "yup";

import {
  addCase,
  updateCase,
  CaseInsertData,
  CaseUpdateData, // Added for update operation
  getSuggestionsForField, // Changed from getSuggestions
  // FormData, // FormData is not defined in DataBase/index.ts
} from "../../DataBase";
import { RootStackParamList } from "../../Types/navigationtypes";
import { formatDate } from "../../utils/commonFunctions";
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen"; // This is a summary type
import { CaseData, DropdownOption as AppDropdownOption, caseStatusOptions, priorityOptions } from "../../Types/appTypes"; // For more comprehensive data structure & dropdown options
// import SuggestionInput from "../CommonComponents/SuggestionsInput"; // No longer used directly by FormField

// Import new common components
import FormInput from '../CommonComponents/FormInput';
import DropdownPicker from '../CommonComponents/DropdownPicker';
import DatePickerField from '../CommonComponents/DatePickerField';
import ActionButton from "../CommonComponents/ActionButton"; // For the submit button
import { EditCaseScreenStyles } from "../EditCase/EditCaseScreenStyle"; // For consistent page layout styles

interface Field {
  name: keyof CaseData; // Ensure name is a key of CaseData for type safety with Formik values
  type: string;
  placeholder?: string;
  label: string;
  options?: { label: string; value: string }[];
}

type AddCaseScreenRouteProp = RouteProp<RootStackParamList, "AddCase">;

type AddCaseScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddCase" | "CaseDetail"
>;

interface Props {
  fields: Field[];
  onSubmit: (values: { [key: string]: string }) => void;
  update?: boolean;
  initialValues?: CaseDetails;
  route?: AddCaseScreenRouteProp;
  navigation?: AddCaseScreenNavigationProp;
}

// const suggestionsInputFields = [ /* ... This array is no longer used ... */ ];

// Dummy options for dropdowns, similar to EditCaseScreen
const dummyCaseTypeOptionsForAdd: AppDropdownOption[] = [
  { label: 'Select Case Type...', value: '' },
  { label: 'Civil Suit', value: 1 }, // Assuming value is the ID
  { label: 'Criminal Defense', value: 2 },
  { label: 'Family Law', value: 3 },
  { label: 'Corporate', value: 4 },
  { label: 'Other', value: 99 },
];
const dummyCourtOptionsForAdd: AppDropdownOption[] = [
    { label: 'Select Court...', value: '' },
    { label: 'District Court - City Center', value: 1 }, // Assuming value is the ID
    { label: 'High Court - State Capital', value: 2 },
    { label: 'Supreme Court', value: 3 },
];
// TODO: These dropdowns (case types, courts, police stations, districts) should ideally be fetched from the database.

const SamplefieldsData: Field[] = [ // Renamed to avoid conflict, ensure Field[] type is used
  {
    name: "CaseTitle",
    type: "text",
    placeholder: "Enter Case Title (e.g., State vs. John Doe)",
    label: "Case Title*",
  },
  {
    name: "ClientName",
    type: "text",
    placeholder: "Enter Client's Full Name",
    label: "Client Name",
  },
  {
    name: "case_number",
    type: "text",
    placeholder: "Enter Case Number (e.g., CS/123/2023)",
    label: "Case Number / ST Number",
  },
  {
    name: "case_type_id",
    type: "select",
    label: "Case Type",
    options: dummyCaseTypeOptionsForAdd,
    placeholder: "Select Case Type...",
  },
  {
    name: "court_id",
    type: "select",
    label: "Court",
    options: dummyCourtOptionsForAdd,
    placeholder: "Select Court...",
  },
  {
    name: "FiledDate",
    type: "date",
    label: "Date Filed",
    placeholder: "Select date case was filed",
  },
  {
    name: "JudgeName",
    type: "text",
    placeholder: "Enter Judge's Name (if known)",
    label: "Presiding Judge",
  },
  {
    name: "OpposingCounsel",
    type: "text",
    placeholder: "Enter Opposing Counsel's Name",
    label: "Opposing Counsel / Advocate",
  },
  {
    name: "Status",
    type: "select",
    label: "Case Status",
    options: caseStatusOptions, // From appTypes
    placeholder: "Select Status...",
  },
  {
    name: "Priority",
    type: "select",
    label: "Priority Level",
    options: priorityOptions, // From appTypes
    placeholder: "Select Priority...",
  },
  {
    name: "HearingDate",
    type: "date",
    label: "Next Hearing Date",
    placeholder: "Select next hearing date",
  },
  {
    name: "StatuteOfLimitations",
    type: "date",
    label: "Statute of Limitations",
    placeholder: "Select SOL date (if applicable)",
  },
  { name: "FirstParty", type: "text", placeholder: "Enter First Party Name", label: "First Party" },
  { name: "OppositeParty", type: "text", placeholder: "Enter Opposite Party Name", label: "Opposite Party" },
  { name: "ClientContactNumber", type: "text", placeholder: "Enter Client's Contact Number", label: "Client Contact No." },
  { name: "Accussed", type: "text", placeholder: "Enter Accused Name(s)", label: "Accused" },
  { name: "Undersection", type: "text", placeholder: "e.g., Section 302 IPC", label: "Under Section(s)" },
  {
    name: "CaseDescription",
    type: "multiline",
    placeholder: "Provide a brief summary or description of the case...",
    label: "Case Description",
  },
  {
    name: "CaseNotes",
    type: "multiline",
    placeholder: "Add any private notes, strategic considerations, or reminders...",
    label: "Internal Notes / Strategy",
  },
];

// Sample validation schema
const validationSchema = Yup.object().shape({
  CaseTitle: Yup.string().required("Case Title is required"),
  // Define your validation rules here based on your fields
});

// Define a component to render different types of form inputs
const FormField: React.FC<{
  field: Field;
  handleChange: (fieldName: string) => (value: any) => void;
  handleBlur: (fieldName: string) => () => void;
  values: Partial<CaseData>;
  errors: { [key in keyof CaseData]?: string };
  setFieldValue: (field: keyof CaseData, value: any, shouldValidate?: boolean) => void;
}> = ({
  field,
  values,
  errors,
  setFieldValue,
}) => {
  const commonProps = {
    label: field.label,
    error: errors[field.name],
  };

  switch (field.type) {
    case "text":
      return (
        <FormInput
          {...commonProps}
          value={values[field.name] as string || ''}
          placeholder={field.placeholder}
          onChangeText={(text) => setFieldValue(field.name, text)}
        />
      );
    case "multiline":
        return (
          <FormInput
            {...commonProps}
            value={values[field.name] as string || ''}
            placeholder={field.placeholder}
            onChangeText={(text) => setFieldValue(field.name, text)}
            multiline
            numberOfLines={4}
            style={{minHeight: 80}}
          />
        );
    case "select":
      return (
        <DropdownPicker
          {...commonProps}
          selectedValue={values[field.name] as string | number | undefined}
          onValueChange={(itemValue) => setFieldValue(field.name, itemValue)}
          options={field.options as AppDropdownOption[] || []}
          placeholder={field.placeholder || `Select ${field.label}...`}
        />
      );
    case "date":
      return (
        <DatePickerField
          {...commonProps}
          value={values[field.name] ? new Date(values[field.name] as string) : null}
          onChange={(date) => setFieldValue(field.name, date ? date.toISOString() : null)}
          placeholder={field.placeholder || "Select date"}
        />
      );
    default:
      console.warn("Unsupported field type in FormField:", field.type);
      return null;
  }
};

const AddCase: React.FC<Props> = ({ fields = SamplefieldsData, route }) => { // Use SamplefieldsData
  const { update = false, initialValues, uniqueId } = route?.params ?? {};
  const navigation = useNavigation();

  // The suggestions state and FetchSuggestion effect are no longer needed
  // as SuggestionInput has been replaced by FormInput in the FormField component.
  // const [suggestions, setSuggestions] = useState({});
  // useEffect(() => {
  //   async function FetchSuggestion() {
  //     try {
  //       console.log("Placeholder for FetchSuggestion with getSuggestionsForField");
  //     } catch (error) {
  //       console.log("error fetching the Suggestions", error);
  //     }
  //   }
  //   FetchSuggestion();
  // }, []);

  const getChangedValues = (
    initial: Partial<CaseData>,
    current: Partial<CaseData>
  ): Partial<CaseData> => {
    const changed: Partial<CaseData> = {};
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const currentKey = key as keyof CaseData;
        if (current[currentKey] !== initial[currentKey]) {
          changed[currentKey] = current[currentKey];
        }
      }
    }
    return changed;
  };

  const handleFinalSubmit = async (formValues: Partial<CaseData>) => {
    console.log("Final form values:", formValues);

    const currentUniqueId = uniqueId || `UID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (update && initialValues?.id) {
      const caseIdToUpdate = initialValues.id;
      const mappedInitialValues: Partial<CaseData> = {
        uniqueId: initialValues.uniqueId,
        id: initialValues.id,
        CaseTitle: initialValues.caseNumber,
        court_name: initialValues.court,
        FiledDate: initialValues.dateFiled?.toISOString(),
        case_type_name: initialValues.caseType,
      };
      const changedValues = getChangedValues(mappedInitialValues, formValues);

      const caseUpdatePayload: CaseUpdateData = {};
      for (const key in changedValues) {
        if (Object.prototype.hasOwnProperty.call(changedValues, key)) {
          const typedKey = key as keyof CaseData;
          const value = changedValues[typedKey];

          if (typedKey === "CNRNumber" && typeof value === 'string') caseUpdatePayload.CNRNumber = value;
          else if (typedKey === "FiledDate" && typeof value === 'string') caseUpdatePayload.dateFiled = value;
          else if (typedKey === "case_number" && typeof value === 'string') caseUpdatePayload.case_number = value;
          else if (typedKey === "case_type_id" && (typeof value === 'number' || value === null)) caseUpdatePayload.case_type_id = value;
          else if (typedKey === "court_id" && (typeof value === 'number' || value === null)) caseUpdatePayload.court_id = value;
          else if (typedKey === "OnBehalfOf" && typeof value === 'string') caseUpdatePayload.OnBehalfOf = value;
          else if (typedKey === "ClientName" && typeof value === 'string') caseUpdatePayload.OnBehalfOf = value;
          else if (typedKey === "FirstParty" && typeof value === 'string') caseUpdatePayload.FirstParty = value;
          else if (typedKey === "OppositeParty" && typeof value === 'string') caseUpdatePayload.OppositeParty = value;
          else if (typedKey === "ClientContactNumber" && typeof value === 'string') caseUpdatePayload.ClientContactNumber = value;
          else if (typedKey === "Accussed" && typeof value === 'string') caseUpdatePayload.Accussed = value;
          else if (typedKey === "Undersection" && typeof value === 'string') caseUpdatePayload.Undersection = value;
          else if (typedKey === "OppositeAdvocate" && typeof value === 'string') caseUpdatePayload.OppositeAdvocate = value;
          else if (typedKey === "OpposingCounsel" && typeof value === 'string') caseUpdatePayload.OppositeAdvocate = value;
          else if (typedKey === "OppAdvocateContactNumber" && typeof value === 'string') caseUpdatePayload.OppAdvocateContactNumber = value;
          else if ((typedKey === "Status" || typedKey === "CaseStatus")  && typeof value === 'string') caseUpdatePayload.CaseStatus = value;
          else if (typedKey === "PreviousDate" && typeof value === 'string') caseUpdatePayload.PreviousDate = value;
          else if ((typedKey === "NextDate" || typedKey === "HearingDate") && typeof value === 'string') caseUpdatePayload.NextDate = value;
        }
      }

      if (Object.keys(caseUpdatePayload).length === 0) {
        console.log("No changes detected to update.");
        navigation.goBack();
        return;
      }

      console.log("Attempting to update case ID:", caseIdToUpdate, "with payload:", caseUpdatePayload);
      try {
        const success = await updateCase(caseIdToUpdate, caseUpdatePayload);
        if (success) {
          console.log("Successfully updated case ID:", caseIdToUpdate);
          const navDetails: CaseDetails = {
            uniqueId: formValues.uniqueId || initialValues.uniqueId,
            id: caseIdToUpdate,
            caseNumber: formValues.CaseTitle || initialValues.caseNumber,
            court: initialValues.court,
            caseType: initialValues.caseType,
            dateFiled: formValues.FiledDate ? new Date(formValues.FiledDate) : initialValues.dateFiled,
          };
          navigation.navigate("CaseDetail", { caseDetails: navDetails });
        } else {
          console.error("Update operation failed for case ID:", caseIdToUpdate);
        }
      } catch (error) {
        console.error("Error submitting update form:", error);
        return;
      }

    } else {
      const caseDataPayload: CaseInsertData = {
        uniqueId: currentUniqueId,
        user_id: null,
        CNRNumber: formValues.CNRNumber || null,
        court_id: typeof formValues.court_id === 'number' ? formValues.court_id : null,
        dateFiled: formValues.FiledDate || null,
        case_type_id: typeof formValues.case_type_id === 'number' ? formValues.case_type_id : null,
        case_number: formValues.case_number || null,
        case_year: typeof formValues.case_year === 'number' ? formValues.case_year : (formValues.case_year ? parseInt(formValues.case_year as string,10) : null),
        crime_number: formValues.crime_number || null,
        crime_year: typeof formValues.crime_year === 'number' ? formValues.crime_year : (formValues.crime_year ? parseInt(formValues.crime_year as string,10) : null),
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
      };

      console.log("Attempting to insert with payload:", caseDataPayload);
      try {
        const newCaseId = await addCase(caseDataPayload);
        if (newCaseId) {
          console.log("Successfully inserted with ID:", newCaseId, "and uniqueId:", currentUniqueId);
          const newCaseDetails: CaseDetails = {
            id: newCaseId,
            uniqueId: currentUniqueId,
            caseNumber: formValues.CaseTitle || "N/A",
            dateFiled: formValues.FiledDate ? new Date(formValues.FiledDate) : undefined,
          };
          navigation.navigate("CaseDetail", { caseDetails: newCaseDetails });
        } else {
          console.error("Insert operation did not return a new ID.");
        }
      } catch (error) {
        console.error("Error submitting the form with addCase:", error);
        return;
      }
    }
  };

  const formikInitialValuesLogic = () => {
    const baseValues: Partial<CaseData> = {};
    SamplefieldsData.forEach(field => { // Use SamplefieldsData
        baseValues[field.name] = field.type === "date" ? null : (field.type === "select" ? (field.options?.[0]?.value !== undefined ? field.options[0].value : '') : '');
    });

    if (update && initialValues) {
        const mapped: Partial<CaseData> = { ...baseValues };
        // More explicit mapping from CaseDetails (summary) to CaseData form fields
        if (initialValues.uniqueId) mapped.uniqueId = initialValues.uniqueId;
        if (initialValues.id) mapped.id = initialValues.id;
        if (initialValues.caseNumber) mapped.CaseTitle = initialValues.caseNumber; // Map caseNumber to CaseTitle
        // For dropdowns (court_id, case_type_id), initialValues (CaseDetails) has names (court, caseType).
        // We cannot directly map these to IDs without a lookup.
        // So, for update, these dropdowns will show their placeholder or first option unless
        // EditCaseScreen (which uses full CaseData) is used for updates.
        // For now, they will default to placeholder/first option.
        if (initialValues.dateFiled) mapped.FiledDate = initialValues.dateFiled.toISOString();

        // Example: if initialValues had more fields that map directly to CaseData keys
        // if (initialValues.SomeOtherField) mapped.SomeOtherField = initialValues.SomeOtherField;
        return mapped;
    }
    return baseValues;
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
            initialValues={formikInitialValuesLogic()}
            validationSchema={validationSchema}
            onSubmit={handleFinalSubmit}
            enableReinitialize
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            setFieldValue,
            errors,
            touched,
          }) => (
            <View>
              {SamplefieldsData.map((field, index) => ( // Use SamplefieldsData
                <View key={index}>
                  <FormField
                    field={field}
                    handleChange={(name) => (val) => setFieldValue(name, val)}
                    handleBlur={(name) => () => handleBlur(name)}
                    values={values}
                    errors={ (touched[field.name] && errors[field.name]) ? { [field.name]: errors[field.name] as string } : {} } // Ensure error is string
                    setFieldValue={setFieldValue}
                  />
                </View>
              ))}
              <View style={styles.actionButtonContainer}>
                <ActionButton
                    title={update ? "Save Changes" : "Save Case"}
                    onPress={() => handleSubmit()}
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
    // The ActionButton components have their own internal padding and margins.
    // If more specific layout is needed for the container of these two buttons:
    // e.g., using buttonWrapper styles from EditCaseScreenStyles
    // <View style={EditCaseScreenStyles.buttonWrapper}><ActionButton .../></View>
    // <View style={EditCaseScreenStyles.buttonWrapper}><ActionButton .../></View>
  },
  // Old styles that are likely no longer needed due to common component usage:
  // label: { ... },
  // inputField: { ... },
  // dropdownContainer: { ... },
  // datePickerContainer: { ... },
});
    type: "text",
    placeholder: "Enter Case Number",
    label: "CaseNumber/STNumber",
    //this must also have year field with dropdown and search
  },
  {
    name: "CrimeNo",
    type: "text",
    placeholder: "Enter Crime Number",
    label: "Crime Number",
    //this must also have year field with dropdown and search
  },
  {
    name: "OnBehalfOf",
    type: "text",
    placeholder: "On Behalf of",
    label: "On Behalf of",
    //this should contain the manual add
  },
  {
    name: "FirstParty",
    type: "text",
    placeholder: "Enter First Party",
    label: "Enter First Party",
  },
  {
    name: "OppositeParty",
    type: "text",
    placeholder: "Enter Opposite Party",
    label: "Enter Opposite Party",
  },
  {
    name: "ClientContactNumber",
    type: "text",
    placeholder: "Enter Contact Number",
    label: "Client Contact Number",
  },
  {
    name: "Accussed",
    type: "text",
    placeholder: "Enter Accused Name",
    label: "Accused",
  },
  {
    name: "Undersection",
    type: "text",
    placeholder: "UnderSection",
    label: "UnderSection",
  },
  {
    name: "PoliceStation",
    type: "text",
    placeholder: "Enter Police Station",
    label: "Police Station",
  },
  {
    name: "District",
    type: "select",
    label: "District",
    options: [
      { label: "Bareilly", value: "Bareilly" },
      { label: "Lucknow", value: "Lucknow" },
    ],
    //List all the Districts in india with search
  },
  {
    name: "OppositeAdvocate",
    type: "text",
    label: "Opposite Advocate",
    placeholder: "Opposite Advocate",
  },
  {
    name: "OppAdvocateContactNumber",
    type: "text",
    label: "Opp. Advocate Contact No.",
    placeholder: "Contact Number",
  },
  {
    name: "CaseStatus",
    type: "text",
    label: "Case Status",
    placeholder: " Case Status",
  },
  { name: "PreviousDate", type: "date", label: "Previous Date" },
  { name: "NextDate", type: "date", label: "Next Date" },

  // Add more fields with different types as needed
];

// Sample validation schema
const validationSchema = Yup.object().shape({
  // Define your validation rules here based on your fields
});

// Define a component to render different types of form inputs
const FormField: React.FC<{
  field: Field;
  handleChange: (fieldName: string) => (value: any) => void; // Simplified for direct use
  handleBlur: (fieldName: string) => () => void; // Simplified for direct use
  values: Partial<CaseData>; // Use Partial<CaseData>
  errors: { [key in keyof CaseData]?: string }; // Typed errors
  setFieldValue: (field: keyof CaseData, value: any, shouldValidate?: boolean) => void;
  // openDatePicker and suggestionArray might become obsolete or handled differently
}> = ({
  field,
  handleChange, // Formik's handleChange can still be used if preferred
  handleBlur,   // Formik's handleBlur
  values,
  errors,
  setFieldValue, // Formik's setFieldValue is useful for custom components
}) => {
  const commonProps = {
    label: field.label,
    error: errors[field.name],
    // onBlur: handleBlur(field.name), // If FormInput supported onBlur directly in a way Formik likes
  };

  switch (field.type) {
    case "text":
      // SuggestionInput is a custom component. If we want to use FormInput for plain text:
      // For now, let's assume SuggestionInput will be styled or replaced by FormInput.
      // If SuggestionInput is to be kept, it needs styling similar to FormInput.
      // This example will use FormInput for simplicity of demonstrating the switch.
      return (
        <FormInput
          {...commonProps}
          value={values[field.name] as string || ''}
          placeholder={field.placeholder}
          onChangeText={(text) => setFieldValue(field.name, text)} // Use setFieldValue for Formik
          // keyboardType, secureTextEntry, multiline can be added to Field interface
        />
      );
    case "multiline": // Added a specific type for multiline text areas
        return (
          <FormInput
            {...commonProps}
            value={values[field.name] as string || ''}
            placeholder={field.placeholder}
            onChangeText={(text) => setFieldValue(field.name, text)}
            multiline
            numberOfLines={4} // Default, can be made configurable via Field interface
            style={{minHeight: 80}}
          />
        );
    case "select":
      return (
        <DropdownPicker
          {...commonProps}
          selectedValue={values[field.name] as string | number | undefined}
          onValueChange={(itemValue) => setFieldValue(field.name, itemValue)}
          options={field.options as AppDropdownOption[] || []} // Cast to ensure compatibility
          placeholder={field.placeholder || `Select ${field.label}...`}
        />
      );
    case "date":
      return (
        <DatePickerField
          {...commonProps}
          value={values[field.name] ? new Date(values[field.name] as string) : null}
          onChange={(date) => setFieldValue(field.name, date ? date.toISOString() : null)}
          placeholder={field.placeholder || "Select date"}
        />
      );
    default:
      console.warn("Unsupported field type in FormField:", field.type);
      return null;
  }
};

const AddCase: React.FC<Props> = ({ fields = Samplefields, route }) => {
  const { update = false, initialValues, uniqueId } = route?.params;
  console.log("uniqueId value inAddcase", uniqueId);
  const navigation = useNavigation();
  const [selectedDateField, setSelectedDateField] = useState<string | null>(
    null
  );
  const [suggestions, setSuggestions] = useState({});
  useEffect(() => {
    // Reset selectedDateField state when the component re-renders
    setSelectedDateField(null);
  }, []);
  useEffect(() => {
    async function FetchSuggestion() {
      try {
        // TODO: Review getSuggestionsForField usage based on its signature in DataBase/index.ts
        // It expects (fieldName, userId, districtIdForPoliceStations)
        // The current `suggestionsInputFields` might need to be iterated or handled differently.
        // For now, this part is kept as is, focusing on addCase.
        // const data = await getSuggestionsForField(global.db, suggestionsInputFields);
        // console.log("Suggestion bala data is ", data);
        // setSuggestions(data);
        console.log("Placeholder for FetchSuggestion with getSuggestionsForField");
      } catch (error) {
        console.log("error fetching the Suggestions", error);
      }
    }
    FetchSuggestion();
  }, []);

  const handleDatePickerChange = (
    fieldName: string,
    event: DateTimePickerEvent,
    selectedDate?: Date,
    setFieldValue?: (field: string, value: any) => void
  ) => {
    if (event.type === "set" && selectedDate) {
      console.log("selectedDate is :", selectedDate);
      setFieldValue(fieldName, formatDate(selectedDate.toISOString()));
    }
    setSelectedDateField(null);
  };
  const getChangedValues = (
    initialValues: CaseDetails,
    currentValues: { [key: string]: string }
  ) => {
    return Object.keys(currentValues).reduce(
      (acc, key) => {
        if (currentValues[key] !== initialValues[key]) {
          acc[key] = currentValues[key];
        }
        return acc;
      },
      {} as { [key: string]: string }
    );
  };
  const handleFinalSubmit = async (values: { [key: string]: string }) => {
    console.log("Final form values:", values); // Log the final form values

    // Ensure uniqueId is present. If not passed via route.params, generate one.
    // This is a placeholder for uniqueId generation logic if needed.
    // For now, relying on route.params.uniqueId which is used by addCase.
    const currentUniqueId = uniqueId || `UID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


    if (update && initialValues?.id) { // Check for initialValues.id for update
      const caseIdToUpdate = initialValues.id;
      // Perform update operation
      const changedValues = getChangedValues(
        initialValues as CaseDetails, // Assuming CaseDetails is compatible enough with CaseRow
        values
      );

      // Map changedValues to CaseUpdateData structure
      // This is a simplified mapping. Similar to addCase, name-to-ID conversions
      // would be needed here if those fields are updatable and changed.
      const caseUpdatePayload: CaseUpdateData = {};

      // Iterate over changedValues and map them to known fields in CaseUpdateData
      // This assumes form field names (keys in `changedValues`) might need mapping
      // to schema field names. For now, direct mapping where names match.
      for (const key in changedValues) {
        if (Object.prototype.hasOwnProperty.call(changedValues, key)) {
          const value = changedValues[key];
          // Example direct mappings (add more as needed, and handle ID lookups)
          if (key === "CNRNumber") caseUpdatePayload.CNRNumber = value;
          else if (key === "dateFiled") caseUpdatePayload.dateFiled = value; // Ensure "YYYY-MM-DD"
          else if (key === "CaseNo") caseUpdatePayload.case_number = value;
          // else if (key === "CaseNoYear") caseUpdatePayload.case_year = value ? parseInt(value, 10) : null;
          else if (key === "CrimeNo") caseUpdatePayload.crime_number = value;
          // else if (key === "CrimeNoYear") caseUpdatePayload.crime_year = value ? parseInt(value, 10) : null;
          else if (key === "OnBehalfOf") caseUpdatePayload.OnBehalfOf = value;
          else if (key === "FirstParty") caseUpdatePayload.FirstParty = value;
          else if (key === "OppositeParty") caseUpdatePayload.OppositeParty = value;
          else if (key === "ClientContactNumber") caseUpdatePayload.ClientContactNumber = value;
          else if (key === "Accussed") caseUpdatePayload.Accussed = value;
          else if (key === "Undersection") caseUpdatePayload.Undersection = value;
          else if (key === "OppositeAdvocate") caseUpdatePayload.OppositeAdvocate = value;
          else if (key === "OppAdvocateContactNumber") caseUpdatePayload.OppAdvocateContactNumber = value;
          else if (key === "CaseStatus") caseUpdatePayload.CaseStatus = value;
          else if (key === "PreviousDate") caseUpdatePayload.PreviousDate = value; // Ensure "YYYY-MM-DD"
          else if (key === "NextDate") caseUpdatePayload.NextDate = value; // Ensure "YYYY-MM-DD"
          // TODO: Add mappings for fields requiring ID lookups if they are changed:
          // e.g., if values.CourtName changed, you'd need to get its ID for court_id
          // if (key === "CourtName") caseUpdatePayload.court_id = await getCourtId(value);
          // if (key === "caseType") caseUpdatePayload.case_type_id = await getCaseTypeId(value);
          // if (key === "PoliceStation") caseUpdatePayload.police_station_id = await getPoliceStationId(value);
        }
      }

      if (Object.keys(caseUpdatePayload).length === 0) {
        console.log("No changes detected to update.");
        // Optionally navigate back or show a message
        navigation.goBack();
        return;
      }

      console.log("Attempting to update case ID:", caseIdToUpdate, "with payload:", caseUpdatePayload);

      try {
        // const userId = null; // TODO: Get actual user ID if available for actorUserId
        const success = await updateCase(caseIdToUpdate, caseUpdatePayload /*, userId */);
        if (success) {
          console.log("Successfully updated case ID:", caseIdToUpdate);
          // Optimistically update the details for navigation
          const updatedDetails = { ...initialValues, ...changedValues };
          navigation.navigate("CaseDetail", {
             caseDetails: updatedDetails as CaseDetails, // Cast needed if CaseDetails is different from CaseRow
          });
        } else {
          console.error("Update operation failed or no rows were changed for case ID:", caseIdToUpdate);
          // Handle error: show message to user
        }
      } catch (error) {
        console.error("Error submitting update form with updateCase:", error);
        // Handle error: show message to user
        return;
      }

    } else {
      // Perform insert operation
      // Basic mapping from form `values` to `CaseInsertData`.
      // This is a simplified mapping. Many fields (CourtName, caseType, PoliceStation, District)
      // need to be converted to their respective IDs.
      // This requires further logic to fetch or look up these IDs.
      const caseDataPayload: CaseInsertData = {
        uniqueId: currentUniqueId, // Essential: from route.params or generated
        user_id: null, // TODO: Assign actual user_id if available (e.g., from auth context)

        CNRNumber: values.CNRNumber || null,
        // court_id: Requires lookup from values.CourtName
        // For now, placeholder or requires UI change to select court and get ID
        court_id: null, // Placeholder: Needs ID from values.CourtName
        dateFiled: values.dateFiled || null, // Ensure this is "YYYY-MM-DD"
        // case_type_id: Requires lookup from values.caseType (e.g., "civil" -> ID)
        case_type_id: null, // Placeholder: Needs ID from values.caseType
        case_number: values.CaseNo || null, // Form uses "CaseNo"
        case_year: values.CaseNoYear ? parseInt(values.CaseNoYear, 10) : null, // Assuming CaseNoYear field exists
        crime_number: values.CrimeNo || null, // Form uses "CrimeNo"
        crime_year: values.CrimeNoYear ? parseInt(values.CrimeNoYear, 10) : null, // Assuming CrimeNoYear field exists

        OnBehalfOf: values.OnBehalfOf || null,
        FirstParty: values.FirstParty || null,
        OppositeParty: values.OppositeParty || null,
        ClientContactNumber: values.ClientContactNumber || null,
        Accussed: values.Accussed || null,

        Undersection: values.Undersection || null,
        // police_station_id: Requires lookup from values.PoliceStation (and possibly district_id)
        police_station_id: null, // Placeholder

        OppositeAdvocate: values.OppositeAdvocate || null,
        OppAdvocateContactNumber: values.OppAdvocateContactNumber || null,

        CaseStatus: values.CaseStatus || null,
        PreviousDate: values.PreviousDate || null, // Ensure "YYYY-MM-DD"
        NextDate: values.NextDate || null, // Ensure "YYYY-MM-DD"
      };

      console.log("Attempting to insert with payload:", caseDataPayload);

      try {
        // global.db is used here. Ideally, getDb() should be called.
        // This will be addressed in a later step if requested.
        const newCaseId = await addCase(caseDataPayload);
        if (newCaseId) {
          console.log("Successfully inserted with ID:", newCaseId, "and uniqueId:", currentUniqueId);
          // Navigate to Documents tab, passing the new caseId and the uniqueId used.
          // The DocumentUpload screen (Documents tab) should use caseId if available.
          navigation.navigate("Documents", { caseId: newCaseId, uniqueId: currentUniqueId });
        } else {
          console.error("Insert operation did not return a new ID.");
          // Handle error: show message to user
        }
      } catch (error) {
        console.error("Error submitting the form with addCase:", error);
        // Handle error: show message to user, check if it's a duplicate uniqueId error, etc.
        return; // Stop execution if error occurs
      }
    }
    // onSubmit(values); // Original onSubmit call, if needed for other purposes.
  };

  const openDatePicker = (fieldName: string) => {
    setSelectedDateField(fieldName);
  };
  return (
    <ScrollView keyboardShouldPersistTaps="always">
      <View style={styles.AddCaseContainer}>
        <Text>{update ? "Update" : "Add"} a case</Text>
        <Text>Fill the below form to {update ? "Update" : "add new"} Case</Text>
        <View style={styles.FormContainer}>
          <Formik
            initialValues={
              initialValues
                ? initialValues
                : fields?.reduce<{ [key: string]: string }>(
                    (acc, field) => ({
                      ...acc,
                      [field.name]:
                        field.type === "date" ? formatDate(new Date()) : "",
                    }),
                    {}
                  )
            }
            validationSchema={validationSchema}
            onSubmit={handleFinalSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              setFieldValue,
              errors,
            }) => (
              <View>
                {fields?.map((field, index) => (
                  <View key={index}>
                    <FormField
                      field={field}
                      handleChange={handleChange}
                      handleBlur={handleBlur}
                      values={values}
                      errors={errors}
                      openDatePicker={() => openDatePicker(field.name)}
                      suggestionArray={suggestions[field.name]}
                    />
                    {selectedDateField === field.name && (
                      <DateTimePicker
                        id={field.name}
                        value={
                          values[field.name]
                            ? new Date(values[field.name])
                            : new Date()
                        }
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) =>
                          handleDatePickerChange(
                            field.name,
                            event,
                            selectedDate,
                            setFieldValue
                          )
                        }
                      />
                    )}
                  </View>
                ))}
                <Button
                  title={update ? "Update" : "Submit"}
                  onPress={() => handleSubmit()}
                />
              </View>
            )}
          </Formik>
        </View>
      </View>
    </ScrollView>
  );
};

export default AddCase;

const styles = StyleSheet.create({
  AddCaseContainer: {
    height: "100%",
    padding: 10,
  },
  AddCaseHeader: {},
  FormContainer: {},
  inputField: {
    height: 40,
    minWidth: "90%",
    borderWidth: 1, // Set the border width
    borderColor: "gray", // Set the border color
    borderRadius: 5, // Set the border radius for rounded corners
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  errorInput: {
    borderColor: "red",
  },
  dropdownContainer: {
    height: 40,
    minWidth: "90%",
    borderWidth: 1,
    borderColor: "#7a7a7a",
    borderRadius: 5,
    marginBottom: 20,
    overflow: "hidden",
  },
  dropdown: {
    minWidth: "90%",
    height: 40,
    paddingHorizontal: 10,
  },
  datePickerContainer: {
    height: 40,
    width: "90%",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    marginBottom: 20,
  },
  datePicker: {
    height: 40,
    minWidth: "90%",
  },
  label: {
    marginBottom: 2,
  },
});
