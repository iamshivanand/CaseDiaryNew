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
import * as db from "../../DataBase";
import { v4 as uuidv4 } from "uuid";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider"; // Import ThemeContext and Theme type

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
  const styles = getEditCaseScreenStyles(theme); // Generate styles with theme

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCaseDetails, setIsLoadingCaseDetails] = useState(true);
  const initialCaseIdFromRoute = route.params?.caseId;

  const [caseData, setCaseData] = useState<Partial<CaseData>>({});
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

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
        ? `Edit: ${route.params.initialCaseData.CaseTitle}`
        : "Edit Case",
    });

    const fetchAllData = async () => {
      if (!caseIdToLoad || typeof caseIdToLoad !== "number") {
        Alert.alert("Error", "No valid Case ID for editing.");
        setIsLoadingCaseDetails(false);
        if (navigation.canGoBack()) navigation.goBack();
        return;
      }
      setIsLoadingCaseDetails(true);
      try {
        const fetchedCase = await db.getCaseById(caseIdToLoad);
        if (fetchedCase) {
          setCaseData(mapDbCaseToFormState(fetchedCase));
          navigation.setOptions({
            title: `Edit: ${fetchedCase.CaseTitle || "Case"}`,
          });
          await Promise.all([
            loadDocuments(caseIdToLoad),
            loadTimelineEvents(caseIdToLoad),
          ]);
        } else {
          Alert.alert("Error", "Case not found.");
          if (navigation.canGoBack()) navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
        Alert.alert("Error", "Could not load case details.");
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
      Alert.alert("Error", "Case ID missing.");
      return;
    }
    if (!caseData.CaseTitle?.trim()) {
      Alert.alert("Validation Error", "Case Title required.");
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
        police_station_id: caseData.police_station_id || null,
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
          Alert.alert("Success", "Case saved.");
          navigation.goBack();
        } else {
          Alert.alert(
            "Partial Success",
            "Case data saved, but some sub-item operations failed."
          );
        }
      } else {
        overallSuccess = false;
        Alert.alert("Error", "Failed to save case details.");
      }
    } catch (error) {
      overallSuccess = false;
      console.error("Error saving case:", error);
      Alert.alert("Error", "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => navigation.goBack();
  const handleAddDocument = async () => {
    /* ... as before ... */
    if (typeof caseData.id !== "number") {
      Alert.alert("Error", "Case ID not available.");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || result.assets.length === 0)
        return;
      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert("Error", "Could not get document URI.");
        return;
      }
      const newDocument: Document = {
        id: Date.now(),
        case_id: caseData.id,
        fileName: asset.name || `doc_${Date.now()}`,
        uploadDate: new Date().toISOString(),
        fileType: asset.mimeType || "unknown",
        fileSize: asset.size,
        uri: asset.uri,
      };
      setDocuments((prev) => [...prev, newDocument]);
      Alert.alert(
        "Document Added",
        `${newDocument.fileName} added. Save changes to persist.`
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Error picking document.");
    }
  };
  const handleViewDocument = (doc: Document) =>
    Alert.alert("View Document", doc.fileName);
  const handleEditDocument = (doc: Document) =>
    Alert.alert("Edit Document Metadata", doc.fileName);
  const handleDeleteDocument = async (docToDelete: Document) => {
    /* ... as before, calls db.deleteCaseDocument for persisted ... */
    const isNew = !!docToDelete.uri && docToDelete.id > 1000000;
    if (isNew) {
      setDocuments((docs) => docs.filter((d) => d.id !== docToDelete.id));
      Alert.alert("Removed", "Document removed from list.");
      return;
    }
    if (typeof docToDelete.id !== "number") {
      Alert.alert("Error", "Invalid document ID.");
      return;
    }
    Alert.alert("Confirm", `Delete "${docToDelete.fileName}"?`, [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoadingDocuments(true);
            const success = await db.deleteCaseDocument(docToDelete.id);
            if (success) {
              setDocuments((docs) =>
                docs.filter((d) => d.id !== docToDelete.id)
              );
              Alert.alert("Deleted");
            } else Alert.alert("Error", "Failed to delete from DB.");
          } catch (e) {
            Alert.alert("Error", "Failed to delete.");
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
      "New Timeline Event",
      "Enter description:",
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
      "Edit Timeline Event",
      "Enter new description:",
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
    Alert.alert("Confirm Delete", "Delete this timeline event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
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
        <Text>Loading case details...</Text>
      </View>
    );
  }
  if (!caseData.id) {
    /* ... no case data UI ... */
    return (
      <View style={styles.centered}>
        <Text>Case not found or error loading.</Text>
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
          {/* FormInputs, DropdownPickers, DatePickerFields as before, bound to caseData state */}
          <FormInput
            label="Case Title*"
            value={caseData.CaseTitle || ""}
            onChangeText={(text) => handleInputChange("CaseTitle", text)}
          />
          <FormInput
            label="Client Name"
            value={caseData.ClientName || ""}
            onChangeText={(text) => handleInputChange("ClientName", text)}
          />
          <FormInput
            label="On Behalf Of"
            value={caseData.OnBehalfOf || ""}
            onChangeText={(text) => handleInputChange("OnBehalfOf", text)}
          />
          <FormInput
            label="Case Number"
            value={caseData.case_number || ""}
            onChangeText={(text) => handleInputChange("case_number", text)}
          />
          <FormInput
            label="CNR Number"
            value={caseData.CNRNumber || ""}
            onChangeText={(text) => handleInputChange("CNRNumber", text)}
          />
          <DropdownPicker
            label="Case Type"
            selectedValue={caseData.case_type_id || ""}
            onValueChange={(val) =>
              handleInputChange("case_type_id", val as number)
            }
            options={dummyCaseTypeOptions}
          />
          <DropdownPicker
            label="Court"
            selectedValue={caseData.court_id || ""}
            onValueChange={(val) =>
              handleInputChange("court_id", val as number)
            }
            options={dummyCourtOptions}
          />
          <FormInput
            label="Presiding Judge"
            value={caseData.JudgeName || ""}
            onChangeText={(text) => handleInputChange("JudgeName", text)}
          />
          <FormInput
            label="Opposing Counsel"
            value={caseData.OpposingCounsel || ""}
            onChangeText={(text) => handleInputChange("OpposingCounsel", text)}
          />
          <DropdownPicker
            label="Case Status"
            selectedValue={caseData.Status || ""}
            onValueChange={(val) => handleInputChange("Status", val as string)}
            options={caseStatusOptions}
          />
          <DropdownPicker
            label="Priority Level"
            selectedValue={caseData.Priority || ""}
            onValueChange={(val) =>
              handleInputChange("Priority", val as string)
            }
            options={priorityOptions}
          />
          <DatePickerField
            label="Date Filed"
            value={caseData.FiledDate ? new Date(caseData.FiledDate) : null}
            onChange={(date) =>
              handleInputChange("FiledDate", date ? date.toISOString() : null)
            }
          />
          <DatePickerField
            label="Next Hearing Date"
            value={caseData.HearingDate ? new Date(caseData.HearingDate) : null}
            onChange={(date) =>
              handleInputChange("HearingDate", date ? date.toISOString() : null)
            }
          />
          <DatePickerField
            label="Statute of Limitations"
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
              label="Date Closed"
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
            label="First Party"
            value={caseData.FirstParty || ""}
            onChangeText={(text) => handleInputChange("FirstParty", text)}
          />
          <FormInput
            label="Opposite Party"
            value={caseData.OppositeParty || ""}
            onChangeText={(text) => handleInputChange("OppositeParty", text)}
          />
          <FormInput
            label="Client Contact No."
            value={caseData.ClientContactNumber || ""}
            onChangeText={(text) =>
              handleInputChange("ClientContactNumber", text)
            }
            keyboardType="phone-pad"
          />
          <FormInput
            label="Accused"
            value={caseData.Accussed || ""}
            onChangeText={(text) => handleInputChange("Accussed", text)}
          />
          <FormInput
            label="Under Section(s)"
            value={caseData.Undersection || ""}
            onChangeText={(text) => handleInputChange("Undersection", text)}
          />
          <FormInput
            label="Case Description"
            value={caseData.CaseDescription || ""}
            onChangeText={(text) => handleInputChange("CaseDescription", text)}
            multiline
            numberOfLines={4}
            style={{ minHeight: 80 }}
          />
          <FormInput
            label="Internal Notes"
            value={caseData.CaseNotes || ""}
            onChangeText={(text) => handleInputChange("CaseNotes", text)}
            multiline
            numberOfLines={4}
            style={{ minHeight: 80 }}
          />

          <SectionHeader title="Case Documents" />
          <View style={styles.listContainer}>
            {isLoadingDocuments ? (
              <ActivityIndicator />
            ) : documents.length === 0 ? (
              <Text style={styles.emptyListText}>No documents.</Text>
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
              title="Add New Document"
              onPress={handleAddDocument}
              type="dashed"
              style={styles.fullWidthDashedButton}
              leftIcon={
                <MaterialIcons name="attach-file" size={20} color="#1D4ED8" />
              }
            />
          </View>

          <SectionHeader title="Case Timeline" />
          <View style={styles.listContainer}>
            {isLoadingTimeline ? (
              <ActivityIndicator />
            ) : timelineEvents.filter((e) => e._status !== "deleted").length ===
              0 ? (
              <Text style={styles.emptyListText}>No timeline events.</Text>
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
          title="Cancel"
          onPress={handleCancel}
          type="secondary"
          disabled={isSaving}
        />
        <ActionButton
          title="Save Changes"
          onPress={handleSave}
          type="primary"
          loading={isSaving}
          disabled={isSaving}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Renamed to RNStyleSheet to avoid conflict with imported styles
  scrollView: { flex: 1 },
  scrollContentContainer: { flexGrow: 1 },
  emptyListText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    paddingVertical: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  }, // Added centered style
});

export default EditCaseScreen;
