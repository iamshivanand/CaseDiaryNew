import { Formik, FormikProps } from "formik";
import React, { useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import * as Yup from "yup";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { v4 as uuidv4 } from "uuid";
import { Ionicons } from "@expo/vector-icons";
import { useAdTrigger } from "../CommonComponents/AdManager";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  addCase,
  updateCase,
  CaseInsertData,
  CaseUpdateData,
  addCaseType,
  addCourt,
  getSuggestionsForField,
  getPoliceStations,
  addPoliceStation,
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
import { getAddCaseStyles } from "./AddCaseStyle";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import { useTranslation } from "../../Providers/LanguageProvider";

interface FieldDefinition {
  name: keyof CaseData;
  type: "text" | "select" | "date" | "multiline";
  placeholder?: string;
  label: string;
  options?: AppDropdownOption[];
  suggestions?: boolean;
  testID?: string;
}

type AddCaseScreenRouteProp = RouteProp<HomeStackParamList, "AddCaseDetails">;

interface AddCaseProps {
  route: AddCaseScreenRouteProp;
}

const dummyCaseTypeOptionsForAdd: AppDropdownOption[] = [
  { label: 'Civil Suit', value: 1 }, { label: 'Criminal Defense', value: 2 }, { label: 'Family Law', value: 3 }, { label: 'Corporate', value: 4 }, { label: 'Other', value: 'Other' },
];
const dummyCourtOptionsForAdd: AppDropdownOption[] = [
  { label: 'District Court - City Center', value: 1 }, { label: 'High Court - State Capital', value: 2 }, { label: 'Supreme Court', value: 3 }, { label: 'Other', value: 'Other' },
];

const formFieldsDefinition: FieldDefinition[] = [
  { name: "CaseTitle", type: "text", placeholder: "e.g., State vs. John Doe", label: "Case Title*", suggestions: true },
  { name: "ClientName", type: "text", placeholder: "Enter Client's Full Name", label: "Client Name", suggestions: true },
  { name: "ClientContactNumber", type: "text", placeholder: "Enter Client's Contact Number", label: "Client Contact No." },
  { name: "CNRNumber", type: "text", placeholder: "Enter CNR Number", label: "CNR Number"},
  { name: "case_number", type: "text", placeholder: "e.g., CS/123/2023", label: "Case Number" },
  { name: "crime_number", type: "text", placeholder: "e.g., FIR/Crime No. 123", label: "Crime Number" },
  { name: "crime_year", type: "text", placeholder: "e.g., 2026", label: "Crime Year" },
  { name: "case_type_id", type: "select", label: "Case Type", options: dummyCaseTypeOptionsForAdd, placeholder: "Select Case Type...", testID: "case_type_id" },
  { name: "court_id", type: "select", label: "Court", options: dummyCourtOptionsForAdd, placeholder: "Select Court...", testID: "court_id" },
  { name: "Undersection", type: "text", placeholder: "e.g., Section 302 IPC", label: "Under Section(s)", suggestions: true },
  { name: "police_station_id", type: "select", label: "Police Station", options: [], placeholder: "Select Police Station...", testID: "police_station_id" },
  { name: "FiledDate", type: "date", label: "Date Filed", placeholder: "Select date case was filed" },
  { name: "JudgeName", type: "text", placeholder: "Enter Judge's Name", label: "Presiding Judge", suggestions: true },
  { name: "OpposingCounsel", type: "text", placeholder: "Enter Opposing Counsel's Name", label: "Opposing Counsel", suggestions: true },
  { name: "Status", type: "select", label: "Case Status", options: caseStatusOptions, placeholder: "Select Status..." },
  { name: "Priority", type: "select", label: "Priority Level", options: priorityOptions, placeholder: "Select Priority..." },
  { name: "HearingDate", type: "date", label: "Next Hearing Date", placeholder: "Select next hearing date" },
  { name: "StatuteOfLimitations", type: "date", label: "Statute of Limitations", placeholder: "Select SOL date" },
  { name: "FirstParty", type: "text", placeholder: "Enter First Party Name", label: "First Party", suggestions: true },
  { name: "OppositeParty", type: "text", placeholder: "Enter Opposite Party Name", label: "Opposite Party", suggestions: true },
  { name: "Accussed", type: "text", placeholder: "Enter Accused Name(s)", label: "Accused", suggestions: true },
  { name: "CaseDescription", type: "multiline", placeholder: "Provide a brief summary...", label: "Case Description" },
  { name: "CaseNotes", type: "multiline", placeholder: "Add any private notes...", label: "Internal Notes" },
];

const fieldGroups = [
  {
    title: "Client & Core Details",
    icon: "person-outline",
    fields: ["CaseTitle", "ClientName", "ClientContactNumber", "CNRNumber", "case_number", "crime_number", "crime_year", "case_type_id", "court_id", "Undersection", "police_station_id"]
  },
  {
    title: "Parties & Court Details",
    icon: "scale-outline",
    fields: ["FirstParty", "OppositeParty", "JudgeName", "OpposingCounsel", "Accussed"]
  },
  {
    title: "Dates & Priorities",
    icon: "calendar-outline",
    fields: ["Status", "Priority", "FiledDate", "HearingDate", "StatuteOfLimitations"]
  },
  {
    title: "Description & Notes",
    icon: "document-text-outline",
    fields: ["CaseDescription", "CaseNotes"]
  }
];

const validationSchema = Yup.object().shape({
  CaseTitle: Yup.string().required("Case Title is required"),
});

const getFieldLabelKey = (fieldName: string): string => {
  switch (fieldName) {
    case "CaseTitle": return "field_case_title";
    case "ClientName": return "field_client_name";
    case "case_number": return "field_case_number";
    case "crime_number": return "field_crime_number";
    case "crime_year": return "field_crime_year";
    case "CNRNumber": return "field_cnr_number";
    case "case_type_id": return "field_case_type";
    case "court_id": return "field_court";
    case "police_station_id": return "field_police_station";
    case "FiledDate": return "field_filed_date";
    case "JudgeName": return "field_judge_name";
    case "OpposingCounsel": return "field_opposing_counsel";
    case "Status": return "field_status";
    case "Priority": return "field_priority";
    case "HearingDate": return "field_hearing_date";
    case "StatuteOfLimitations": return "field_statute_of_limitations";
    case "FirstParty": return "field_first_party";
    case "OppositeParty": return "field_opposite_party";
    case "ClientContactNumber": return "field_client_contact";
    case "Accussed": return "field_accused";
    case "Undersection": return "field_under_section";
    case "CaseDescription": return "field_case_description";
    case "CaseNotes": return "field_case_notes";
    default: return "";
  }
};

const getFieldPlaceholderKey = (fieldName: string): string => {
  switch (fieldName) {
    case "CaseTitle": return "placeholder_case_title";
    case "ClientName": return "placeholder_client_name";
    case "case_number": return "placeholder_case_number";
    case "crime_number": return "placeholder_crime_number";
    case "crime_year": return "placeholder_crime_year";
    case "CNRNumber": return "placeholder_cnr_number";
    case "case_type_id": return "placeholder_case_type";
    case "court_id": return "placeholder_court";
    case "police_station_id": return "placeholder_police_station";
    case "FiledDate": return "placeholder_filed_date";
    case "JudgeName": return "placeholder_judge_name";
    case "OpposingCounsel": return "placeholder_opposing_counsel";
    case "Status": return "placeholder_status";
    case "Priority": return "placeholder_priority";
    case "HearingDate": return "placeholder_hearing_date";
    case "StatuteOfLimitations": return "placeholder_statute_of_limitations";
    case "FirstParty": return "placeholder_first_party";
    case "OppositeParty": return "placeholder_opposite_party";
    case "ClientContactNumber": return "placeholder_client_contact";
    case "Accussed": return "placeholder_accused";
    case "Undersection": return "placeholder_under_section";
    case "CaseDescription": return "placeholder_case_description";
    case "CaseNotes": return "placeholder_case_notes";
    default: return "";
  }
};

const getOptionLabelKey = (label: string): string => {
  switch (label) {
    case "Open": return "option_status_open";
    case "In Progress": return "option_status_in_progress";
    case "Closed": return "option_status_closed";
    case "On Hold": return "option_status_on_hold";
    case "Appealed": return "option_status_appealed";
    case "High": return "option_priority_high";
    case "Medium": return "option_priority_medium";
    case "Low": return "option_priority_low";
    case "Civil Suit": return "practice_civil";
    case "Criminal Defense": return "practice_criminal";
    case "Family Law": return "practice_family";
    case "Corporate": return "practice_corporate";
    default: return "";
  }
};

const getTranslatedOptions = (options: AppDropdownOption[], t: any) => {
  return options.map(opt => {
    const key = getOptionLabelKey(opt.label.toString());
    return {
      ...opt,
      label: key ? t(key as any) : opt.label
    };
  });
};

const getGroupTitleKey = (title: string): string => {
  switch (title) {
    case "Client & Core Details": return "addcase_group_client_core";
    case "Parties & Court Details": return "addcase_group_parties_court";
    case "Dates & Priorities": return "addcase_group_dates_priorities";
    case "Description & Notes": return "addcase_group_desc_notes";
    default: return "";
  }
};

const FormFieldRenderer: React.FC<{
  fieldConfig: FieldDefinition;
  formik: FormikProps<Partial<CaseData>>;
  otherValues: { [key: string]: string };
  setOtherValue: (fieldName: string, value: string) => void;
  suggestions: { [key: string]: string[] };
  policeStationOptions?: AppDropdownOption[];
}> = ({ fieldConfig, formik, otherValues, setOtherValue, suggestions, policeStationOptions }) => {
  const { values, errors, touched, setFieldValue } = formik;
  const { t } = useTranslation();
  const fieldName = fieldConfig.name;

  const labelKey = getFieldLabelKey(fieldName);
  const placeholderKey = getFieldPlaceholderKey(fieldName);

  const translatedLabel = labelKey ? t(labelKey as any) : fieldConfig.label;
  const translatedPlaceholder = placeholderKey ? t(placeholderKey as any) : fieldConfig.placeholder;

  const commonInputProps = {
    label: translatedLabel,
    error: (touched[fieldName] && errors[fieldName]) ? errors[fieldName] : undefined,
  };

  switch (fieldConfig.type) {
    case "text":
      return <FormInput {...commonInputProps} value={values[fieldName] as string || ''} placeholder={translatedPlaceholder} onChangeText={(text) => setFieldValue(fieldName, text)} suggestions={fieldConfig.suggestions ? (suggestions[fieldName] || []) : undefined} />;
    case "multiline":
      return <FormInput {...commonInputProps} value={values[fieldName] as string || ''} placeholder={translatedPlaceholder} onChangeText={(text) => setFieldValue(fieldName, text)} multiline numberOfLines={4} />;
    case "select":
      const selectOpts = fieldConfig.name === "police_station_id" ? (policeStationOptions || []) : (fieldConfig.options || []);
      return <DropdownPicker {...commonInputProps} selectedValue={values[fieldName] as string | number | undefined} onValueChange={(itemValue) => setFieldValue(fieldName, itemValue)} options={getTranslatedOptions(selectOpts, t)} placeholder={translatedPlaceholder || `${t("alert_cancel")}...`} onOtherValueChange={(text) => setOtherValue(fieldName, text)} testID={fieldConfig.testID} />;
    case "date":
      return <DatePickerField {...commonInputProps} value={values[fieldName] ? new Date(values[fieldName] as string) : null} onChange={(date) => setFieldValue(fieldName, date ? date.toISOString() : null)} placeholder={translatedPlaceholder || "Select date"} />;
    default:
      console.warn("Unsupported field type:", fieldConfig.type);
      return null;
  }
};

const AddCase: React.FC<AddCaseProps> = ({ route }) => {
  const params = route.params;
  const { update = false, initialValues, uniqueId: routeUniqueId } = params ?? {};
  const { theme } = React.useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = getAddCaseStyles(theme);
  const { showAdWithPreload } = useAdTrigger();

  const navigation = useNavigation();
  const generatedUniqueId = useMemo(() => uuidv4(), []);
  const uniqueIdToUse = routeUniqueId || initialValues?.uniqueId || generatedUniqueId;

  const [otherValues, setOtherValues] = useState<{ [key: string]: string }>({});
  const setOtherValue = (fieldName: string, value: string) => {
    setOtherValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const [suggestions, setSuggestions] = useState<{ [key: string]: string[] }>({});
  const [policeStationOptions, setPoliceStationOptions] = useState<AppDropdownOption[]>([]);

  const [isLocked, setIsLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);

  useEffect(() => {
    const checkLockStatus = async () => {
      try {
        const isPremiumVal = await AsyncStorage.getItem("@user_is_premium");
        if (isPremiumVal === "true") {
          setIsLocked(false);
          setCheckingLock(false);
          return;
        }
        const currentCountVal = await AsyncStorage.getItem("@cases_edit_add_count");
        const currentCount = currentCountVal ? parseInt(currentCountVal, 10) : 0;
        if (currentCount >= 10) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      } catch (e) {
        console.error("Error checking lock status:", e);
      } finally {
        setCheckingLock(false);
      }
    };

    checkLockStatus();
    if (navigation && typeof navigation.addListener === "function") {
      const unsubscribe = navigation.addListener("focus", checkLockStatus);
      return unsubscribe;
    }
  }, [navigation]);

  const handleUnlock = async () => {
    try {
      await showAdWithPreload("rewarded", async (success) => {
        if (success) {
          await AsyncStorage.setItem("@cases_edit_add_count", "0");
          setIsLocked(false);
          Alert.alert(t("alert_success"), t("lock_success_msg"));
        } else {
          Alert.alert(t("alert_warning"), t("lock_warn_msg"));
        }
      });
    } catch (e) {
      console.error("Failed to show ad for unlock:", e);
      await AsyncStorage.setItem("@cases_edit_add_count", "0");
      setIsLocked(false);
    }
  };

  const incrementCaseActionCount = async () => {
    try {
      const isPremiumVal = await AsyncStorage.getItem("@user_is_premium");
      if (isPremiumVal === "true") {
        return;
      }
      const currentCountVal = await AsyncStorage.getItem("@cases_edit_add_count");
      const currentCount = currentCountVal ? parseInt(currentCountVal, 10) : 0;
      await AsyncStorage.setItem("@cases_edit_add_count", (currentCount + 1).toString());
      console.log("Incremented case edit/add count to:", currentCount + 1);
    } catch (e) {
      console.error("Error incrementing case action count:", e);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      const suggestionsData: { [key: string]: string[] } = {};
      for (const field of formFieldsDefinition) {
        if (field.suggestions) {
          const fieldSuggestions = await getSuggestionsForField(field.name);
          suggestionsData[field.name] = fieldSuggestions.map((s) => s.name);
        }
      }
      setSuggestions(suggestionsData);
    };

    const fetchPoliceStations = async () => {
      try {
        const psList = await getPoliceStations(null, null);
        const formatted = psList.map(ps => ({
          label: ps.name,
          value: ps.id
        }));
        formatted.push({ label: 'Other', value: 'Other' });
        setPoliceStationOptions(formatted);
      } catch (error) {
        console.error("Error fetching police stations:", error);
      }
    };

    fetchSuggestions();
    fetchPoliceStations();
  }, []);

  const prepareFormInitialValues = (): Partial<CaseData> => {
    const defaults: Partial<CaseData> = { uniqueId: uniqueIdToUse };
    formFieldsDefinition.forEach(field => {
      if (field.name !== 'uniqueId') {
        defaults[field.name] = field.type === "date" ? null : (field.type === "select" ? '' : '');
      }
    });

    if (update && initialValues) {
      const mappedInitialValues: Partial<CaseData> = { ...defaults };
      
      // Copy over other existing fields from initialValues
      Object.keys(initialValues).forEach(key => {
        const val = (initialValues as any)[key];
        if (val !== undefined && val !== null) {
          (mappedInitialValues as any)[key] = val;
        }
      });

      if (initialValues.uniqueId) mappedInitialValues.uniqueId = initialValues.uniqueId;
      if (initialValues.id) mappedInitialValues.id = initialValues.id;
      if (initialValues.caseNumber) mappedInitialValues.CaseTitle = initialValues.caseNumber;
      if (initialValues.dateFiled) mappedInitialValues.FiledDate = initialValues.dateFiled.toISOString();

      const initialCourt = dummyCourtOptionsForAdd.find(opt => opt.label === initialValues.court);
      if (initialCourt) mappedInitialValues.court_id = initialCourt.value;

      const initialCaseType = dummyCaseTypeOptionsForAdd.find(opt => opt.label === initialValues.caseType);
      if (initialCaseType) mappedInitialValues.case_type_id = initialCaseType.value;

      if (initialValues.crime_number) mappedInitialValues.crime_number = initialValues.crime_number;
      if (initialValues.crime_year) mappedInitialValues.crime_year = initialValues.crime_year.toString();
      if (initialValues.police_station_id) mappedInitialValues.police_station_id = initialValues.police_station_id;
      if (initialValues.Undersection) mappedInitialValues.Undersection = initialValues.Undersection;

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

    let policeStationId = formValues.police_station_id || null;
    if (policeStationId === 'Other') {
      const psName = otherValues['police_station_id'];
      if (psName) {
        const newPsId = await addPoliceStation(psName);
        policeStationId = newPsId;
      } else {
        policeStationId = null;
      }
    } else {
      policeStationId = policeStationId ? Number(policeStationId) : null;
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
        police_station_id: policeStationId,
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
          Alert.alert(t("alert_success"), t("editcase_success_updated"));
          await incrementCaseActionCount();
          navigation.navigate("CaseDetails", {
            caseId: caseIdToUpdate,
          });
        } else { Alert.alert(t("alert_error"), t("editcase_err_save_details")); }
      } catch (e) { console.error("Error updating case:", e); Alert.alert(t("alert_error"), t("editcase_err_general"));}
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
        police_station_id: policeStationId,
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
          Alert.alert(t("alert_success"), t("editcase_success_saved"));
          await incrementCaseActionCount();
          navigation.navigate("CaseDetails", {
            caseId: newCaseId,
          });
        } else {
          Alert.alert(t("alert_error"), t("editcase_err_save_details"));
        }
      } catch (e) {
        console.error("Error adding case:", e);
        Alert.alert(t("alert_error"), t("editcase_err_general"));
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.scrollContentContainerStyle}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formScreenContainer}>
          <Formik
            initialValues={prepareFormInitialValues()}
            validationSchema={validationSchema}
            onSubmit={handleSubmitForm}
            enableReinitialize
          >
            {(formikProps) => (
              <View>
                {fieldGroups.map((group, groupIdx) => (
                  <View key={groupIdx} style={[styles.groupCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, borderWidth: 1 }]}>
                     <View style={[styles.groupHeader, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                      <Ionicons name={group.icon as any} size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                      <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
                        {t(getGroupTitleKey(group.title) as any) || group.title}
                      </Text>
                    </View>
                    {formFieldsDefinition
                      .filter(f => group.fields.includes(f.name))
                      .map((fieldConfig) => (
                        <FormFieldRenderer
                          key={fieldConfig.name}
                          fieldConfig={fieldConfig}
                          formik={formikProps}
                          otherValues={otherValues}
                          setOtherValue={setOtherValue}
                          suggestions={suggestions}
                          policeStationOptions={policeStationOptions}
                        />
                      ))}
                  </View>
                ))}
                <View style={styles.actionButtonContainer}>
                  <ActionButton
                    title={update ? t("btn_save_changes") : t("btn_save_case")}
                    onPress={() => formikProps.handleSubmit()}
                    type="primary"
                  />
                  <ActionButton
                    title={t("alert_cancel")}
                    onPress={() => navigation.goBack()}
                    type="secondary"
                  />
                </View>
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>

      {isLocked && (
        <Modal visible={isLocked} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}12` }]}>
                <Ionicons name="lock-closed" size={32} color={theme.colors.primary} />
              </View>
              <Text style={[styles.lockTitle, { color: theme.colors.text }]}>
                {t("lock_title")}
              </Text>
              <Text style={[styles.lockDescription, { color: theme.colors.textSecondary }]}>
                {t("lock_description")}
              </Text>

              <ActionButton
                title={t("lock_btn_watch")}
                onPress={handleUnlock}
                type="primary"
                style={{ width: "100%", marginTop: 8, marginBottom: 12 }}
              />

              <ActionButton
                title={t("lock_btn_back")}
                onPress={() => navigation.goBack()}
                type="secondary"
                style={{ width: "100%", marginVertical: 0 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default AddCase;
