// Screens/CaseDetailsScreen/CaseDetailsScreen.tsx
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { formatDate } from "../../utils/commonFunctions";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Clipboard,
  Modal,
  TextInput,
} from "react-native"; // Removed ScrollView
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as db from "../../DataBase";
import { getCaseTimelineEventsByCaseId, getCaseById } from "../../DataBase";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import { useTranslation } from "../../Providers/LanguageProvider";
import { CaseData, CaseDataScreen, Document, TimelineEvent } from "../../Types/appTypes";
import { HomeStackParamList } from "../../Types/navigationtypes";
import ActionButton from "../CommonComponents/ActionButton";
import SectionHeader from "../CommonComponents/SectionHeader";
import { exportCaseToPdf, exportCaseHistoryToPdf } from "../../utils/pdfExporter";
import { useAdTrigger } from "../CommonComponents/AdManager";
import DateRow from "./components/DateRow";
import DocumentCard from "./components/DocumentCard";
import StatusBadge from "./components/StatusBadge";
import TimelineEventItem from "./components/TimelineEventItem";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import DocumentUpload from "../Addcase/DocumentUpload";

type CaseDetailsScreenRouteProp = RouteProp<HomeStackParamList, "CaseDetails">;

export const PRIMARY_BLUE_COLOR_FOR_LOADER = "#3B82F6";

// Define item types for the main FlatList
type ListItemType =
  | { type: "summary"; data: CaseDataScreen }
  | { type: "documentsHeader" }
  | { type: "document"; data: Document; id: string }
  | { type: "noDocuments" }
  | { type: "timelineHeader" }
  | { type: "timelineEvent"; data: TimelineEvent; isLast: boolean; id: string }
  | { type: "noTimelineEvents" }
  | { type: "loadingDocuments" };

const CaseDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CaseDetailsScreenRouteProp>();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = getStyles(theme);
  const { showAdWithPreload } = useAdTrigger();
  const { caseId } = route.params;
  const [caseDetails, setCaseDetails] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [customReminderText, setCustomReminderText] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ title: caseDetails?.CaseTitle || t("casedetails_header_title") });
  }, [navigation, caseDetails, t]);

  const loadCaseDetails = useCallback(async (caseId: number) => {
    console.log("Loading case details for caseId:", caseId);
    const details = await getCaseById(caseId);
    if (details) {
      console.log("Case details found:", details);
      setCaseDetails(details);
    } else {
      console.log("Case details not found for caseId:", caseId);
    }
  }, []);

  const loadDocumentsAndTimeline = useCallback(async (currentCaseId: number) => {
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

      const fetchedTimelineEvents = await getCaseTimelineEventsByCaseId(
        currentCaseId
      );
      setTimelineEvents(
        fetchedTimelineEvents.map((tle) => ({
          id: tle.id.toString(),
          date: tle.hearing_date,
          description: tle.notes,
        }))
      );
    } catch (error) {
      console.error(
        "Error loading associated data (documents/timeline) for case:",
        error
      );
      Alert.alert(t("alert_error"), t("casedetails_err_associated"));
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    if (!caseId) return;
    const caseIdToLoad = parseInt(caseId.toString(), 10);

    const fetchAllData = async () => {
      if (!caseIdToLoad || isNaN(caseIdToLoad)) {
        Alert.alert(t("alert_error"), t("casedetails_err_no_id"));
        setIsLoading(false);
        if (navigation.canGoBack()) navigation.goBack();
        return;
      }
      setIsLoading(true);
      try {
        await loadCaseDetails(caseIdToLoad);
        await loadDocumentsAndTimeline(caseIdToLoad);
      } catch (error) {
        console.error("Error fetching case details:", error);
        Alert.alert(t("alert_error"), t("casedetails_err_load"));
        if (navigation.canGoBack()) navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    // Load data initially on mount
    fetchAllData();

    // Reload data when the screen is focused (e.g., when returning from Edit Case)
    const unsubscribe = navigation.addListener("focus", () => {
      fetchAllData();
    });

    return unsubscribe;
  }, [caseId, navigation, loadDocumentsAndTimeline, loadCaseDetails]);

  const handleEditCase = () => {
    // Navigate to an EditCase screen, passing the case details
    // @ts-ignore
    navigation.navigate("EditCase", { caseId: parseInt(caseDetails.id, 10) });
  };

  const handleAddNewDocument = () => {
    // Navigate to a screen for adding documents
    // @ts-ignore
    navigation.navigate("AddDocument", { caseId: caseDetails.id });
  };

  const handleExportPdf = async () => {
    if (!caseDetails) return;
    await showAdWithPreload("rewarded", async (success) => {
      if (success) {
        try {
          await exportCaseToPdf(caseDetails);
        } catch (error) {
          Alert.alert(t("casedetails_export_failed"), t("casedetails_export_failed_desc"));
        }
      }
    });
  };

  const handleShareHistory = async () => {
    if (!caseDetails) return;
    await showAdWithPreload("rewarded", async (success) => {
      if (success) {
        try {
          await exportCaseHistoryToPdf(caseDetails as any);
        } catch (error) {
          Alert.alert(t("casedetails_export_failed"), t("casedetails_export_failed_desc"));
        }
      }
    });
  };

  const generateReminderText = async () => {
    if (!caseDetails) return "";
    let advocateName = "";
    try {
      const userId = await AsyncStorage.getItem("@user_id");
      if (userId) {
        const dbInstance = await db.getDb();
        const profile = await db.getUserProfile(dbInstance, parseInt(userId, 10));
        if (profile?.name) {
          advocateName = profile.name;
        }
      }
      if (!advocateName) {
        advocateName = (await AsyncStorage.getItem("@advocate_name")) || "";
      }
    } catch (e) {
      console.warn("Failed to load advocate details for reminder:", e);
    }

    if (!advocateName) {
      advocateName = "Advocate";
    }

    const template = t("reminder_template");
    return template
      .replace(/{clientName}/g, caseDetails.ClientName || "")
      .replace(/{caseTitle}/g, caseDetails.CaseTitle || "")
      .replace(/{caseNumber}/g, caseDetails.case_number || "N/A")
      .replace(/{nextDate}/g, formatDate(caseDetails.NextDate) || "N/A")
      .replace(/{courtName}/g, caseDetails.court_name || "N/A")
      .replace(/{advocateName}/g, advocateName);
  };

  const handleOpenReminderModal = async () => {
    const text = await generateReminderText();
    setCustomReminderText(text);
    setShowReminderModal(true);
  };

  const handleSendReminderWhatsApp = () => {
    if (caseDetails?.ClientContactNumber) {
      const cleanNumber = caseDetails.ClientContactNumber.replace(/\D/g, "");
      const url = `whatsapp://send?text=${encodeURIComponent(customReminderText)}&phone=${cleanNumber}`;
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(customReminderText)}`);
        }
      });
      setShowReminderModal(false);
    } else {
      Alert.alert(t("casedetails_no_contact"), t("casedetails_no_contact_desc"));
    }
  };

  const handleSendReminderSMS = () => {
    if (caseDetails?.ClientContactNumber) {
      const cleanNumber = caseDetails.ClientContactNumber.replace(/\D/g, "");
      const separator = Platform.OS === "ios" ? "&" : "?";
      Linking.openURL(`sms:${cleanNumber}${separator}body=${encodeURIComponent(customReminderText)}`);
      setShowReminderModal(false);
    } else {
      Alert.alert(t("casedetails_no_contact"), t("casedetails_no_contact_desc"));
    }
  };

  const handleCopyReminderToClipboard = () => {
    Clipboard.setString(customReminderText);
    Alert.alert(t("alert_success"), t("reminder_copy_success") || "Reminder text copied to clipboard!");
    setShowReminderModal(false);
  };

  const handleGenerateDocument = () => {
    if (!caseDetails) return;
    // @ts-ignore
    navigation.navigate("GenerateDocument", { caseId: parseInt(caseDetails.id, 10) });
  };

  const handlePhoneCall = () => {
    if (caseDetails?.ClientContactNumber) {
      Linking.openURL(`tel:${caseDetails.ClientContactNumber}`);
    } else {
      Alert.alert(t("casedetails_no_contact"), t("casedetails_no_contact_desc"));
    }
  };

  const handleWhatsAppChat = () => {
    if (caseDetails?.ClientContactNumber) {
      const cleanNumber = caseDetails.ClientContactNumber.replace(/\D/g, "");
      Linking.openURL(`https://wa.me/${cleanNumber}`);
    } else {
      Alert.alert(t("casedetails_no_contact"), t("casedetails_no_contact_desc"));
    }
  };

  const handleDocumentInteraction = async (doc: Document) => {
    if (!doc.stored_filename) {
      Alert.alert(t("alert_error"), t("doc_err_path"));
      return;
    }
    const localDocumentPath = db.getFullDocumentPath(doc.stored_filename);
    if (!localDocumentPath) {
      Alert.alert(t("alert_error"), t("doc_err_construct_path"));
      return;
    }
    try {
      const fileInfo = await FileSystem.getInfoAsync(localDocumentPath);
      if (!fileInfo.exists) {
        Alert.alert(t("alert_error"), t("casedetails_file_not_found") + localDocumentPath);
        return;
      }
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(localDocumentPath);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: doc.fileType || "*/*",
        });
      } else if (Platform.OS === "ios") {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localDocumentPath, {
            mimeType: doc.fileType || undefined,
            dialogTitle: `${t("casedetails_open_doc")} ${doc.fileName}`,
            UTI: doc.fileType || undefined,
          });
        } else {
          Alert.alert(t("alert_warning"), t("casedetails_sharing_unavailable"));
        }
      } else {
        Alert.alert(t("casedetails_open_doc"), `${t("casedetails_open_manually")}${localDocumentPath}`);
      }
    } catch (error: any) {
      console.error("Error opening document:", error);
      Alert.alert(t("casedetails_err_open_file"), error.message || t("alert_error"));
    }
  };


  const listData: ListItemType[] = [];
  listData.push({ type: "summary", data: caseDetails });

  listData.push({ type: "documentsHeader" });
  if (isLoadingDocuments) {
    listData.push({ type: "loadingDocuments" });
  } else {
    // We will render the DocumentUpload component directly, so we don't need to push documents here.
  }

  listData.push({ type: "timelineHeader" });
  if (timelineEvents.length > 0) {
    timelineEvents.forEach((event, index) =>
      listData.push({
        type: "timelineEvent",
        data: event,
        isLast: index === timelineEvents.length - 1,
        id: `tl-${event.id}`,
      })
    );
  } else {
    listData.push({ type: "noTimelineEvents" });
  }

  const getTranslatedPriority = (priority?: string) => {
    if (!priority) return 'N/A';
    switch (priority.toLowerCase()) {
      case 'high': return t('option_priority_high');
      case 'medium': return t('option_priority_medium');
      case 'low': return t('option_priority_low');
      default: return priority;
    }
  };

  const renderListItem = ({ item }: { item: ListItemType }) => {
    switch (item.type) {
      case "summary":
        if (!caseDetails) {
          return (
            <View style={styles.centered}>
              <ActivityIndicator size="large" />
            </View>
          );
        }
        return (
          <View style={styles.summarySection}>
            <Text style={styles.mainCaseTitle}>{caseDetails.CaseTitle}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={[styles.clientName, { marginBottom: 0 }]}>{t("casedetails_client_prefix")}{caseDetails.ClientName}</Text>
              {caseDetails.ClientContactNumber ? (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={handlePhoneCall} activeOpacity={0.85} style={{ padding: 8, backgroundColor: '#E0F2FE', borderRadius: 20, marginRight: 8 }}>
                    <Ionicons name="call" size={20} color="#0284C7" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleWhatsAppChat} activeOpacity={0.85} style={{ padding: 8, backgroundColor: '#DCFCE7', borderRadius: 20, marginRight: 8 }}>
                    <Ionicons name="logo-whatsapp" size={20} color="#15803D" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleOpenReminderModal} activeOpacity={0.85} style={{ padding: 8, backgroundColor: '#FEF3C7', borderRadius: 20 }}>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#D97706" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
            <StatusBadge status={caseDetails.CaseStatus} />
            <DateRow
              label={t("field_hearing_date")}
              dateString={formatDate(caseDetails.NextDate)}
              iconName="gavel"
            />
            <DateRow
              label={t("casedetails_prev_hearing")}
              dateString={formatDate(caseDetails.PreviousDate)}
              iconName="history"
            />
            <DateRow
              label={t("casedetails_last_update")}
              dateString={formatDate(caseDetails.updated_at)}
              iconName="update"
            />
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_case_number")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.case_number || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_case_year")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.case_year || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_court_name")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.court_name || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_case_type")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.case_type_name || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_cnr_number")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.CNRNumber || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_crime_number")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.crime_number || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_crime_year")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.crime_year || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_district")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.districtName || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_police_station")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.policeStationName || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_filed_date")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.dateFiled ? formatDate(new Date(caseDetails.dateFiled)) : 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_judge_name")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.JudgeName || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_on_behalf_of")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.OnBehalfOf || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_first_party")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.FirstParty || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_opposite_party")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.OppositeParty || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_accused")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.Accussed || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_under_section")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.Undersection || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_opposing_counsel")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.OpposingCounsel || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_client_contact")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.ClientContactNumber || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_statute_of_limitations")}:</Text>
                <Text style={styles.detailValue}>{caseDetails.StatuteOfLimitations ? formatDate(new Date(caseDetails.StatuteOfLimitations)) : 'N/A'}</Text>
              </View>
              {caseDetails.CaseStatus === "Closed" && caseDetails.ClosedDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("field_date_closed")}:</Text>
                  <Text style={styles.detailValue}>{formatDate(new Date(caseDetails.ClosedDate))}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("field_priority")}:</Text>
                <Text style={styles.detailValue}>{getTranslatedPriority(caseDetails.Priority)}</Text>
              </View>
            </View>
            <Text style={styles.detailLabel}>{t("field_case_description")}:</Text>
            <Text style={styles.detailValue}>{caseDetails.CaseDescription || 'N/A'}</Text>
            <Text style={styles.detailLabel}>{t("field_case_notes")}:</Text>
            <Text style={styles.detailValue}>{caseDetails.CaseNotes || 'N/A'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <View style={{ width: '48%' }}>
                <ActionButton
                  title={t("btn_edit_case")}
                  onPress={handleEditCase}
                  type="primary"
                />
              </View>
              <View style={{ width: '48%' }}>
                <ActionButton
                  title={t("btn_export_pdf")}
                  onPress={handleExportPdf}
                  type="secondary"
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <View style={{ width: '48%' }}>
                <ActionButton
                  title={t("btn_share_history")}
                  onPress={handleShareHistory}
                  type="secondary"
                />
              </View>
              <View style={{ width: '48%' }}>
                <ActionButton
                  title={t("btn_generate_document")}
                  onPress={handleGenerateDocument}
                  type="dashed"
                />
              </View>
            </View>
          </View>
        );
      case "documentsHeader":
        return (
          <View style={styles.documentsSection}>
            <SectionHeader title={t("casedetails_sec_documents")} />
            <DocumentUpload caseId={caseId} />
          </View>
        );
      case "timelineHeader":
        return (
          <View style={styles.timelineSection}>
            <SectionHeader title={t("casedetails_sec_timeline")} />
          </View>
        );
      case "timelineEvent":
        return <TimelineEventItem event={item.data} isLast={item.isLast} />;
      case "noTimelineEvents":
        return (
          <View style={styles.timelineSection}>
            <Text style={styles.noItemsText}>{t("casedetails_no_timeline")}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={listData}
        renderItem={renderListItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      />
      <Modal
        visible={showReminderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("reminder_modal_title")}</Text>
            <TextInput
              style={styles.reminderInput}
              multiline
              numberOfLines={6}
              value={customReminderText}
              onChangeText={setCustomReminderText}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#25D366' }]}
                onPress={handleSendReminderWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalButtonText}>{t("reminder_send_whatsapp")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#3B82F6' }]}
                onPress={handleSendReminderSMS}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalButtonText}>{t("reminder_send_sms")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6B7280' }]}
                onPress={handleCopyReminderToClipboard}
              >
                <Ionicons name="copy" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalButtonText}>{t("reminder_copy_clipboard")}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowReminderModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t("alert_cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Ensure content is not hidden by bottom actions
  },
  summarySection: {
    padding: 16,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mainCaseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: theme.colors.text,
  },
  clientName: {
    fontSize: 16,
    marginBottom: 12,
    color: theme.colors.text,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailRow: {
    width: '48%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  noItemsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    padding: 16,
  },
  documentsSection: {
    backgroundColor: theme.colors.background,
  },
  timelineSection: {
    backgroundColor: theme.colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  reminderInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalCloseButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default CaseDetailsScreen;
