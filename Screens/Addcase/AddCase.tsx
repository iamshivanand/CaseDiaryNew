import { Formik, FormikProps } from "formik";
import React, { useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
} from "react-native";
import * as Yup from "yup";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { v4 as uuidv4 } from "uuid";

import {
  addCase,
  updateCase,
  CaseInsertData,
  CaseUpdateData,
  addCaseType,
  addCourt,
  getSuggestionsForField,
} from "../../DataBase";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { CaseDataScreen } from "../../Types/appTypes";
import { formatDate } from "../../utils/commonFunctions";
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen";
import { CaseData, DropdownOption as AppDropdownOption, caseStatusOptions, priorityOptions } from "../../Types/appTypes";

import FormInput from '../CommonComponents/FormInput';
import DropdownPicker from '../CommonComponents/DropdownPicker';
import DatePickerField from '../CommonComponents/DatePickerField';
import ActionButton from "../CommonComponents/ActionButton";
import { getAddCaseStyles } from "../EditCase/EditCaseScreenStyle";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import SuggestionInput from "../CommonComponents/SuggestionsInput";

interface FieldDefinition {
  name: keyof CaseData;
  type: "text" | "select" | "date" | "multiline" | "suggestions";
  placeholder?: string;
  label: string;
  options?: AppDropdownOption[];
}

type AddCaseScreenRouteProp = RouteProp<HomeStackParamList, "AddCaseDetails">;

interface AddCaseProps {
  route: AddCaseScreenRouteProp;
}

const dummyCaseTypeOptionsForAdd: AppDropdownOption[] = [
  { label: 'Select Case Type...', value: '' }, { label: 'Civil Suit', value: 1 }, { label: 'Criminal Defense', value: 2 }, { label: 'Family Law', value: 3 }, { label: 'Corporate', value: 4 }, { label: 'Other', value: 'Other' },
];
const dummyCourtOptionsForAdd: AppDropdownOption[] = [
  { label: 'Select Court...', value: '' }, { label: 'District Court - City Center', value: 1 }, { label: 'High Court - State Capital', value: 2 }, { label: 'Supreme Court', value: 3 }, { label: 'Other', value: 'Other' },
];

const formFieldsDefinition: FieldDefinition[] = [
  { name: "CaseTitle", type: "text", placeholder: "e.g., State vs. John Doe", label: "Case Title*" },
  { name: "ClientName", type: "text", placeholder: "Enter Client's Full Name", label: "Client Name" },
  { name: "case_number", type: "text", placeholder: "e.g., CS/123/2023", label: "Case Number" },
  { name: "CNRNumber", type: "text", placeholder: "Enter CNR Number", label: "CNR Number"},
  { name: "case_type_id", type: "select", label: "Case Type", options: dummyCaseTypeOptionsForAdd, placeholder: "Select Case Type..." },
  { name: "court_id", type: "select", label: "Court", options: dummyCourtOptionsForAdd, placeholder: "Select Court..." },
  { name: "FiledDate", type: "date", label: "Date Filed", placeholder: "Select date case was filed" },
  { name: "JudgeName", type: "suggestions", placeholder: "Enter Judge's Name", label: "Presiding Judge" },
  { name: "OpposingCounsel", type: "text", placeholder: "Enter Opposing Counsel's Name", label: "Opposing Counsel" },
  { name: "Status", type: "select", label: "Case Status", options: caseStatusOptions, placeholder: "Select Status..." },
  { name: "Priority", type: "select", label: "Priority Level", options: priorityOptions, placeholder: "Select Priority..." },
  { name: "HearingDate", type: "date", label: "Next Hearing Date", placeholder: "Select next hearing date" },
  { name: "StatuteOfLimitations", type: "date", label: "Statute of Limitations", placeholder: "Select SOL date" },
  { name: "FirstParty", type: "text", placeholder: "Enter First Party Name", label: "First Party" },
  { name: "OppositeParty", type: "text", placeholder: "Enter Opposite Party Name", label: "Opposite Party" },
  { name: "ClientContactNumber", type: "text", placeholder: "Enter Client's Contact Number", label: "Client Contact No." },
  { name: "Accussed", type: "text", placeholder: "Enter Accused Name(s)", label: "Accused" },
  { name: "Undersection", type: "suggestions", placeholder: "e.g., Section 302 IPC", label: "Under Section(s)" },
  { name: "CaseDescription", type: "multiline", placeholder: "Provide a brief summary...", label: "Case Description" },
  { name: "CaseNotes", type: "multiline", placeholder: "Add any private notes...", label: "Internal Notes" },
];

const validationSchema = Yup.object().shape({
  CaseTitle: Yup.string().required("Case Title is required"),
});

const FormFieldRenderer: React.FC<{
  fieldConfig: FieldDefinition;
  formik: FormikProps<Partial<CaseData>>;
  otherValues: { [key: string]: string };
  setOtherValue: (fieldName: string, value: string) => void;
  suggestions: { [key: string]: string[] };
}> = ({ fieldConfig, formik, otherValues, setOtherValue, suggestions }) => {
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
      return <FormInput {...commonInputProps} value={values[fieldName] as string || ''} placeholder={fieldConfig.placeholder} onChangeText={(text) => setFieldValue(fieldName, text)} multiline numberOfLines={4} style={{ minHeight: 80, paddingTop: 10, paddingBottom: 10 }} />;
    case "select":
      return <DropdownPicker {...commonInputProps} selectedValue={values[fieldName] as string | number | undefined} onValueChange={(itemValue) => setFieldValue(fieldName, itemValue)} options={fieldConfig.options || []} placeholder={fieldConfig.placeholder || `Select ${fieldConfig.label}...`} onOtherValueChange={(text) => setOtherValue(fieldName, text)} />;
    case "date":
      return <DatePickerField {...commonInputProps} value={values[fieldName] ? new Date(values[fieldName] as string) : null} onChange={(date) => setFieldValue(fieldName, date ? date.toISOString() : null)} placeholder={fieldConfig.placeholder || "Select date"} />;
    case "suggestions":
      return <SuggestionInput {...commonInputProps} value={values[fieldName] as string || ''} placeholder={fieldConfig.placeholder} onChangeText={(text) => setFieldValue(fieldName, text)} suggestions={suggestions[fieldName] || []} onBlur={() => {}} />;
    default:
      console.warn("Unsupported field type:", fieldConfig.type);
      return null;
  }
};

const AddCase: React.FC<AddCaseProps> = ({ route }) => {
  const params = route.params;
  const { update = false, initialValues, uniqueId: routeUniqueId } = params ?? {};
  const { theme } = React.useContext(ThemeContext);
  const styles = getAddCaseStyles(theme);

  const navigation = useNavigation();
  const generatedUniqueId = useMemo(() => uuidv4(), []);
  const uniqueIdToUse = routeUniqueId || initialValues?.uniqueId || generatedUniqueId;

  const [otherValues, setOtherValues] = useState<{ [key: string]: string }>({});
  const setOtherValue = (fieldName: string, value: string) => {
    setOtherValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const [suggestions, setSuggestions] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    const fetchSuggestions = async () => {
      const judgeNameSuggestions = await getSuggestionsForField("JudgeName");
      const undersectionSuggestions = await getSuggestionsForField("Undersection");
      setSuggestions({
        JudgeName: judgeNameSuggestions.map((s) => s.name),
        Undersection: undersectionSuggestions.map((s) => s.name),
      });
    };
    fetchSuggestions();
  }, []);

  const prepareFormInitialValues = (): Partial<CaseData> => {
    const defaults: Partial<CaseData> = { uniqueId: uniqueIdToUse };
    formFieldsDefinition.forEach(field => {
      if (field.name !== 'uniqueId') {
        defaults[field.name] = field.type === "date" ? null : (field.type === "select" ? (field.options?.[0]?.value ?? '') : '');
      }
    });

    if (update && initialValues) {
      const mappedInitialValues: Partial<CaseData> = { ...defaults };
      if (initialValues.uniqueId) mappedInitialValues.uniqueId = initialValues.uniqueId;
      if (initialValues.id) mappedInitialValues.id = initialValues.id;
      if (initialValues.caseNumber) mappedInitialValues.CaseTitle = initialValues.caseNumber;
      if (initialValues.dateFiled) mappedInitialValues.FiledDate = initialValues.dateFiled.toISOString();

      const initialCourt = dummyCourtOptionsForAdd.find(opt => opt.label === initialValues.court);
      if (initialCourt) mappedInitialValues.court_id = initialCourt.value;

      const initialCaseType = dummyCaseTypeOptionsForAdd.find(opt => opt.label === initialValues.caseType);
      if (initialCaseType) mappedInitialValues.case_type_id = initialCaseType.value;

      return mappedInitialValues;
    }
    return defaults;
  };

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


  const handleSubmitForm = async (formValues: Partial<CaseData>) => {
    console.log("Submitting form values:", formValues);

    let courtNameString = null;
    if (formValues.court_id === 'Other') {
      courtNameString = otherValues['court_id'];
      if (courtNameString) {
        const newCourtId = await addCourt(courtNameString);
        formValues.court_id = newCourtId;
      }
    } else {
      const selectedCourtOption = dummyCourtOptionsForAdd.find(opt => opt.value === formValues.court_id);
      courtNameString = selectedCourtOption && selectedCourtOption.value !== '' ? selectedCourtOption.label : null;
    }

    let caseTypeNameString = null;
    if (formValues.case_type_id === 'Other') {
      caseTypeNameString = otherValues['case_type_id'];
      if (caseTypeNameString) {
        const newCaseTypeId = await addCaseType(caseTypeNameString);
        formValues.case_type_id = newCaseTypeId;
      }
    } else {
      const selectedCaseTypeOption = dummyCaseTypeOptionsForAdd.find(opt => opt.value === formValues.case_type_id);
      caseTypeNameString = selectedCaseTypeOption && selectedCaseTypeOption.value !== '' ? selectedCaseTypeOption.label : null;
    }


    if (update && initialValues?.id) {
      const caseIdToUpdate = initialValues.id;

      const initialFormStateForCompare = prepareFormInitialValues();
      const changedFields = getChangedValues(initialFormStateForCompare, formValues);

      if (Object.keys(changedFields).length === 0) {
        console.log("No changes detected to update.");
        navigation.goBack();
        return;
      }

      const updatePayload: CaseUpdateData = {
        ...(changedFields.CaseTitle && { CaseTitle: changedFields.CaseTitle }),
        ...(changedFields.ClientName && { ClientName: changedFields.ClientName }),
        ...(changedFields.CNRNumber && { CNRNumber: changedFields.CNRNumber }),
        court_id: formValues.court_id || null,
        court_name: courtNameString,
        dateFiled: changedFields.FiledDate,
        case_type_id: formValues.case_type_id || null,
        case_type_name: caseTypeNameString,
        ...(changedFields.case_number && { case_number: changedFields.case_number }),
        ...(changedFields.case_year && { case_year: changedFields.case_year ? parseInt(changedFields.case_year as string, 10) : null }),
        ...(changedFields.crime_number && { crime_number: changedFields.crime_number }),
        ...(changedFields.crime_year && { crime_year: changedFields.crime_year ? parseInt(changedFields.crime_year as string, 10) : null }),
        ...(changedFields.JudgeName && { JudgeName: changedFields.JudgeName }),
        ...(changedFields.OnBehalfOf && { OnBehalfOf: changedFields.OnBehalfOf }),
        ...(changedFields.FirstParty && { FirstParty: changedFields.FirstParty }),
        ...(changedFields.OppositeParty && { OppositeParty: changedFields.OppositeParty }),
        ...(changedFields.ClientContactNumber && { ClientContactNumber: changedFields.ClientContactNumber }),
        ...(changedFields.Accussed && { Accussed: changedFields.Accussed }),
        ...(changedFields.Undersection && { Undersection: changedFields.Undersection }),
        ...(changedFields.police_station_id && { police_station_id: typeof changedFields.police_station_id === 'number' ? changedFields.police_station_id : null }),
        ...(changedFields.StatuteOfLimitations && { StatuteOfLimitations: changedFields.StatuteOfLimitations }),
        ...(changedFields.OpposingCounsel && { OpposingCounsel: changedFields.OpposingCounsel }),
        ...(changedFields.OppositeAdvocate && { OppositeAdvocate: changedFields.OppositeAdvocate }),
        ...(changedFields.OppAdvocateContactNumber && { OppAdvocateContactNumber: changedFields.OppAdvocateContactNumber }),
        ...(changedFields.Status && { CaseStatus: changedFields.Status }),
        ...(changedFields.Priority && { Priority: changedFields.Priority }),
        ...(changedFields.PreviousDate && { PreviousDate: changedFields.PreviousDate }),
        ...(changedFields.HearingDate && { NextDate: changedFields.HearingDate }),
        ...(changedFields.CaseDescription && { CaseDescription: changedFields.CaseDescription }),
        ...(changedFields.CaseNotes && { CaseNotes: changedFields.CaseNotes }),
      };
       Object.keys(updatePayload).forEach(key => {
        const K = key as keyof CaseUpdateData;
        if (updatePayload[K] === undefined) {
          delete updatePayload[K];
        }
      });


      console.log("Attempting to update with payload:", JSON.stringify(updatePayload, null, 2));
      try {
        const success = await updateCase(caseIdToUpdate, updatePayload);
        if (success) {
          Alert.alert("Success", "Case updated successfully.");
          const navDetails: CaseDataScreen = {
            id: caseIdToUpdate.toString(),
            title: formValues.CaseTitle || "No Title",
            client: formValues.ClientName || "N/A",
            status: formValues.Status || "N/A",
            nextHearing: formValues.HearingDate
              ? formatDate(formValues.HearingDate)
              : "N/A",
            lastUpdate: new Date().toISOString(),
            previousHearing: formValues.PreviousDate
              ? formatDate(formValues.PreviousDate)
              : "N/A",
          };
          navigation.navigate("CaseDetails", {
            caseDetails: navDetails,
          });
        } else { Alert.alert("Error", "Failed to update case."); }
      } catch (e) { console.error("Error updating case:", e); Alert.alert("Error", "An error occurred while updating.");}
    } else {
      const insertPayload: CaseInsertData = {
        uniqueId: formValues.uniqueId || uniqueIdToUse,
        user_id: null,
        CaseTitle: formValues.CaseTitle || null,
        ClientName: formValues.ClientName || null,
        CNRNumber: formValues.CNRNumber || null,
        court_id: formValues.court_id || null,
        court_name: courtNameString,
        dateFiled: formValues.FiledDate || null,
        case_type_id: formValues.case_type_id || null,
        case_type_name: caseTypeNameString,
        case_number: formValues.case_number || null,
        case_year: formValues.case_year ? parseInt(formValues.case_year as string, 10) : null,
        crime_number: formValues.crime_number || null,
        crime_year: formValues.crime_year ? parseInt(formValues.crime_year as string, 10) : null,
        JudgeName: formValues.JudgeName || null,
        OnBehalfOf: formValues.OnBehalfOf || null,
        FirstParty: formValues.FirstParty || null,
        OppositeParty: formValues.OppositeParty || null,
        ClientContactNumber: formValues.ClientContactNumber || null,
        Accussed: formValues.Accussed || null,
        Undersection: formValues.Undersection || null,
        police_station_id: typeof formValues.police_station_id === 'number' ? formValues.police_station_id : null,
        StatuteOfLimitations: formValues.StatuteOfLimitations || null,
        OpposingCounsel: formValues.OpposingCounsel || null,
        OppositeAdvocate: formValues.OppositeAdvocate || null,
        OppAdvocateContactNumber: formValues.OppAdvocateContactNumber || null,
        CaseStatus: formValues.Status || null,
        Priority: formValues.Priority || null,
        PreviousDate: formValues.PreviousDate || null,
        NextDate: formValues.HearingDate || null,
        CaseDescription: formValues.CaseDescription || null,
        CaseNotes: formValues.CaseNotes || null,
      };

      console.log("Attempting to insert with payload:", JSON.stringify(insertPayload, null, 2));
      try {
        const newCaseId = await addCase(insertPayload);
        if (newCaseId) {
          Alert.alert("Success", "Case added successfully.");
          const navDetails: CaseDataScreen = {
            id: newCaseId.toString(),
            title: insertPayload.CaseTitle || "No Title",
            client: insertPayload.ClientName || "N/A",
            status: insertPayload.CaseStatus || "N/A",
            nextHearing: insertPayload.NextDate
              ? formatDate(insertPayload.NextDate)
              : "N/A",
            lastUpdate: insertPayload.updated_at
              ? formatDate(insertPayload.updated_at)
              : "N/A",
            previousHearing: insertPayload.PreviousDate
              ? formatDate(insertPayload.PreviousDate)
              : "N/A",
          };
          navigation.navigate("CaseDetails", {
            caseDetails: navDetails,
          });
        } else {
          Alert.alert("Error", "Failed to add case.");
        }
      } catch (e) {
        console.error("Error adding case:", e);
        Alert.alert("Error", "An error occurred while adding case.");
      }
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
                <FormFieldRenderer key={fieldConfig.name} fieldConfig={fieldConfig} formik={formikProps} otherValues={otherValues} setOtherValue={setOtherValue} suggestions={suggestions} />
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

const getAddCaseStyles = (theme: Theme) => StyleSheet.create({
  scrollViewStyle: {
    flex: 1,
    backgroundColor: theme.colors.screenBackground || theme.colors.background,
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
    color: theme.colors.text,
    textAlign: 'center',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
});
