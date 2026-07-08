import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { Formik, FormikProps } from "formik";
import React, { useMemo, useState, useEffect, useRef } from "react";
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
import * as Animatable from "react-native-animatable";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";

import { getAddCaseStyles } from "./AddCaseStyle";
import { ECourtsImportModal } from "./components/ECourtsImportModal";
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
  getDistricts,
  addDistrict,
  getDb,
  getCourts,
  getCaseTypes,
  addCaseTimelineEvent,
} from "../../DataBase";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import {
  CaseDataScreen,
  CaseData,
  DropdownOption as AppDropdownOption,
  caseStatusOptions,
  priorityOptions,
} from "../../Types/appTypes";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { convertIndianDateToLocal } from "../../utils/ecourtsParser";
import { promptClientNotification } from "../../utils/whatsappNotifier";
import { useAdTrigger } from "../CommonComponents/AdManager";


import { getUserState } from "../../utils/locationService";
import {
  formatDate,
  getLocalDateString,
  parseLocalDate,
} from "../../utils/commonFunctions";
import { CaseDetails } from "../CaseDetailsScreen/CaseDetailsScreen";
import DatePickerField from "../CommonComponents/DatePickerField";
import DropdownPicker from "../CommonComponents/DropdownPicker";
import FormInput from "../CommonComponents/FormInput";
import ActionButton from "../CommonComponents/ActionButton";
import { useTranslation } from "../../Providers/LanguageProvider";

interface FieldDefinition {
  name: keyof CaseData;
  type: "text" | "select" | "date" | "multiline";
  placeholder?: string;
  label: string;
  options?: AppDropdownOption[];
  suggestions?: boolean;
  testID?: string;
  maxLength?: number;
  keyboardType?: string;
}

type AddCaseScreenRouteProp = RouteProp<HomeStackParamList, "AddCaseDetails">;

interface AddCaseProps {
  route: AddCaseScreenRouteProp;
}

const dummyCaseTypeOptionsForAdd: AppDropdownOption[] = [
  { label: "Civil Suit", value: 1 },
  { label: "Criminal Defense", value: 2 },
  { label: "Family Law", value: 3 },
  { label: "Corporate", value: 4 },
  { label: "Other", value: "Other" },
];
const dummyCourtOptionsForAdd: AppDropdownOption[] = [
  { label: "District Court - City Center", value: 1 },
  { label: "High Court - State Capital", value: 2 },
  { label: "Supreme Court", value: 3 },
  { label: "Other", value: "Other" },
];

const formFieldsDefinition: FieldDefinition[] = [
  {
    name: "CNRNumber",
    type: "text",
    placeholder: "Enter CNR Number",
    label: "CNR Number",
  },
  {
    name: "CaseTitle",
    type: "text",
    placeholder: "e.g., State vs. John Doe",
    label: "Case Title*",
    suggestions: true,
  },
  {
    name: "case_number",
    type: "text",
    placeholder: "e.g., CS/123/2023",
    label: "Case Number",
  },
  {
    name: "session_trial_number",
    type: "text",
    placeholder: "Enter Sessions Trial Number",
    label: "Sessions Trial Number",
  },
  {
    name: "crime_number",
    type: "text",
    placeholder: "e.g., 123",
    label: "Crime/FIR No.",
  },
  {
    name: "crime_year",
    type: "text",
    placeholder: new Date().getFullYear().toString(),
    label: "Year",
    maxLength: 4,
    keyboardType: "numeric",
  },
  {
    name: "Undersection",
    type: "text",
    placeholder: "e.g., Section 302 IPC",
    label: "Under Section(s)",
    suggestions: true,
  },
  {
    name: "ClientName",
    type: "text",
    placeholder: "Enter Client's Full Name",
    label: "Client Name",
    suggestions: true,
  },
  {
    name: "ClientContactNumber",
    type: "text",
    placeholder: "Enter Client's Contact Number",
    label: "Client Contact No.",
  },
  {
    name: "case_type_id",
    type: "select",
    label: "Case Type",
    options: dummyCaseTypeOptionsForAdd,
    placeholder: "Select Case Type...",
    testID: "case_type_id",
  },
  {
    name: "court_id",
    type: "select",
    label: "Court",
    options: dummyCourtOptionsForAdd,
    placeholder: "Select Court...",
    testID: "court_id",
  },
  {
    name: "district_id",
    type: "select",
    label: "District",
    options: [],
    placeholder: "Select District...",
    testID: "district_id",
  },
  {
    name: "police_station_id",
    type: "select",
    label: "Police Station",
    options: [],
    placeholder: "Select Police Station...",
    testID: "police_station_id",
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
    placeholder: "Enter Judge's Name",
    label: "Presiding Judge",
    suggestions: true,
  },
  {
    name: "OpposingCounsel",
    type: "text",
    placeholder: "Enter Opposing Counsel's Name",
    label: "Opposing Counsel",
    suggestions: true,
  },
  {
    name: "Status",
    type: "select",
    label: "Case Status",
    options: caseStatusOptions,
    placeholder: "Select Status...",
  },
  {
    name: "Priority",
    type: "select",
    label: "Priority Level",
    options: priorityOptions,
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
    placeholder: "Select SOL date",
  },
  {
    name: "FirstParty",
    type: "text",
    placeholder: "Enter First Party Name",
    label: "First Party",
    suggestions: true,
  },
  {
    name: "OppositeParty",
    type: "text",
    placeholder: "Enter Opposite Party Name",
    label: "Opposite Party",
    suggestions: true,
  },
  {
    name: "Accussed",
    type: "text",
    placeholder: "Enter Accused Name(s)",
    label: "Accused",
    suggestions: true,
  },
  {
    name: "CaseDescription",
    type: "multiline",
    placeholder: "Provide a brief summary...",
    label: "Case Description",
  },
  {
    name: "CaseNotes",
    type: "multiline",
    placeholder: "Add any private notes...",
    label: "Internal Notes",
  },
];

const fieldGroups = [
  {
    title: "Client & Core Details",
    icon: "person-outline",
    fields: [
      "CNRNumber",
      "CaseTitle",
      "case_number",
      "session_trial_number",
      "crime_number",
      "crime_year",
      "Undersection",
      "ClientName",
      "ClientContactNumber",
      "case_type_id",
      "court_id",
      "district_id",
      "police_station_id",
    ],
  },
  {
    title: "Parties & Court Details",
    icon: "scale-outline",
    fields: [
      "FirstParty",
      "OppositeParty",
      "JudgeName",
      "OpposingCounsel",
      "Accussed",
    ],
  },
  {
    title: "Dates & Priorities",
    icon: "calendar-outline",
    fields: [
      "Status",
      "Priority",
      "FiledDate",
      "HearingDate",
      "StatuteOfLimitations",
    ],
  },
  {
    title: "Description & Notes",
    icon: "document-text-outline",
    fields: ["CaseDescription", "CaseNotes"],
  },
];

const validationSchema = Yup.object().shape({
  CaseTitle: Yup.string().required("Case Title is required"),
});

const getFieldLabelKey = (fieldName: string): string => {
  switch (fieldName) {
    case "CaseTitle":
      return "field_case_title";
    case "ClientName":
      return "field_client_name";
    case "case_number":
      return "field_case_number";
    case "session_trial_number":
      return "field_session_trial_number";
    case "crime_number":
      return "field_crime_number";
    case "crime_year":
      return "field_crime_year";
    case "CNRNumber":
      return "field_cnr_number";
    case "case_type_id":
      return "field_case_type";
    case "court_id":
      return "field_court";
    case "police_station_id":
      return "field_police_station";
    case "FiledDate":
      return "field_filed_date";
    case "JudgeName":
      return "field_judge_name";
    case "OpposingCounsel":
      return "field_opposing_counsel";
    case "Status":
      return "field_status";
    case "Priority":
      return "field_priority";
    case "HearingDate":
      return "field_hearing_date";
    case "StatuteOfLimitations":
      return "field_statute_of_limitations";
    case "FirstParty":
      return "field_first_party";
    case "OppositeParty":
      return "field_opposite_party";
    case "ClientContactNumber":
      return "field_client_contact";
    case "Accussed":
      return "field_accused";
    case "Undersection":
      return "field_under_section";
    case "district_id":
      return "field_district";
    case "CaseDescription":
      return "field_case_description";
    case "CaseNotes":
      return "field_case_notes";
    default:
      return "";
  }
};

const getFieldPlaceholderKey = (fieldName: string): string => {
  switch (fieldName) {
    case "CaseTitle":
      return "placeholder_case_title";
    case "ClientName":
      return "placeholder_client_name";
    case "case_number":
      return "placeholder_case_number";
    case "session_trial_number":
      return "placeholder_session_trial_number";
    case "crime_number":
      return "placeholder_crime_number";
    case "CNRNumber":
      return "placeholder_cnr_number";
    case "case_type_id":
      return "placeholder_case_type";
    case "court_id":
      return "placeholder_court";
    case "police_station_id":
      return "placeholder_police_station";
    case "FiledDate":
      return "placeholder_filed_date";
    case "JudgeName":
      return "placeholder_judge_name";
    case "OpposingCounsel":
      return "placeholder_opposing_counsel";
    case "Status":
      return "placeholder_status";
    case "Priority":
      return "placeholder_priority";
    case "HearingDate":
      return "placeholder_hearing_date";
    case "StatuteOfLimitations":
      return "placeholder_statute_of_limitations";
    case "FirstParty":
      return "placeholder_first_party";
    case "OppositeParty":
      return "placeholder_opposite_party";
    case "ClientContactNumber":
      return "placeholder_client_contact";
    case "Accussed":
      return "placeholder_accused";
    case "Undersection":
      return "placeholder_under_section";
    case "district_id":
      return "placeholder_district";
    case "CaseDescription":
      return "placeholder_case_description";
    case "CaseNotes":
      return "placeholder_case_notes";
    default:
      return "";
  }
};

const getOptionLabelKey = (label: string): string => {
  switch (label) {
    case "Open":
      return "option_status_open";
    case "In Progress":
      return "option_status_in_progress";
    case "Closed":
      return "option_status_closed";
    case "On Hold":
      return "option_status_on_hold";
    case "Appealed":
      return "option_status_appealed";
    case "High":
      return "option_priority_high";
    case "Medium":
      return "option_priority_medium";
    case "Low":
      return "option_priority_low";
    case "Civil Suit":
      return "practice_civil";
    case "Criminal Defense":
      return "practice_criminal";
    case "Family Law":
      return "practice_family";
    case "Corporate":
      return "practice_corporate";
    default:
      return "";
  }
};

const getTranslatedOptions = (options: AppDropdownOption[], t: any) => {
  return options.map((opt) => {
    const key = getOptionLabelKey(opt.label.toString());
    return {
      ...opt,
      label: key ? t(key as any) : opt.label,
    };
  });
};

const getGroupTitleKey = (title: string): string => {
  switch (title) {
    case "Client & Core Details":
      return "addcase_group_client_core";
    case "Parties & Court Details":
      return "addcase_group_parties_court";
    case "Dates & Priorities":
      return "addcase_group_dates_priorities";
    case "Description & Notes":
      return "addcase_group_desc_notes";
    default:
      return "";
  }
};

const FormFieldRenderer: React.FC<{
  fieldConfig: FieldDefinition;
  formik: FormikProps<Partial<CaseData>>;
  otherValues: { [key: string]: string };
  setOtherValue: (fieldName: string, value: string) => void;
  suggestions: { [key: string]: string[] };
  policeStationOptions?: AppDropdownOption[];
  districtOptions?: AppDropdownOption[];
  onDistrictChange?: (districtId: any) => void;
  courtOptions?: AppDropdownOption[];
  caseTypeOptions?: AppDropdownOption[];
}> = ({
  fieldConfig,
  formik,
  otherValues,
  setOtherValue,
  suggestions,
  policeStationOptions,
  districtOptions,
  onDistrictChange,
  courtOptions,
  caseTypeOptions,
}) => {
  const { values, errors, touched, setFieldValue } = formik;
  const { t } = useTranslation();
  const fieldName = fieldConfig.name;

  const labelKey = getFieldLabelKey(fieldName);
  const placeholderKey = getFieldPlaceholderKey(fieldName);

  const translatedLabel = labelKey ? t(labelKey as any) : fieldConfig.label;
  const translatedPlaceholder = placeholderKey
    ? t(placeholderKey as any)
    : fieldConfig.placeholder;

  const commonInputProps = {
    label: translatedLabel,
    error:
      touched[fieldName] && errors[fieldName] ? errors[fieldName] : undefined,
  };

  switch (fieldConfig.type) {
    case "text":
      return (
        <FormInput
          {...commonInputProps}
          value={values[fieldName] || ""}
          placeholder={translatedPlaceholder}
          onChangeText={(text) => {
            if (fieldName === "crime_year") {
              const sanitized = text.replace(/[^0-9]/g, "");
              setFieldValue(fieldName, sanitized);
            } else {
              setFieldValue(fieldName, text);
            }
          }}
          suggestions={
            fieldConfig.suggestions ? suggestions[fieldName] || [] : undefined
          }
          maxLength={fieldConfig.maxLength}
          keyboardType={fieldConfig.keyboardType as any}
        />
      );
    case "multiline":
      return (
        <FormInput
          {...commonInputProps}
          value={(values[fieldName] as string) || ""}
          placeholder={translatedPlaceholder}
          onChangeText={(text) => setFieldValue(fieldName, text)}
          multiline
          numberOfLines={4}
        />
      );
    case "select":
      let selectOpts = [];
      if (fieldConfig.name === "police_station_id") {
        selectOpts = policeStationOptions || [];
      } else if (fieldConfig.name === "district_id") {
        selectOpts = districtOptions || [];
      } else if (fieldConfig.name === "court_id") {
        selectOpts = courtOptions || [];
      } else if (fieldConfig.name === "case_type_id") {
        selectOpts = caseTypeOptions || [];
      } else {
        selectOpts = fieldConfig.options || [];
      }
      return (
        <DropdownPicker
          {...commonInputProps}
          selectedValue={values[fieldName] as string | number | undefined}
          onValueChange={(itemValue) => {
            setFieldValue(fieldName, itemValue);
            if (fieldConfig.name === "district_id") {
              setFieldValue("police_station_id", "");
              if (onDistrictChange) {
                onDistrictChange(itemValue);
              }
            }
          }}
          options={getTranslatedOptions(selectOpts, t)}
          placeholder={translatedPlaceholder || `${t("alert_cancel")}...`}
          onOtherValueChange={(text) => setOtherValue(fieldName, text)}
          otherValue={otherValues[fieldName]}
          testID={fieldConfig.testID}
        />
      );
    case "date":
      return (
        <DatePickerField
          {...commonInputProps}
          value={
            values[fieldName]
              ? parseLocalDate(values[fieldName] as string)
              : null
          }
          onChange={(date) =>
            setFieldValue(fieldName, date ? getLocalDateString(date) : null)
          }
          placeholder={translatedPlaceholder || "Select date"}
        />
      );
    default:
      console.warn("Unsupported field type:", fieldConfig.type);
      return null;
  }
};

const deduplicateOptions = (
  options: AppDropdownOption[]
): AppDropdownOption[] => {
  const seen = new Set<string>();
  return options.filter((opt) => {
    const key = opt.label.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const AddCase: React.FC<AddCaseProps> = ({ route }) => {
  const params = route.params;
  const {
    update = false,
    initialValues,
    uniqueId: routeUniqueId,
  } = params ?? {};
  const { theme } = React.useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = getAddCaseStyles(theme);
  const { showAdWithPreload } = useAdTrigger();

  const navigation = useNavigation();
  const generatedUniqueId = useMemo(() => uuidv4(), []);
  const uniqueIdToUse =
    routeUniqueId || initialValues?.uniqueId || generatedUniqueId;

  const scrollViewRef = useRef<ScrollView>(null);
  const cardLayouts = useRef<{ [key: number]: number }>({});
  const fieldLayouts = useRef<{ [key: string]: number }>({});

  const FormikErrorScroller = ({
    errors,
    submitCount,
  }: {
    errors: any;
    submitCount: number;
  }) => {
    useEffect(() => {
      if (submitCount > 0) {
        const errorFields = Object.keys(errors);
        if (errorFields.length > 0) {
          const firstErrorField = errorFields[0];
          const groupIdx = fieldGroups.findIndex((g) =>
            g.fields.includes(firstErrorField)
          );

          const cardY = cardLayouts.current[groupIdx] || 0;
          const fieldY = fieldLayouts.current[firstErrorField] || 0;
          const targetY = cardY + fieldY;

          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: Math.max(0, targetY - 20),
              animated: true,
            });
          }
        }
      }
    }, [submitCount]);

    return null;
  };

  const [otherValues, setOtherValues] = useState<{ [key: string]: string }>({});
  const [isECourtsModalVisible, setIsECourtsModalVisible] = useState(false);

  const normalizeForFuzzyMatch = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/court/g, "")
      .replace(/judge/g, "")
      .replace(/establishment/g, "")
      .replace(/office/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  };

  const fuzzyMatchOption = (
    scrapedText: string,
    options: AppDropdownOption[]
  ): AppDropdownOption | undefined => {
    if (!scrapedText) return undefined;
    const cleanScraped = normalizeForFuzzyMatch(scrapedText);
    if (!cleanScraped) return undefined;

    let match = options.find((opt) => {
      const cleanOpt = normalizeForFuzzyMatch(opt.label);
      return cleanOpt === cleanScraped;
    });
    if (match) return match;

    match = options.find((opt) => {
      const cleanOpt = normalizeForFuzzyMatch(opt.label);
      return cleanOpt.includes(cleanScraped) || cleanScraped.includes(cleanOpt);
    });
    return match;
  };

  const handleImportSuccess = (extractedData: any, setFieldValue: any) => {
    if (extractedData.CaseTitle)
      setFieldValue("CaseTitle", extractedData.CaseTitle);
    if (extractedData.CNRNumber)
      setFieldValue("CNRNumber", extractedData.CNRNumber);
    if (extractedData.case_number)
      setFieldValue("case_number", extractedData.case_number);
    if (extractedData.FirstParty)
      setFieldValue("FirstParty", extractedData.FirstParty);
    if (extractedData.OppositeParty)
      setFieldValue("OppositeParty", extractedData.OppositeParty);
    if (extractedData.NextDate)
      setFieldValue("HearingDate", extractedData.NextDate);

    // Additional eCourts fields
    if (extractedData.dateFiled)
      setFieldValue("FiledDate", extractedData.dateFiled);
    if (extractedData.JudgeName)
      setFieldValue("JudgeName", extractedData.JudgeName);
    if (extractedData.Undersection)
      setFieldValue("Undersection", extractedData.Undersection);
    if (extractedData.OpposingCounsel)
      setFieldValue("OpposingCounsel", extractedData.OpposingCounsel);
    if (extractedData.crime_number)
      setFieldValue("crime_number", extractedData.crime_number);
    if (extractedData.crime_year)
      setFieldValue("crime_year", extractedData.crime_year);
    if (extractedData.session_trial_number)
      setFieldValue("session_trial_number", extractedData.session_trial_number);

    // Map status logically based on eCourts CaseStatus
    if (extractedData.CaseStatus) {
      const lowerStatus = extractedData.CaseStatus.toLowerCase();
      if (
        lowerStatus.includes("disposed") ||
        lowerStatus.includes("decided") ||
        lowerStatus.includes("closed") ||
        lowerStatus.includes("dismissed")
      ) {
        setFieldValue("Status", "Closed");
      } else {
        setFieldValue("Status", "In Progress");
      }
    } else if (extractedData.NextDate) {
      setFieldValue("Status", "In Progress");
    }

    // Fuzzy matching for Court Option
    if (extractedData.court_name) {
      const match = fuzzyMatchOption(extractedData.court_name, courtOptions);
      if (match) {
        setFieldValue("court_id", match.value);
      } else {
        setFieldValue("court_id", "Other");
        setOtherValue("court_id", extractedData.court_name);
      }
    }

    // Fuzzy matching for Case Type Option
    if (extractedData.case_type_name) {
      const match = fuzzyMatchOption(
        extractedData.case_type_name,
        caseTypeOptions
      );
      if (match) {
        setFieldValue("case_type_id", match.value);
      } else {
        setFieldValue("case_type_id", "Other");
        setOtherValue("case_type_id", extractedData.case_type_name);
      }
    }

    // Fuzzy matching for Police Station Option
    if (extractedData.police_station) {
      const match = fuzzyMatchOption(
        extractedData.police_station,
        policeStationOptions
      );
      if (match) {
        setFieldValue("police_station_id", match.value);
      } else {
        setFieldValue("police_station_id", "Other");
        setOtherValue("police_station_id", extractedData.police_station);
      }
    }

    // Populate raw scraped data into Case Notes to avoid losing any other fields
    if (extractedData.rawTables && extractedData.rawTables.length > 0) {
      const formattedLines = extractedData.rawTables
        .map((item: any) => `${item.label}: ${item.value}`)
        .join("\n");
      const importNotes = `--- Imported from eCourts ---\n${formattedLines}`;
      setFieldValue("CaseNotes", importNotes);
    }
  };
  const setOtherValue = (fieldName: string, value: string) => {
    setOtherValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const [suggestions, setSuggestions] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [policeStationOptions, setPoliceStationOptions] = useState<
    AppDropdownOption[]
  >([]);
  const [districtOptions, setDistrictOptions] = useState<AppDropdownOption[]>(
    []
  );
  const [resolvedDistrictId, setResolvedDistrictId] = useState<
    number | string | null
  >("");
  const [courtOptions, setCourtOptions] = useState<AppDropdownOption[]>([]);
  const [caseTypeOptions, setCaseTypeOptions] = useState<AppDropdownOption[]>(
    []
  );
  const [userId, setUserId] = useState<number | null>(null);

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
        const currentCountVal = await AsyncStorage.getItem(
          "@cases_edit_add_count"
        );
        const currentCount = currentCountVal
          ? parseInt(currentCountVal, 10)
          : 0;
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
      const currentCountVal = await AsyncStorage.getItem(
        "@cases_edit_add_count"
      );
      const currentCount = currentCountVal ? parseInt(currentCountVal, 10) : 0;
      await AsyncStorage.setItem(
        "@cases_edit_add_count",
        (currentCount + 1).toString()
      );
      console.log("Incremented case edit/add count to:", currentCount + 1);
    } catch (e) {
      console.error("Error incrementing case action count:", e);
    }
  };

  const handleDistrictChange = async (
    districtId: any,
    activeUserId?: number | null
  ) => {
    try {
      if (!districtId) {
        setPoliceStationOptions([{ label: "Other", value: "Other" }]);
        return;
      }
      const uId = activeUserId !== undefined ? activeUserId : userId;
      let psList = [];
      if (districtId === "Other") {
        psList = await getPoliceStations(null, uId);
      } else {
        psList = await getPoliceStations(Number(districtId), uId);
      }
      const formatted = psList.map((ps) => ({
        label: ps.name,
        value: ps.id,
      }));
      formatted.push({ label: "Other", value: "Other" });
      setPoliceStationOptions(deduplicateOptions(formatted));
    } catch (error) {
      console.error("Error fetching filtered police stations:", error);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      const userIdVal = await AsyncStorage.getItem("@user_id");
      const userId = userIdVal ? parseInt(userIdVal, 10) : null;
      const suggestionsData: { [key: string]: string[] } = {};
      for (const field of formFieldsDefinition) {
        if (field.suggestions) {
          const fieldSuggestions = await getSuggestionsForField(
            field.name,
            userId
          );
          suggestionsData[field.name] = fieldSuggestions.map((s) => s.name);
        }
      }
      setSuggestions(suggestionsData);
    };

    const initData = async () => {
      const userIdVal = await AsyncStorage.getItem("@user_id");
      const activeUserId = userIdVal ? parseInt(userIdVal, 10) : null;
      setUserId(activeUserId);

      try {
        const caseTypesList = await getCaseTypes(activeUserId);
        const formattedCaseTypes = caseTypesList.map((ct) => ({
          label: ct.name,
          value: ct.id,
        }));
        formattedCaseTypes.push({ label: "Other", value: "Other" });
        setCaseTypeOptions(deduplicateOptions(formattedCaseTypes));
      } catch (error) {
        console.error("Error fetching case types:", error);
      }

      try {
        const courtsList = await getCourts(activeUserId);
        const formattedCourts = courtsList.map((c) => ({
          label: c.name,
          value: c.id,
        }));
        formattedCourts.push({ label: "Other", value: "Other" });
        setCourtOptions(deduplicateOptions(formattedCourts));
      } catch (error) {
        console.error("Error fetching courts:", error);
      }

      try {
        const userState = await getUserState();
        console.log("Detected user state for AddCase:", userState);
        let districtsList = [];
        if (userState) {
          districtsList = await getDistricts(activeUserId, userState);
        }
        if (districtsList.length === 0) {
          districtsList = await getDistricts(activeUserId);
        }
        const formatted = districtsList.map((d) => ({
          label: d.name,
          value: d.id,
        }));
        formatted.push({ label: "Other", value: "Other" });
        setDistrictOptions(deduplicateOptions(formatted));
      } catch (error) {
        console.error("Error fetching districts:", error);
      }

      await fetchSuggestions();

      if (update && initialValues?.police_station_id) {
        try {
          const dbInstance = await getDb();
          const psRow = await dbInstance.getFirstAsync<{
            district_id: number | null;
          }>("SELECT district_id FROM PoliceStations WHERE id = ?", [
            initialValues.police_station_id,
          ]);
          if (psRow && psRow.district_id) {
            setResolvedDistrictId(psRow.district_id);
            await handleDistrictChange(psRow.district_id, activeUserId);
          } else {
            await handleDistrictChange(null, activeUserId);
          }
        } catch (e) {
          console.error("Error resolving initial district:", e);
          await handleDistrictChange(null, activeUserId);
        }
      } else {
        await handleDistrictChange(null, activeUserId);
      }
    };

    initData();
  }, [update, initialValues]);

  const prepareFormInitialValues = (): Partial<CaseData> => {
    const defaults: Partial<CaseData> = { uniqueId: uniqueIdToUse };
    formFieldsDefinition.forEach((field) => {
      if (field.name !== "uniqueId") {
        defaults[field.name] =
          field.type === "date" ? null : field.type === "select" ? "" : "";
      }
    });
    defaults.district_id = resolvedDistrictId || "";

    if (update && initialValues) {
      const mappedInitialValues: Partial<CaseData> = { ...defaults };

      // Copy over other existing fields from initialValues
      Object.keys(initialValues).forEach((key) => {
        const val = (initialValues as any)[key];
        if (val !== undefined && val !== null) {
          (mappedInitialValues as any)[key] = val;
        }
      });

      if (initialValues.uniqueId)
        mappedInitialValues.uniqueId = initialValues.uniqueId;
      if (initialValues.id) mappedInitialValues.id = initialValues.id;
      if (initialValues.caseNumber)
        mappedInitialValues.CaseTitle = initialValues.caseNumber;
      if (initialValues.dateFiled) {
        mappedInitialValues.FiledDate =
          initialValues.dateFiled instanceof Date
            ? getLocalDateString(initialValues.dateFiled)
            : getLocalDateString(new Date(initialValues.dateFiled));
      }

      const initialCourt = courtOptions.find(
        (opt) => opt.label === initialValues.court
      );
      if (initialCourt) mappedInitialValues.court_id = initialCourt.value;

      const initialCaseType = caseTypeOptions.find(
        (opt) => opt.label === initialValues.caseType
      );
      if (initialCaseType)
        mappedInitialValues.case_type_id = initialCaseType.value;

      mappedInitialValues.crime_number = initialValues.crime_number || "";
      mappedInitialValues.crime_year =
        initialValues.crime_year !== undefined &&
        initialValues.crime_year !== null
          ? initialValues.crime_year.toString()
          : "";
      if (initialValues.police_station_id)
        mappedInitialValues.police_station_id = initialValues.police_station_id;
      if (initialValues.Undersection)
        mappedInitialValues.Undersection = initialValues.Undersection;

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

    const userIdVal = await AsyncStorage.getItem("@user_id");
    const userId = userIdVal ? parseInt(userIdVal, 10) : null;

    const crimeNo =
      formValues.crime_number && formValues.crime_number.trim()
        ? formValues.crime_number.trim()
        : null;
    const crimeYr =
      formValues.crime_year && formValues.crime_year.toString().trim()
        ? parseInt(formValues.crime_year.toString().trim(), 10)
        : null;

    let courtNameString = null;
    if (formValues.court_id === "Other") {
      courtNameString = otherValues["court_id"];
      if (courtNameString) {
        const newCourtId = await addCourt(courtNameString, userId);
        formValues.court_id = newCourtId;
      }
    } else {
      const selectedCourtOption = courtOptions.find(
        (opt) => opt.value === formValues.court_id
      );
      courtNameString =
        selectedCourtOption && selectedCourtOption.value !== ""
          ? selectedCourtOption.label
          : null;
    }

    let caseTypeNameString = null;
    if (formValues.case_type_id === "Other") {
      caseTypeNameString = otherValues["case_type_id"];
      if (caseTypeNameString) {
        const newCaseTypeId = await addCaseType(caseTypeNameString, userId);
        formValues.case_type_id = newCaseTypeId;
      }
    } else {
      const selectedCaseTypeOption = caseTypeOptions.find(
        (opt) => opt.value === formValues.case_type_id
      );
      caseTypeNameString =
        selectedCaseTypeOption && selectedCaseTypeOption.value !== ""
          ? selectedCaseTypeOption.label
          : null;
    }

    let districtId = formValues.district_id || null;
    if (districtId === "Other") {
      const districtName = otherValues["district_id"];
      if (districtName) {
        const newDistrictId = await addDistrict(districtName, null, userId);
        districtId = newDistrictId;
      } else {
        districtId = null;
      }
    } else {
      districtId = districtId ? Number(districtId) : null;
    }

    let policeStationId = formValues.police_station_id || null;
    if (policeStationId === "Other") {
      const psName = otherValues["police_station_id"];
      if (psName) {
        const newPsId = await addPoliceStation(psName, districtId, userId);
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
      const changedFields = getChangedValues(
        initialFormStateForCompare,
        formValues
      );

      if (Object.keys(changedFields).length === 0) {
        console.log("No changes detected to update.");
        navigation.goBack();
        return;
      }

      const updatePayload: CaseUpdateData = {
        ...(changedFields.CaseTitle && { CaseTitle: changedFields.CaseTitle }),
        ...(changedFields.ClientName && {
          ClientName: changedFields.ClientName,
        }),
        ...(changedFields.CNRNumber && { CNRNumber: changedFields.CNRNumber }),
        court_id: formValues.court_id || null,
        court_name: courtNameString,
        dateFiled: changedFields.FiledDate,
        case_type_id: formValues.case_type_id || null,
        case_type_name: caseTypeNameString,
        ...(changedFields.case_number && {
          case_number: changedFields.case_number,
        }),
        ...(changedFields.case_year && {
          case_year: changedFields.case_year
            ? parseInt(changedFields.case_year as string, 10)
            : null,
        }),
        ...(changedFields.session_trial_number && {
          session_trial_number: changedFields.session_trial_number,
        }),
        crime_number: crimeNo,
        crime_year: crimeYr,
        ...(changedFields.JudgeName && { JudgeName: changedFields.JudgeName }),
        ...(changedFields.OnBehalfOf && {
          OnBehalfOf: changedFields.OnBehalfOf,
        }),
        ...(changedFields.FirstParty && {
          FirstParty: changedFields.FirstParty,
        }),
        ...(changedFields.OppositeParty && {
          OppositeParty: changedFields.OppositeParty,
        }),
        ...(changedFields.ClientContactNumber && {
          ClientContactNumber: changedFields.ClientContactNumber,
        }),
        ...(changedFields.Accussed && { Accussed: changedFields.Accussed }),
        ...(changedFields.Undersection && {
          Undersection: changedFields.Undersection,
        }),
        police_station_id: policeStationId,
        ...(changedFields.StatuteOfLimitations && {
          StatuteOfLimitations: changedFields.StatuteOfLimitations,
        }),
        ...(changedFields.OpposingCounsel && {
          OpposingCounsel: changedFields.OpposingCounsel,
        }),
        ...(changedFields.OppositeAdvocate && {
          OppositeAdvocate: changedFields.OppositeAdvocate,
        }),
        ...(changedFields.OppAdvocateContactNumber && {
          OppAdvocateContactNumber: changedFields.OppAdvocateContactNumber,
        }),
        ...(changedFields.Status && { CaseStatus: changedFields.Status }),
        ...(changedFields.Priority && { Priority: changedFields.Priority }),
        ...(changedFields.PreviousDate && {
          PreviousDate: changedFields.PreviousDate,
        }),
        ...(changedFields.HearingDate && {
          NextDate: changedFields.HearingDate,
        }),
        ...(changedFields.CaseDescription && {
          CaseDescription: changedFields.CaseDescription,
        }),
        ...(changedFields.CaseNotes && { CaseNotes: changedFields.CaseNotes }),
      };
      Object.keys(updatePayload).forEach((key) => {
        const K = key as keyof CaseUpdateData;
        if (updatePayload[K] === undefined) {
          delete updatePayload[K];
        }
      });

      console.log(
        "Attempting to update with payload:",
        JSON.stringify(updatePayload, null, 2)
      );
      try {
        const success = await updateCase(caseIdToUpdate, updatePayload);
        if (success) {
          Alert.alert(t("alert_success"), t("editcase_success_updated"));
          await incrementCaseActionCount();
          navigation.navigate("CaseDetails", {
            caseId: caseIdToUpdate,
          });
          if (updatePayload.NextDate) {
            setTimeout(() => {
              promptClientNotification(
                caseIdToUpdate,
                updatePayload.NextDate,
                "Hearing updated."
              );
            }, 600);
          }
        } else {
          Alert.alert(t("alert_error"), t("editcase_err_save_details"));
        }
      } catch (e) {
        console.error("Error updating case:", e);
        Alert.alert(t("alert_error"), t("editcase_err_general"));
      }
    } else {
      const userIdVal = await AsyncStorage.getItem("@user_id");
      const userId = userIdVal ? parseInt(userIdVal, 10) : null;
      const insertPayload: CaseInsertData = {
        uniqueId: formValues.uniqueId || uniqueIdToUse,
        user_id: userId,
        CaseTitle: formValues.CaseTitle || (formValues.FirstParty && formValues.OppositeParty ? `${formValues.FirstParty} vs. ${formValues.OppositeParty}` : null),
        ClientName: formValues.ClientName || null,
        CNRNumber: formValues.CNRNumber || null,
        court_id: formValues.court_id || null,
        court_name: courtNameString,
        dateFiled: formValues.FiledDate || null,
        case_type_id: formValues.case_type_id || null,
        case_type_name: caseTypeNameString,
        case_number: formValues.case_number || null,
        case_year: formValues.case_year
          ? parseInt(formValues.case_year as string, 10)
          : null,
        session_trial_number: formValues.session_trial_number || null,
        crime_number: crimeNo,
        crime_year: crimeYr,
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

      console.log(
        "Attempting to insert with payload:",
        JSON.stringify(insertPayload, null, 2)
      );
      try {
        const newCaseId = await addCase(insertPayload);
        if (newCaseId) {
          Alert.alert(t("alert_success"), t("editcase_success_saved"));
          await incrementCaseActionCount();
          (navigation as any).replace("CaseDetails", {
            caseId: newCaseId,
          });
          if (insertPayload.NextDate) {
            setTimeout(() => {
              promptClientNotification(
                newCaseId,
                insertPayload.NextDate,
                "New case registered."
              );
            }, 600);
          }
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
        ref={scrollViewRef}
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
                <FormikErrorScroller
                  errors={formikProps.errors}
                  submitCount={formikProps.submitCount}
                />
                {!update && (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${theme.colors.primary}0D`,
                      borderColor: theme.colors.primary,
                      borderWidth: 1.5,
                      borderStyle: "dashed",
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      marginBottom: 16,
                    }}
                    onPress={() => setIsECourtsModalVisible(true)}
                  >
                    <Ionicons
                      name="cloud-download-outline"
                      size={22}
                      color={theme.colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: theme.colors.primary,
                        fontSize: 15,
                        fontWeight: "bold",
                      }}
                    >
                      {t("btn_import_ecourts") || "Import Details from eCourts"}
                    </Text>
                  </TouchableOpacity>
                )}
                {fieldGroups.map((group, groupIdx) => (
                  <Animatable.View
                    key={groupIdx}
                    animation="fadeInUp"
                    delay={groupIdx * 100}
                    duration={500}
                    useNativeDriver
                    style={[
                      styles.groupCard,
                      {
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                      },
                    ]}
                    onLayout={(event) => {
                      cardLayouts.current[groupIdx] =
                        event.nativeEvent.layout.y;
                    }}
                  >
                    <View
                      style={[
                        styles.groupHeader,
                        {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={group.icon as any}
                        size={20}
                        color={theme.colors.primary}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.groupTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        {t(getGroupTitleKey(group.title) as any) || group.title}
                      </Text>
                    </View>
                    {formFieldsDefinition
                      .filter(
                        (f) =>
                          group.fields.includes(f.name) &&
                          f.name !== "crime_year"
                      )
                      .map((fieldConfig) => {
                        if (fieldConfig.name === "crime_number") {
                          const crimeYearConfig = formFieldsDefinition.find(
                            (f) => f.name === "crime_year"
                          )!;
                          return (
                            <View
                              key="crime_row"
                              style={{ flexDirection: "row", gap: 12 }}
                              onLayout={(event) => {
                                fieldLayouts.current[fieldConfig.name] =
                                  event.nativeEvent.layout.y;
                                fieldLayouts.current[crimeYearConfig.name] =
                                  event.nativeEvent.layout.y;
                              }}
                            >
                              <View style={{ flex: 2 }}>
                                <FormFieldRenderer
                                  fieldConfig={fieldConfig}
                                  formik={formikProps}
                                  otherValues={otherValues}
                                  setOtherValue={setOtherValue}
                                  suggestions={suggestions}
                                  policeStationOptions={policeStationOptions}
                                  districtOptions={districtOptions}
                                  onDistrictChange={handleDistrictChange}
                                  courtOptions={courtOptions}
                                  caseTypeOptions={caseTypeOptions}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <FormFieldRenderer
                                  fieldConfig={crimeYearConfig}
                                  formik={formikProps}
                                  otherValues={otherValues}
                                  setOtherValue={setOtherValue}
                                  suggestions={suggestions}
                                  policeStationOptions={policeStationOptions}
                                  districtOptions={districtOptions}
                                  onDistrictChange={handleDistrictChange}
                                  courtOptions={courtOptions}
                                  caseTypeOptions={caseTypeOptions}
                                />
                              </View>
                            </View>
                          );
                        }
                        return (
                          <View
                            key={fieldConfig.name}
                            onLayout={(event) => {
                              fieldLayouts.current[fieldConfig.name] =
                                event.nativeEvent.layout.y;
                            }}
                          >
                            <FormFieldRenderer
                              fieldConfig={fieldConfig}
                              formik={formikProps}
                              otherValues={otherValues}
                              setOtherValue={setOtherValue}
                              suggestions={suggestions}
                              policeStationOptions={policeStationOptions}
                              districtOptions={districtOptions}
                              onDistrictChange={handleDistrictChange}
                              courtOptions={courtOptions}
                              caseTypeOptions={caseTypeOptions}
                            />
                          </View>
                        );
                      })}
                  </Animatable.View>
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
                <ECourtsImportModal
                  visible={isECourtsModalVisible}
                  onClose={() => setIsECourtsModalVisible(false)}
                  onImportSuccess={(data) =>
                    handleImportSuccess(data, formikProps.setFieldValue)
                  }
                />
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>

      {isLocked && (
        <Modal visible={isLocked} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${theme.colors.primary}12` },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={32}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={[styles.lockTitle, { color: theme.colors.text }]}>
                {t("lock_title")}
              </Text>
              <Text
                style={[
                  styles.lockDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
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
