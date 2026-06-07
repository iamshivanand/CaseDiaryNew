// Screens/EditCase/EditCaseScreen.tsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  ScrollView,
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native"; // Changed StyleSheet to RNStyleSheet
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as db from "../../DataBase";
import { v4 as uuidv4 } from "uuid";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider"; // Import ThemeContext and Theme type
import { useTranslation } from "../../Providers/LanguageProvider";

import { getEditCaseScreenStyles } from "./EditCaseScreenStyle"; // Import the function
import FormInput from "../CommonComponents/FormInput";
import DropdownPicker from "../CommonComponents/DropdownPicker";
import DatePickerField from "../CommonComponents/DatePickerField";
import SectionHeader from "../CommonComponents/SectionHeader";
import ActionButton from "../CommonComponents/ActionButton";
import DocumentItem from "./components/DocumentItem";

import {
  CaseData,
  Document,
  TimelineEvent,
  DropdownOption,
  caseStatusOptions,
  priorityOptions,
} from "../../Types/appTypes";
import TimelineItem from "./components/TimelineItem";
import { RootStackParamList } from "../../Types/navigationtypes";
import { CaseWithDetails } from "../../DataBase"; // Import TimelineEventRow
import { PRIMARY_BLUE_COLOR_FOR_LOADER } from "../CaseDetailsScreen/CaseDetailsScreen";

const dummyCaseTypeOptions: DropdownOption[] = [
  /* ... as before ... */ { label: "Select Case Type...", value: "" },
  { label: "Civil Suit", value: 1 },
  { label: "Criminal Defense", value: 2 },
  { label: "Family Law", value: 3 },
  { label: "Corporate", value: 4 },
  { label: "Other", value: 99 },
];
const dummyCourtOptions: DropdownOption[] = [
  /* ... as before ... */ { label: "Select Court...", value: "" },
  { label: "District Court - City Center", value: 1 },
  { label: "High Court - State Capital", value: 2 },
  { label: "Supreme Court", value: 3 },
];

type EditCaseScreenRouteProp = RouteProp<RootStackParamList, "EditCase">;

const EditCaseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditCaseScreenRouteProp>();
  const { theme } = useContext(ThemeContext); // Get theme
  const { t } = useTranslation();
  const styles = getEditCaseScreenStyles(theme); // Generate styles with theme

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

  const getTranslatedOptions = (options: DropdownOption[]) => {
    return options.map(opt => {
      const key = getOptionLabelKey(opt.label.toString());
      return {
        ...opt,
        label: key ? t(key as any) : opt.label
      };
    });
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCaseDetails, setIsLoadingCaseDetails] = useState(true);
  const initialCaseIdFromRoute = route.params?.caseId;

  const [caseData, setCaseData] = useState<Partial<CaseData>>({});
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [policeStationOptions, setPoliceStationOptions] = useState<DropdownOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DropdownOption[]>([]);
  const [otherDistrict, setOtherDistrict] = useState("");
  const [otherPoliceStation, setOtherPoliceStation] = useState("");

  const handleDistrictChange = async (districtId: any) => {
    try {
      if (!districtId) {
        setPoliceStationOptions([{ label: "Other", value: "Other" }]);
        return;
      }
      let psList = [];
      if (districtId === 'Other') {
        psList = await db.getPoliceStations(null, null);
      } else {
        psList = await db.getPoliceStations(Number(districtId), null);
      }
      const formatted = psList.map(ps => ({
        label: ps.name,
        value: ps.id
      }));
      formatted.push({ label: "Other", value: "Other" });
      setPoliceStationOptions(formatted);
    } catch (error) {
      console.error("Error fetching filtered police stations:", error);
    }
  };

  const mapDbCaseToFormState = (dbCase: CaseWithDetails): Partial<CaseData> => {
    return {
      id: dbCase.id,
      uniqueId: dbCase.uniqueId,
      CaseTitle: dbCase.CaseTitle,
      ClientName: dbCase.ClientName,
      OnBehalfOf: dbCase.OnBehalfOf,
      CNRNumber: dbCase.CNRNumber,
      case_number: dbCase.case_number,
      court_id: dbCase.court_id,
      court_name: dbCase.court_name,
      case_type_id: dbCase.case_type_id,
      case_type_name: dbCase.case_type_name,
      FiledDate: dbCase.dateFiled,
      dateFiled: dbCase.dateFiled,
      JudgeName: dbCase.JudgeName,
      OpposingCounsel: dbCase.OpposingCounsel,
      OppositeAdvocate: dbCase.OppositeAdvocate,
      Status: dbCase.CaseStatus,
      CaseStatus: dbCase.CaseStatus,
      Priority: dbCase.Priority,
      HearingDate: dbCase.NextDate,
      NextDate: dbCase.NextDate,
      StatuteOfLimitations: dbCase.StatuteOfLimitations,
      ClosedDate: dbCase.ClosedDate,
      FirstParty: dbCase.FirstParty,
      OppositeParty: dbCase.OppositeParty,
      ClientContactNumber: dbCase.ClientContactNumber,
      Accussed: dbCase.Accussed,
      Undersection: dbCase.Undersection,
      police_station_id: dbCase.police_station_id,
      OppAdvocateContactNumber: dbCase.OppAdvocateContactNumber,
      PreviousDate: dbCase.PreviousDate,
      CaseDescription: dbCase.CaseDescription,
      CaseNotes: dbCase.CaseNotes,
    };
  };

  const loadDocuments = useCallback(async (currentCaseId: number) => {
    /* ... as before ... */
    if (!currentCaseId) return;
    setIsLoadingDocuments(true);
    try {
      const fetchedDocs = await db.getCaseDocuments(currentCaseId);
      const uiDocs: Document[] = fetchedDocs.map((dbDoc) => ({
        id: dbDoc.id,
        case_id: dbDoc.case_id,
        fileName: dbDoc.original_display_name,
        uploadDate: dbDoc.created_at,
        fileType: dbDoc.file_type,
        fileSize: dbDoc.file_size,
        stored_filename: dbDoc.stored_filename,
      }));
      setDocuments(uiDocs);
    } catch (error) {
      console.error("Error loading documents:", error);
      Alert.alert("Error", "Could not load documents.");
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  const loadTimelineEvents = useCallback(async (currentCaseId: number) => {
    if (!currentCaseId) return;
    setIsLoadingTimeline(true);
    try {
      const fetchedEvents = await db.getCaseTimelineEventsByCaseId(currentCaseId);
      const uiEvents: TimelineEvent[] = fetchedEvents.map((dbEvent) => ({
        id: dbEvent.id,
        case_id: dbEvent.case_id,
        date: dbEvent.hearing_date,
        description: dbEvent.notes,
        _status: "synced",
      }));
      setTimelineEvents(uiEvents);
    } catch (error) {
      console.error("Error loading timeline events:", error);
      Alert.alert("Error", "Could not load timeline.");
    } finally {
      setIsLoadingTimeline(false);
    }
  }, []);

  useEffect(() => {
    const caseIdToLoad = initialCaseIdFromRoute;
    navigation.setOptions({
      title: route.params?.initialCaseData?.CaseTitle
        ? `${t("editcase_header_edit")}: ${route.params.initialCaseData.CaseTitle}`
        : t("editcase_header_title"),
    });

    const fetchAllData = async () => {
      if (!caseIdToLoad || typeof caseIdToLoad !== "number") {
        Alert.alert(t("alert_error"), t("editcase_err_no_id"));
        setIsLoadingCaseDetails(false);
        if (navigation.canGoBack()) navigation.goBack();
        return;
      }
      setIsLoadingCaseDetails(true);
      try {
        const fetchedCase = await db.getCaseById(caseIdToLoad);
        if (fetchedCase) {
          // Fetch districts
          try {
            const districtsList = await db.getDistricts(null);
            const formattedDistricts = districtsList.map(d => ({
              label: d.name,
              value: d.id
            }));
            formattedDistricts.push({ label: "Other", value: "Other" });
            setDistrictOptions(formattedDistricts);
          } catch (error) {
            console.error("Error fetching districts:", error);
          }

          // Resolve initial district of the case's police station
          let initialDistrictId = null;
          if (fetchedCase.police_station_id) {
            try {
              const dbInstance = await db.getDb();
              const psRow = await dbInstance.getFirstAsync<{ district_id: number | null }>(
                "SELECT district_id FROM PoliceStations WHERE id = ?",
                [fetchedCase.police_station_id]
              );
              if (psRow && psRow.district_id) {
                initialDistrictId = psRow.district_id;
              }
            } catch (e) {
              console.error("Error resolving initial district:", e);
            }
          }

          const mappedState = mapDbCaseToFormState(fetchedCase);
          mappedState.district_id = initialDistrictId || "";
          setCaseData(mappedState);

          await handleDistrictChange(initialDistrictId);

          navigation.setOptions({
            title: `${t("editcase_header_edit")}: ${fetchedCase.CaseTitle || "Case"}`,
          });
          await Promise.all([
            loadDocuments(caseIdToLoad),
            loadTimelineEvents(caseIdToLoad),
          ]);
        } else {
          Alert.alert(t("alert_error"), t("editcase_err_not_found"));
          if (navigation.canGoBack()) navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
        Alert.alert(t("alert_error"), t("editcase_load_details"));
        if (navigation.canGoBack()) navigation.goBack();
      } finally {
        setIsLoadingCaseDetails(false);
      }
    };
    fetchAllData();
  }, [initialCaseIdFromRoute, navigation, loadDocuments, loadTimelineEvents]);

  const handleInputChange = (field: keyof CaseData, value: any) => {
    setCaseData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!caseData.id || typeof caseData.id !== "number") {
      Alert.alert(t("alert_error"), t("editcase_err_id_missing"));
      return;
    }
    if (!caseData.CaseTitle?.trim()) {
      Alert.alert(t("editcase_val_error"), t("editcase_val_title_req"));
      return;
    }
    setIsSaving(true);
    let overallSuccess = true;
    try {
      const selectedCourtOption = dummyCourtOptions.find(
        (opt) => opt.value === caseData.court_id
      );
      const courtNameForDb =
        selectedCourtOption?.label || caseData.court_name || null;
      const selectedCaseTypeOption = dummyCaseTypeOptions.find(
        (opt) => opt.value === caseData.case_type_id
      );
      const caseTypeNameForDb =
        selectedCaseTypeOption?.label || caseData.case_type_name || null;

      let districtId = caseData.district_id || null;
      if (districtId === "Other") {
        if (otherDistrict.trim()) {
          const newId = await db.addDistrict(otherDistrict.trim());
          districtId = newId;
        } else {
          districtId = null;
        }
      } else {
        districtId = districtId ? Number(districtId) : null;
      }

      let policeStationId = caseData.police_station_id || null;
      if (policeStationId === "Other") {
        if (otherPoliceStation.trim()) {
          const newId = await db.addPoliceStation(otherPoliceStation.trim(), districtId);
          policeStationId = newId;
        } else {
          policeStationId = null;
        }
      } else {
        policeStationId = policeStationId ? Number(policeStationId) : null;
      }

      const updatePayload: db.CaseUpdateData = {
        /* ... (map all caseData fields to CaseUpdateData as before, including new ones) ... */
        CaseTitle: caseData.CaseTitle,
        ClientName: caseData.ClientName,
        OnBehalfOf: caseData.OnBehalfOf,
        CNRNumber: caseData.CNRNumber,
        case_number: caseData.case_number,
        court_id: caseData.court_id || null,
        court_name: courtNameForDb,
        case_type_id: caseData.case_type_id || null,
        case_type_name: caseTypeNameForDb,
        dateFiled: caseData.FiledDate || caseData.dateFiled,
        JudgeName: caseData.JudgeName,
        OpposingCounsel: caseData.OpposingCounsel,
        OppositeAdvocate: caseData.OppositeAdvocate,
        CaseStatus: caseData.Status || caseData.CaseStatus,
        Priority: caseData.Priority,
        NextDate: caseData.HearingDate || caseData.NextDate,
        StatuteOfLimitations: caseData.StatuteOfLimitations,
        ClosedDate: caseData.ClosedDate,
        FirstParty: caseData.FirstParty,
        OppositeParty: caseData.OppositeParty,
        ClientContactNumber: caseData.ClientContactNumber,
        Accussed: caseData.Accussed,
        Undersection: caseData.Undersection,
        police_station_id: policeStationId,
        OppAdvocateContactNumber: caseData.OppAdvocateContactNumber,
        PreviousDate: caseData.PreviousDate,
        CaseDescription: caseData.CaseDescription,
        CaseNotes: caseData.CaseNotes,
        case_year: caseData.case_year ? Number(caseData.case_year) : null,
        crime_number: caseData.crime_number,
        crime_year: caseData.crime_year ? Number(caseData.crime_year) : null,
      };
      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key as keyof db.CaseUpdateData] === undefined)
          delete updatePayload[key as keyof db.CaseUpdateData];
      });

      const caseUpdateSuccess = await db.updateCase(
        caseData.id as number,
        updatePayload
      );
      if (caseUpdateSuccess) {
        console.log("Case data updated.");
        // Document processing
        const newDocsToUpload = documents.filter(
          (doc) => doc.uri && typeof doc.id === "number" && doc.id > 1000000
        );
        for (const newDoc of newDocsToUpload) {
          /* ... db.uploadCaseDocument ... */
          try {
            const uploadedDocId = await db.uploadCaseDocument({
              caseId: caseData.id as number,
              originalFileName: newDoc.fileName,
              fileType: newDoc.fileType || "application/octet-stream",
              fileUri: newDoc.uri as string,
              fileSize: newDoc.fileSize,
              userId: null,
            });
            if (!uploadedDocId) overallSuccess = false;
          } catch (e) {
            overallSuccess = false;
            console.error("Doc upload error", e);
          }
        }
        // Timeline processing
        for (const event of timelineEvents) {
          if (typeof caseData.id !== "number") continue; // Should not happen here
          if (event._status === "new" && event._clientSideId) {
            try {
              const newEventData: db.TimelineEventInsertData = {
                case_id: caseData.id,
                event_date: event.date,
                description: event.description,
                user_id: null /* TODO */,
              };
              await db.addTimelineEvent(newEventData);
            } catch (e) {
              overallSuccess = false;
              console.error("Timeline add error", e);
            }
          } else if (
            event._status === "modified" &&
            typeof event.id === "number"
          ) {
            try {
              await db.updateTimelineEvent(event.id, {
                event_date: event.date,
                description: event.description,
              });
            } catch (e) {
              overallSuccess = false;
              console.error("Timeline update error", e);
            }
          } else if (
            event._status === "deleted" &&
            typeof event.id === "number"
          ) {
            try {
              await db.deleteTimelineEvent(event.id);
            } catch (e) {
              overallSuccess = false;
              console.error("Timeline delete error", e);
            }
          }
        }
        if (typeof caseData.id === "number") {
          await loadDocuments(caseData.id); // Refresh docs
          await loadTimelineEvents(caseData.id); // Refresh timeline
        }
        if (overallSuccess) {
          Alert.alert(t("alert_success"), t("editcase_success_saved"));
          navigation.goBack();
        } else {
          Alert.alert(
            t("editcase_partial_success"),
            t("editcase_partial_success_desc")
          );
        }
      } else {
        overallSuccess = false;
        Alert.alert(t("alert_error"), t("editcase_err_save_details"));
      }
    } catch (error) {
      overallSuccess = false;
      console.error("Error saving case:", error);
      Alert.alert(t("alert_error"), t("editcase_err_general"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => navigation.goBack();
  const handleAddDocument = async () => {
    if (typeof caseData.id !== "number") {
      Alert.alert(t("alert_error"), t("editcase_err_id_missing"));
      return;
    }
    
    Alert.alert(
      t("doc_select_picker_title"),
      t("doc_select_picker_desc"),
      [
        {
          text: t("doc_select_picker_file"),
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
              });
              if (result.canceled || !result.assets || result.assets.length === 0)
                return;
              const asset = result.assets[0];
              if (!asset.uri) {
                Alert.alert(t("alert_error"), t("doc_err_uri"));
                return;
              }
              const newDocument: Document = {
                id: Date.now(),
                case_id: caseData.id!,
                fileName: asset.name || `doc_${Date.now()}`,
                uploadDate: new Date().toISOString(),
                fileType: asset.mimeType || "unknown",
                fileSize: asset.size,
                uri: asset.uri,
              };
              setDocuments((prev) => [...prev, newDocument]);
              Alert.alert(
                t("editcase_doc_added"),
                `${newDocument.fileName} ${t("editcase_doc_added_desc")}`
              );
            } catch (e) {
              console.error(e);
              Alert.alert(t("alert_error"), t("editcase_err_pick_doc"));
            }
          }
        },
        {
          text: t("doc_select_picker_camera"),
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(t("alert_error"), "Permission to access camera was denied.");
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.9,
              });
              if (result.canceled || !result.assets || result.assets.length === 0)
                return;
              const asset = result.assets[0];
              if (!asset.uri) {
                Alert.alert(t("alert_error"), t("doc_err_uri"));
                return;
              }
              const timestamp = Date.now();
              const newDocument: Document = {
                id: timestamp,
                case_id: caseData.id!,
                fileName: asset.fileName || `photo_${timestamp}.jpg`,
                uploadDate: new Date().toISOString(),
                fileType: asset.mimeType || "image/jpeg",
                fileSize: asset.fileSize || 0,
                uri: asset.uri,
              };
              setDocuments((prev) => [...prev, newDocument]);
              Alert.alert(
                t("editcase_doc_added"),
                `${newDocument.fileName} ${t("editcase_doc_added_desc")}`
              );
            } catch (e) {
              console.error(e);
              Alert.alert(t("alert_error"), "Failed to capture image.");
            }
          }
        },
        {
          text: t("alert_cancel"),
          style: "cancel"
        }
      ]
    );
  };
  const handleViewDocument = (doc: Document) =>
    Alert.alert(t("editcase_view_doc"), doc.fileName);
  const handleEditDocument = (doc: Document) =>
    Alert.alert(t("editcase_edit_doc_meta"), doc.fileName);
  const handleDeleteDocument = async (docToDelete: Document) => {
    /* ... as before, calls db.deleteCaseDocument for persisted ... */
    const isNew = !!docToDelete.uri && docToDelete.id > 1000000;
    if (isNew) {
      setDocuments((docs) => docs.filter((d) => d.id !== docToDelete.id));
      Alert.alert(t("editcase_removed"), t("editcase_doc_removed_desc"));
      return;
    }
    if (typeof docToDelete.id !== "number") {
      Alert.alert(t("alert_error"), t("editcase_err_invalid_doc_id"));
      return;
    }
    Alert.alert(t("editcase_confirm"), `${t("editcase_delete")} "${docToDelete.fileName}"?`, [
      { text: t("alert_cancel") },
      {
        text: t("editcase_delete"),
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoadingDocuments(true);
            const success = await db.deleteCaseDocument(docToDelete.id);
            if (success) {
              setDocuments((docs) =>
                docs.filter((d) => d.id !== docToDelete.id)
              );
              Alert.alert(t("editcase_deleted"));
            } else Alert.alert(t("alert_error"), t("editcase_err_delete_db"));
          } catch (e) {
            Alert.alert(t("alert_error"), t("editcase_err_delete"));
          } finally {
            setIsLoadingDocuments(false);
          }
        },
      },
    ]);
  };

  const handleAddTimelineEvent = () => {
    // For now, an Alert. In full implementation, this would open a modal/form.
    Alert.prompt(
      t("editcase_new_timeline"),
      t("editcase_enter_desc"),
      async (description) => {
        if (description && caseData.id) {
          const newEvent: TimelineEvent = {
            _clientSideId: uuidv4(), // Temp ID for new items
            id: `temp_${uuidv4()}`, // Also use this for key until DB ID comes
            case_id: caseData.id as number,
            date: new Date().toISOString(), // Default to today, modal should allow picking date
            description: description,
            _status: "new",
          };
          setTimelineEvents((prev) => [...prev, newEvent]);
        }
      },
      "plain-text", // Input type
      "", // Default value
      "default" // Keyboard type
    );
  };
  const handleEditTimelineEvent = (eventToEdit: TimelineEvent) => {
    Alert.prompt(
      t("editcase_edit_timeline"),
      t("editcase_enter_new_desc"),
      async (description) => {
        if (description) {
          setTimelineEvents((prev) =>
            prev.map((event) =>
              event.id === eventToEdit.id ||
              event._clientSideId === eventToEdit._clientSideId
                ? {
                    ...event,
                    description,
                    _status: typeof event.id === "number" ? "modified" : "new",
                  }
                : event
            )
          );
        }
      },
      "plain-text",
      eventToEdit.description
    );
  };
  const handleDeleteTimelineEvent = (eventToDelete: TimelineEvent) => {
    Alert.alert(t("editcase_confirm_delete"), t("editcase_delete_event_confirm"), [
      { text: t("alert_cancel"), style: "cancel" },
      {
        text: t("editcase_delete"),
        style: "destructive",
        onPress: () => {
          if (eventToDelete._status === "new" && eventToDelete._clientSideId) {
            setTimelineEvents((prev) =>
              prev.filter(
                (event) => event._clientSideId !== eventToDelete._clientSideId
              )
            );
          } else if (typeof eventToDelete.id === "number") {
            // Existing event
            setTimelineEvents((prev) =>
              prev.map((event) =>
                event.id === eventToDelete.id
                  ? { ...event, _status: "deleted" }
                  : event
              )
            );
          }
        },
      },
    ]);
  };

  if (isLoadingCaseDetails) {
    /* ... loading UI ... */
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE_COLOR_FOR_LOADER} />
        <Text>{t("editcase_load_details")}</Text>
      </View>
    );
  }
  if (!caseData.id) {
    /* ... no case data UI ... */
    return (
      <View style={styles.centered}>
        <Text>{t("editcase_err_not_found")}</Text>
      </View>
    );
  }

  return (
    /* ... JSX for the screen ... */
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <FormInput
            label={t("field_case_title")}
            value={caseData.CaseTitle || ""}
            onChangeText={(text) => handleInputChange("CaseTitle", text)}
          />
          <FormInput
            label={t("field_client_name")}
            value={caseData.ClientName || ""}
            onChangeText={(text) => handleInputChange("ClientName", text)}
          />
          <FormInput
            label={t("field_client_contact")}
            value={caseData.ClientContactNumber || ""}
            onChangeText={(text) =>
              handleInputChange("ClientContactNumber", text)
            }
            keyboardType="phone-pad"
          />
          <FormInput
            label={t("field_cnr_number")}
            value={caseData.CNRNumber || ""}
            onChangeText={(text) => handleInputChange("CNRNumber", text)}
          />
          <FormInput
            label={t("field_case_number")}
            value={caseData.case_number || ""}
            onChangeText={(text) => handleInputChange("case_number", text)}
          />
          <FormInput
            label={t("field_crime_number")}
            value={caseData.crime_number || ""}
            onChangeText={(text) => handleInputChange("crime_number", text)}
          />
          <FormInput
            label={t("field_crime_year")}
            value={caseData.crime_year ? caseData.crime_year.toString() : ""}
            onChangeText={(text) => handleInputChange("crime_year", text)}
            keyboardType="numeric"
          />
          <DropdownPicker
            label={t("field_case_type")}
            selectedValue={caseData.case_type_id || ""}
            onValueChange={(val) =>
              handleInputChange("case_type_id", val as number)
            }
            options={getTranslatedOptions(dummyCaseTypeOptions)}
          />
          <DropdownPicker
            label={t("field_court")}
            selectedValue={caseData.court_id || ""}
            onValueChange={(val) =>
              handleInputChange("court_id", val as number)
            }
            options={getTranslatedOptions(dummyCourtOptions)}
          />
          <FormInput
            label={t("field_under_section")}
            value={caseData.Undersection || ""}
            onChangeText={(text) => handleInputChange("Undersection", text)}
          />
          <DropdownPicker
            label={t("field_district")}
            selectedValue={caseData.district_id || ""}
            onValueChange={async (val) => {
              handleInputChange("district_id", val);
              handleInputChange("police_station_id", "");
              await handleDistrictChange(val);
            }}
            options={getTranslatedOptions(districtOptions)}
            onOtherValueChange={(text) => setOtherDistrict(text)}
          />
          <DropdownPicker
            label={t("field_police_station")}
            selectedValue={caseData.police_station_id || ""}
            onValueChange={(val) =>
              handleInputChange("police_station_id", val)
            }
            options={getTranslatedOptions(policeStationOptions)}
            onOtherValueChange={(text) => setOtherPoliceStation(text)}
          />
          <DatePickerField
            label={t("field_filed_date")}
            value={caseData.FiledDate ? new Date(caseData.FiledDate) : null}
            onChange={(date) =>
              handleInputChange("FiledDate", date ? date.toISOString() : null)
            }
          />
          <FormInput
            label={t("field_judge_name")}
            value={caseData.JudgeName || ""}
            onChangeText={(text) => handleInputChange("JudgeName", text)}
          />
          <FormInput
            label={t("field_opposing_counsel")}
            value={caseData.OpposingCounsel || ""}
            onChangeText={(text) => handleInputChange("OpposingCounsel", text)}
          />
          <DropdownPicker
            label={t("field_status")}
            selectedValue={caseData.Status || ""}
            onValueChange={(val) => handleInputChange("Status", val as string)}
            options={getTranslatedOptions(caseStatusOptions)}
          />
          <DropdownPicker
            label={t("field_priority")}
            selectedValue={caseData.Priority || ""}
            onValueChange={(val) =>
              handleInputChange("Priority", val as string)
            }
            options={getTranslatedOptions(priorityOptions)}
          />
          <DatePickerField
            label={t("field_hearing_date")}
            value={caseData.HearingDate ? new Date(caseData.HearingDate) : null}
            onChange={(date) =>
              handleInputChange("HearingDate", date ? date.toISOString() : null)
            }
          />
          <DatePickerField
            label={t("field_statute_of_limitations")}
            value={
              caseData.StatuteOfLimitations
                ? new Date(caseData.StatuteOfLimitations)
                : null
            }
            onChange={(date) =>
              handleInputChange(
                "StatuteOfLimitations",
                date ? date.toISOString() : null
              )
            }
          />
          {caseData.Status === "Closed" && (
            <DatePickerField
              label={t("field_date_closed")}
              value={caseData.ClosedDate ? new Date(caseData.ClosedDate) : null}
              onChange={(date) =>
                handleInputChange(
                  "ClosedDate",
                  date ? date.toISOString() : null
                )
              }
            />
          )}
          <FormInput
            label={t("field_first_party")}
            value={caseData.FirstParty || ""}
            onChangeText={(text) => handleInputChange("FirstParty", text)}
          />
          <FormInput
            label={t("field_opposite_party")}
            value={caseData.OppositeParty || ""}
            onChangeText={(text) => handleInputChange("OppositeParty", text)}
          />
          <FormInput
            label={t("field_accused")}
            value={caseData.Accussed || ""}
            onChangeText={(text) => handleInputChange("Accussed", text)}
          />
          <FormInput
            label={t("field_on_behalf_of")}
            value={caseData.OnBehalfOf || ""}
            onChangeText={(text) => handleInputChange("OnBehalfOf", text)}
          />
          <FormInput
            label={t("field_case_description")}
            value={caseData.CaseDescription || ""}
            onChangeText={(text) => handleInputChange("CaseDescription", text)}
            multiline
            numberOfLines={4}
          />
          <FormInput
            label={t("field_case_notes")}
            value={caseData.CaseNotes || ""}
            onChangeText={(text) => handleInputChange("CaseNotes", text)}
            multiline
            numberOfLines={4}
          />

          <SectionHeader title={t("editcase_sec_documents")} />
          <View style={styles.listContainer}>
            {isLoadingDocuments ? (
              <ActivityIndicator />
            ) : documents.length === 0 ? (
              <Text style={styles.emptyListText}>{t("editcase_no_documents")}</Text>
            ) : (
              documents.map((doc) => (
                <DocumentItem
                  key={doc.id.toString()}
                  document={doc}
                  onView={handleViewDocument}
                  onEdit={handleEditDocument}
                  onDelete={handleDeleteDocument}
                />
              ))
            )}
            <ActionButton
              title={t("editcase_btn_add_document")}
              onPress={handleAddDocument}
              type="dashed"
              style={styles.fullWidthDashedButton}
              leftIcon={
                <MaterialIcons name="attach-file" size={20} color="#1D4ED8" />
              }
            />
          </View>

          <SectionHeader title={t("editcase_sec_timeline")} />
          <View style={styles.listContainer}>
            {isLoadingTimeline ? (
              <ActivityIndicator />
            ) : timelineEvents.filter((e) => e._status !== "deleted").length ===
              0 ? (
              <Text style={styles.emptyListText}>{t("editcase_no_timeline")}</Text>
            ) : (
              timelineEvents
                .filter((e) => e._status !== "deleted")
                .map((event, index, arr) => (
                  <TimelineItem
                    key={event._clientSideId || event.id.toString()}
                    item={event}
                    onEdit={handleEditTimelineEvent}
                    onDelete={handleDeleteTimelineEvent}
                    isLastItem={index === arr.length - 1}
                  />
                ))
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomButtonContainer}>
        <ActionButton
          title={t("alert_cancel")}
          onPress={handleCancel}
          type="secondary"
          disabled={isSaving}
        />
        <ActionButton
          title={t("btn_save_changes")}
          onPress={handleSave}
          type="primary"
          loading={isSaving}
          disabled={isSaving}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default EditCaseScreen;
