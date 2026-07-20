// Screens/CaseDetailsScreen/CaseDetailsScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
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
  ScrollView,
  Animated as RNAnimated,
} from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";

import DateRow from "./components/DateRow";
import DocumentCard from "./components/DocumentCard";
import StatusBadge from "./components/StatusBadge";
import TimelineEventItem from "./components/TimelineEventItem";
import UpdateHearingPopup from "./components/UpdateHearingPopup";
import * as db from "../../DataBase";
import { getCaseTimelineEventsByCaseId, getCaseById } from "../../DataBase";
import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext, Theme } from "../../Providers/ThemeProvider";
import {
  CaseData,
  CaseDataScreen,
  Document,
  TimelineEvent,
} from "../../Types/appTypes";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { formatDate, getCurrentUserId } from "../../utils/commonFunctions";
import {
  exportCaseToPdf,
  exportCaseHistoryToPdf,
} from "../../utils/pdfExporter";
import DocumentUpload from "../Addcase/DocumentUpload";
import ActionButton from "../CommonComponents/ActionButton";
import { useAdTrigger } from "../CommonComponents/AdManager";
import SectionHeader from "../CommonComponents/SectionHeader";

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

const SkeletonItem: React.FC<{ style: any }> = ({ style }) => {
  const opacity = React.useRef(new RNAnimated.Value(0.4)).current;

  React.useEffect(() => {
    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: 0.85,
          duration: 650,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <RNAnimated.View
      style={[{ backgroundColor: "#E2E8F0", borderRadius: 8 }, style, { opacity }]}
    />
  );
};

const CaseDetailsSkeleton: React.FC<{ theme: Theme }> = ({ theme }) => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    style={{ flex: 1, backgroundColor: theme.colors.background }}
    contentContainerStyle={{ padding: 16 }}
  >
    {/* Skeleton Card 1: Case Spotlight */}
    <View
      style={{
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <SkeletonItem style={{ width: "65%", height: 22 }} />
        <SkeletonItem style={{ width: 60, height: 22, borderRadius: 12 }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
        <SkeletonItem style={{ width: "45%", height: 16 }} />
        <View style={{ flexDirection: "row", gap: 6 }}>
          <SkeletonItem style={{ width: 60, height: 18, borderRadius: 8 }} />
          <SkeletonItem style={{ width: 60, height: 18, borderRadius: 8 }} />
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: 12,
        }}
      >
        <SkeletonItem style={{ flex: 1, height: 40, borderRadius: 10 }} />
        <SkeletonItem style={{ flex: 1, height: 40, borderRadius: 10 }} />
        <SkeletonItem style={{ flex: 1, height: 40, borderRadius: 10 }} />
      </View>
    </View>

    {/* Skeleton Card 2: Hearing & Fee Spotlight */}
    <View
      style={{
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 16,
      }}
    >
      <SkeletonItem style={{ width: "55%", height: 18, marginBottom: 12 }} />
      <SkeletonItem style={{ width: "100%", height: 50, borderRadius: 12, marginBottom: 10 }} />
      <SkeletonItem style={{ width: "100%", height: 40, borderRadius: 10, marginBottom: 14 }} />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <SkeletonItem style={{ flex: 1, height: 44, borderRadius: 10 }} />
        <SkeletonItem style={{ flex: 1, height: 44, borderRadius: 10 }} />
        <SkeletonItem style={{ flex: 1, height: 44, borderRadius: 10 }} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <SkeletonItem style={{ flex: 1, height: 40, borderRadius: 10 }} />
        <SkeletonItem style={{ flex: 1, height: 40, borderRadius: 10 }} />
      </View>
    </View>

    {/* Skeleton Accordions */}
    {[1, 2, 3, 4].map((i) => (
      <View
        key={i}
        style={{
          backgroundColor: theme.colors.cardBackground,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: 12,
          padding: 14,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <SkeletonItem style={{ width: "50%", height: 18 }} />
        <SkeletonItem style={{ width: 22, height: 22, borderRadius: 11 }} />
      </View>
    ))}
  </ScrollView>
);

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
  const [showEditNotesModal, setShowEditNotesModal] = useState(false);
  const [editingTimelineEvent, setEditingTimelineEvent] = useState<TimelineEvent | null>(null);
  const [editedNotesText, setEditedNotesText] = useState("");

  // Fee, Hearing & Accordion States
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpdateHearingModal, setShowUpdateHearingModal] = useState(false);
  const [editingTotalFee, setEditingTotalFee] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Accordion Sections State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    court: true,       // Default expanded
    identifiers: false,
    parties: false,
    notes: false,
    documents: true,   // Default expanded
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ width: 220, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: theme.colors.text,
              textAlign: "center",
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {caseDetails?.CaseTitle || t("casedetails_header_title")}
          </Text>
        </View>
      ),
    });
  }, [navigation, caseDetails, t, theme]);

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

  const loadDocumentsAndTimeline = useCallback(
    async (currentCaseId: number) => {
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

        const fetchedTimelineEvents =
          await getCaseTimelineEventsByCaseId(currentCaseId);
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
    },
    []
  );

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

  const handleDeleteCase = () => {
    Alert.alert(
      t("casedetails_delete_title") || "Delete Case",
      t("casedetails_delete_confirm") ||
        "Are you sure you want to permanently delete this case? This action cannot be undone.",
      [
        { text: t("alert_cancel") || "Cancel", style: "cancel" },
        {
          text: t("casedetails_delete_btn") || "Delete",
          style: "destructive",
          onPress: async () => {
            if (!caseDetails?.id) return;
            try {
              await db.deleteCase(parseInt(caseDetails.id.toString(), 10));
              if (navigation.canGoBack()) navigation.goBack();
            } catch (error) {
              Alert.alert(
                t("alert_error") || "Error",
                "Failed to delete the case. Please try again."
              );
            }
          },
        },
      ]
    );
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
          await exportCaseToPdf(caseDetails, navigation);
        } catch (error) {
          Alert.alert(
            t("casedetails_export_failed"),
            t("casedetails_export_failed_desc")
          );
        }
      }
    });
  };

  const handleShareHistory = async () => {
    if (!caseDetails) return;
    await showAdWithPreload("rewarded", async (success) => {
      if (success) {
        try {
          await exportCaseHistoryToPdf(caseDetails as any, navigation);
        } catch (error) {
          Alert.alert(
            t("casedetails_export_failed"),
            t("casedetails_export_failed_desc")
          );
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
        const profile = await db.getUserProfile(
          dbInstance,
          parseInt(userId, 10)
        );
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
          Linking.openURL(
            `https://wa.me/${cleanNumber}?text=${encodeURIComponent(customReminderText)}`
          );
        }
      });
      setShowReminderModal(false);
    } else {
      Alert.alert(
        t("casedetails_no_contact"),
        t("casedetails_no_contact_desc")
      );
    }
  };

  const handleSendReminderSMS = () => {
    if (caseDetails?.ClientContactNumber) {
      const cleanNumber = caseDetails.ClientContactNumber.replace(/\D/g, "");
      const separator = Platform.OS === "ios" ? "&" : "?";
      Linking.openURL(
        `sms:${cleanNumber}${separator}body=${encodeURIComponent(customReminderText)}`
      );
      setShowReminderModal(false);
    } else {
      Alert.alert(
        t("casedetails_no_contact"),
        t("casedetails_no_contact_desc")
      );
    }
  };

  const handleCopyReminderToClipboard = () => {
    Clipboard.setString(customReminderText);
    Alert.alert(
      t("alert_success"),
      t("reminder_copy_success") || "Reminder text copied to clipboard!"
    );
    setShowReminderModal(false);
  };

  const handleEditTimelineNotes = (event: TimelineEvent) => {
    setEditingTimelineEvent(event);
    setEditedNotesText(event.description || "");
    setShowEditNotesModal(true);
  };

  const handleSaveTimelineNotes = async () => {
    if (!editingTimelineEvent) return;
    try {
      const eventId = parseInt(editingTimelineEvent.id.toString(), 10);
      if (isNaN(eventId)) {
        Alert.alert(t("alert_error"), "Invalid timeline event ID.");
        return;
      }
      const success = await db.updateCaseTimelineEvent(eventId, {
        notes: editedNotesText,
      });
      if (success) {
        Alert.alert(t("alert_success"), "Notes updated successfully.");
        if (caseId) {
          const caseIdToLoad = parseInt(caseId.toString(), 10);
          await loadDocumentsAndTimeline(caseIdToLoad);
        }
        setShowEditNotesModal(false);
        setEditingTimelineEvent(null);
        setEditedNotesText("");
      } else {
        Alert.alert(t("alert_error"), "Failed to update notes.");
      }
    } catch (error) {
      console.error("Error updating timeline event notes:", error);
      Alert.alert(t("alert_error"), "Failed to update notes due to database error.");
    }
  };

  const handleSaveTotalFee = async () => {
    if (!caseDetails || !caseDetails.id) return;
    const caseIdToUpdate = parseInt(caseDetails.id.toString(), 10);
    const newTotalFee = editingTotalFee.trim() ? parseFloat(editingTotalFee.trim()) : 0;
    try {
      await db.updateCase(caseIdToUpdate, { total_fee: newTotalFee });
      setShowFeeModal(false);
      await loadCaseDetails(caseIdToUpdate);
      Alert.alert(t("alert_success"), "Total agreed fee updated successfully.");
    } catch (e) {
      console.error("Failed to update total fee:", e);
      Alert.alert(t("alert_error"), "Failed to update total fee.");
    }
  };

  const handleRecordPayment = async () => {
    if (!caseDetails || !caseDetails.id) return;
    const caseIdToUpdate = parseInt(caseDetails.id.toString(), 10);
    const amount = paymentAmount.trim() ? parseFloat(paymentAmount.trim()) : 0;
    if (amount <= 0) {
      Alert.alert(t("alert_warning"), "Please enter a valid payment amount.");
      return;
    }
    try {
      const updatedFeePaid = (caseDetails.fee_paid || 0) + amount;
      await db.updateCase(caseIdToUpdate, { fee_paid: updatedFeePaid });
      const noteStr = paymentNote.trim() ? ` [${paymentNote.trim()}]` : "";
      await db.addCaseTimelineEvent({
        case_id: caseIdToUpdate,
        hearing_date: new Date().toISOString(),
        notes: `Fee Payment Received: ₹${amount.toLocaleString('en-IN')}${noteStr}`,
      });
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentNote("");
      await loadCaseDetails(caseIdToUpdate);
      await loadDocumentsAndTimeline(caseIdToUpdate);
      Alert.alert(t("alert_success"), `Payment of ₹${amount.toLocaleString('en-IN')} recorded successfully.`);
    } catch (e) {
      console.error("Failed to record payment:", e);
      Alert.alert(t("alert_error"), "Failed to record payment.");
    }
  };

  const getRelativeHearingTag = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hearingDate = new Date(dateStr);
      hearingDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((hearingDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 0) return { label: "TODAY", bg: "#DCFCE7", text: "#15803D" };
      if (diffDays === 1) return { label: "TOMORROW", bg: "#FEF3C7", text: "#D97706" };
      if (diffDays > 1) return { label: `IN ${diffDays} DAYS`, bg: "#E0F2FE", text: "#0284C7" };
      return { label: `${Math.abs(diffDays)} DAYS AGO`, bg: "#FEE2E2", text: "#B91C1C" };
    } catch (e) {
      return null;
    }
  };

  const handleSaveHearingUpdate = async (notes: string, nextHearingDate: Date, feeReceivedToday?: number) => {
    if (!caseDetails || !caseDetails.id) return;
    const caseIdToUpdate = parseInt(caseDetails.id.toString(), 10);
    try {
      const uId = await getCurrentUserId();
      const caseExists = await db.getCaseById(caseIdToUpdate);
      if (!caseExists) return;

      const feeNote = feeReceivedToday && feeReceivedToday > 0 
        ? ` [Fee Received: ₹${feeReceivedToday.toLocaleString('en-IN')}]` 
        : "";
      const finalNotes = (notes || "") + feeNote;

      await db.addCaseTimelineEvent({
        case_id: caseIdToUpdate,
        hearing_date: new Date().toISOString(),
        notes: finalNotes.trim(),
      });

      const year = nextHearingDate.getFullYear();
      const month = String(nextHearingDate.getMonth() + 1).padStart(2, "0");
      const day = String(nextHearingDate.getDate()).padStart(2, "0");
      const formattedNextDate = `${year}-${month}-${day}`;

      const updatedFeePaid = (caseDetails.fee_paid || 0) + (feeReceivedToday || 0);
      await db.updateCase(caseIdToUpdate, {
        NextDate: formattedNextDate,
        ...(feeReceivedToday && feeReceivedToday > 0 ? { fee_paid: updatedFeePaid } : {}),
      }, uId);

      setShowUpdateHearingModal(false);
      await loadCaseDetails(caseIdToUpdate);
      await loadDocumentsAndTimeline(caseIdToUpdate);
      Alert.alert(t("alert_success"), "Hearing date updated successfully.");
    } catch (e) {
      console.error("Failed to update hearing date:", e);
      Alert.alert(t("alert_error"), "Failed to update hearing date.");
    }
  };

  const handleGenerateDocument = () => {
    if (!caseDetails) return;
    // @ts-ignore
    navigation.navigate("GenerateDocument", {
      caseId: parseInt(caseDetails.id, 10),
    });
  };

  const handlePhoneCall = () => {
    if (caseDetails?.ClientContactNumber) {
      Linking.openURL(`tel:${caseDetails.ClientContactNumber}`);
    } else {
      Alert.alert(
        t("casedetails_no_contact"),
        t("casedetails_no_contact_desc")
      );
    }
  };

  const handleWhatsAppChat = () => {
    if (caseDetails?.ClientContactNumber) {
      const cleanNumber = caseDetails.ClientContactNumber.replace(/\D/g, "");
      Linking.openURL(`https://wa.me/${cleanNumber}`);
    } else {
      Alert.alert(
        t("casedetails_no_contact"),
        t("casedetails_no_contact_desc")
      );
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
        Alert.alert(
          t("alert_error"),
          t("casedetails_file_not_found") + localDocumentPath
        );
        return;
      }
      const isPdf =
        doc.fileType === "application/pdf" ||
        doc.fileName.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        Alert.alert(
          doc.fileName || "Document",
          "Choose how to open this PDF:",
          [
            {
              text: "Open in App",
              onPress: () => {
                // @ts-ignore
                navigation.navigate("PdfViewer", {
                  pdfUri: localDocumentPath,
                  title: doc.fileName,
                });
              },
            },
            {
              text: "Open Externally / Share",
              onPress: async () => {
                if (Platform.OS === "android") {
                  const contentUri =
                    await FileSystem.getContentUriAsync(localDocumentPath);
                  await IntentLauncher.startActivityAsync(
                    "android.intent.action.VIEW",
                    {
                      data: contentUri,
                      flags: 1,
                      type: doc.fileType || "application/pdf",
                    }
                  );
                } else if (Platform.OS === "ios") {
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(localDocumentPath, {
                      mimeType: doc.fileType || undefined,
                      dialogTitle: `${t("casedetails_open_doc")} ${doc.fileName}`,
                      UTI: doc.fileType || undefined,
                    });
                  }
                }
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      } else {
        if (Platform.OS === "android") {
          const contentUri =
            await FileSystem.getContentUriAsync(localDocumentPath);
          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              flags: 1,
              type: doc.fileType || "*/*",
            }
          );
        } else if (Platform.OS === "ios") {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(localDocumentPath, {
              mimeType: doc.fileType || undefined,
              dialogTitle: `${t("casedetails_open_doc")} ${doc.fileName}`,
              UTI: doc.fileType || undefined,
            });
          } else {
            Alert.alert(
              t("alert_warning"),
              t("casedetails_sharing_unavailable")
            );
          }
        } else {
          Alert.alert(
            t("casedetails_open_doc"),
            `${t("casedetails_open_manually")}${localDocumentPath}`
          );
        }
      }
    } catch (error: any) {
      console.error("Error opening document:", error);
      Alert.alert(
        t("casedetails_err_open_file"),
        error.message || t("alert_error")
      );
    }
  };

  const handleShareDocument = async (doc: Document) => {
    if (!doc.stored_filename) return;
    const localPath = db.getFullDocumentPath(doc.stored_filename);
    if (localPath && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(localPath);
    } else {
      Alert.alert(t("alert_warning"), "Sharing unavailable for this document.");
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete ${doc.fileName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (doc.id) {
                await db.deleteDocument(parseInt(doc.id.toString(), 10));
                if (caseId) loadDocumentsAndTimeline(caseId);
              }
            } catch (err) {
              Alert.alert(t("alert_error"), "Failed to delete document.");
            }
          },
        },
      ]
    );
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
    if (!priority) return "N/A";
    switch (priority.toLowerCase()) {
      case "high":
        return t("option_priority_high");
      case "medium":
        return t("option_priority_medium");
      case "low":
        return t("option_priority_low");
      default:
        return priority;
    }
  };

  const renderListItem = ({ item }: { item: ListItemType }) => {
    switch (item.type) {
      case "summary":
        if (!caseDetails || isLoading) {
          return <CaseDetailsSkeleton theme={theme} />;
        }
        const relTag = getRelativeHearingTag(caseDetails.NextDate);
        const totFee = caseDetails.total_fee || 0;
        const pdFee = caseDetails.fee_paid || 0;
        const balFee = Math.max(0, totFee - pdFee);
        const pctPaid = totFee > 0 ? Math.min(100, Math.round((pdFee / totFee) * 100)) : 0;

        return (
          <View style={{ padding: 16, backgroundColor: theme.colors.background }}>
            {/* CARD 1: HERO CASE & CLIENT SPOTLIGHT (STRICT GEOMETRIC ALIGNMENT) */}
            <Animated.View entering={FadeInDown.duration(400)} style={{
              backgroundColor: theme.colors.cardBackground,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              {/* ROW 1: Case Title & Status Badge (Geometrically Aligned Header) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: theme.colors.text, lineHeight: 26 }} numberOfLines={2}>
                    {caseDetails.CaseTitle}
                  </Text>
                </View>
                <View style={{ marginTop: 2 }}>
                  <StatusBadge status={caseDetails.CaseStatus} />
                </View>
              </View>

              {/* ROW 2: Client Name & Stage/Priority Badges (Strict Horizontal Line) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                  <Ionicons name="person-circle" size={22} color={theme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }} numberOfLines={1}>
                    {t("casedetails_client_prefix")}{caseDetails.ClientName}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {caseDetails.case_stage ? (
                    <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#C7D2FE' }}>
                      <Text style={{ color: '#4F46E5', fontWeight: '700', fontSize: 11 }}>{caseDetails.case_stage}</Text>
                    </View>
                  ) : null}
                  {caseDetails.Priority ? (
                    <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5' }}>
                      <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 11 }}>{getTranslatedPriority(caseDetails.Priority)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* ROW 3: CLIENT QUICK CONTACT GRID (ALWAYS VISIBLE - 3 EQUAL 1/3-WIDTH COLUMNS) */}
              <View style={{ flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 }}>
                <TouchableOpacity
                  onPress={handlePhoneCall}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 40,
                    backgroundColor: caseDetails.ClientContactNumber ? '#E0F2FE' : '#F3F4F6',
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: caseDetails.ClientContactNumber ? '#BAE6FD' : '#E5E7EB',
                  }}
                >
                  <Ionicons name="call" size={15} color={caseDetails.ClientContactNumber ? '#0284C7' : '#9CA3AF'} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: caseDetails.ClientContactNumber ? '#0284C7' : '#6B7280' }}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleWhatsAppChat}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 40,
                    backgroundColor: caseDetails.ClientContactNumber ? '#DCFCE7' : '#F3F4F6',
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: caseDetails.ClientContactNumber ? '#BBF7D0' : '#E5E7EB',
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={15} color={caseDetails.ClientContactNumber ? '#15803D' : '#9CA3AF'} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: caseDetails.ClientContactNumber ? '#15803D' : '#6B7280' }}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOpenReminderModal}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 40,
                    backgroundColor: '#FEF3C7',
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#FDE68A',
                  }}
                >
                  <Ionicons name="chatbubble-ellipses" size={15} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#D97706' }}>Reminder</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* CARD 2: NEXT HEARING & RETAINER FINANCIAL DASHBOARD */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{
              backgroundColor: theme.colors.cardBackground,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 16,
            }}>
              {/* HEARING SPOTLIGHT SECTION */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text }}>Next Hearing Spotlight</Text>
                  </View>
                  {relTag && (
                    <View style={{ backgroundColor: relTag.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: relTag.text }}>{relTag.label}</Text>
                    </View>
                  )}
                </View>

                <View style={{ backgroundColor: theme.colors.card || '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 }}>Hearing Date</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>{formatDate(caseDetails.NextDate)}</Text>
                  {caseDetails.PreviousDate && (
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
                      Previous Hearing: {formatDate(caseDetails.PreviousDate)}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => setShowUpdateHearingModal(true)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: theme.colors.primary,
                    paddingVertical: 12,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Update Next Hearing Date</Text>
                </TouchableOpacity>
              </View>

              {/* RETAINER FEE SECTION */}
              <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="wallet-outline" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text }}>Fee & Retainer Hub</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1, backgroundColor: theme.colors.card || '#F8FAFC', padding: 10, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Agreed Fee</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginTop: 2 }}>₹{totFee.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, color: '#166534' }}>Collected</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#16A34A', marginTop: 2 }}>₹{pdFee.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: balFee > 0 ? '#FEF2F2' : '#F0FDF4', padding: 10, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, color: balFee > 0 ? '#991B1B' : '#166534' }}>Balance</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: balFee > 0 ? '#DC2626' : '#16A34A', marginTop: 2 }}>₹{balFee.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {totFee > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ height: 6, width: '100%', backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${pctPaid}%`, backgroundColor: '#16A34A' }} />
                    </View>
                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary, textAlign: 'right', marginTop: 4 }}>
                      {pctPaid}% Paid ({balFee > 0 ? `₹${balFee.toLocaleString('en-IN')} pending` : 'Fully settled'})
                    </Text>
                  </View>
                )}

                {/* 2 EQUAL-WIDTH ACTION BUTTONS */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowPaymentModal(true)}
                    activeOpacity={0.85}
                    style={{ flex: 1, backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>Record Payment</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setEditingTotalFee(caseDetails.total_fee != null ? String(caseDetails.total_fee) : "");
                      setShowFeeModal(true);
                    }}
                    activeOpacity={0.85}
                    style={{ flex: 1, backgroundColor: '#EEF2FF', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' }}
                  >
                    <Ionicons name="create-outline" size={18} color="#4F46E5" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#4F46E5' }}>Edit Fee</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* 4. EXPANDABLE ACCORDIONS (INLINE ON SCREEN) */}

            {/* Accordion 1: Court & Jurisdiction (Default Expanded) */}
            <View style={{
              backgroundColor: theme.colors.cardBackground,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 12,
              overflow: "hidden",
            }}>
              <TouchableOpacity
                onPress={() => toggleSection('court')}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor: theme.colors.card || "#F8FAFC",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons name="business-outline" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>Court & Jurisdiction</Text>
                  <View style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#4F46E5" }}>6 Details</Text>
                  </View>
                </View>
                <Ionicons
                  name={expandedSections.court ? "chevron-up-circle" : "chevron-down-circle"}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.court && (
                <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                  <View style={{ gap: 10 }}>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Court Name</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.court_name || "N/A"}</Text>
                    </View>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Judge Name</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.JudgeName || "N/A"}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1, backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>District</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.districtName || "N/A"}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Police Station</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.policeStationName || "N/A"}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1, backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Date Filed</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>
                          {caseDetails.dateFiled ? formatDate(new Date(caseDetails.dateFiled)) : "N/A"}
                        </Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Statute of Limitations</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>
                          {caseDetails.StatuteOfLimitations ? formatDate(new Date(caseDetails.StatuteOfLimitations)) : "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Accordion 2: Case Identifiers & Sections */}
            <View style={{
              backgroundColor: theme.colors.cardBackground,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 12,
              overflow: "hidden",
            }}>
              <TouchableOpacity
                onPress={() => toggleSection('identifiers')}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor: theme.colors.card || "#F8FAFC",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons name="journal-outline" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>Case Numbers & Sections</Text>
                </View>
                <Ionicons
                  name={expandedSections.identifiers ? "chevron-up-circle" : "chevron-down-circle"}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.identifiers && (
                <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                  <View style={{ gap: 10 }}>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>CNR Number</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginTop: 2 }}>{caseDetails.CNRNumber || "N/A"}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1, backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Case Number</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.case_number || "N/A"}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Case Year</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.case_year || "N/A"}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Session / Trial Number</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.session_trial_number || "N/A"}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1, backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Crime Number</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.crime_number || "N/A"}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Crime Year</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.crime_year || "N/A"}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Under Section / IPC / CrPC</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.Undersection || "N/A"}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Accordion 3: Parties & Representation */}
            <View style={{
              backgroundColor: theme.colors.cardBackground,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 12,
              overflow: "hidden",
            }}>
              <TouchableOpacity
                onPress={() => toggleSection('parties')}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor: theme.colors.card || "#F8FAFC",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons name="people-outline" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>Parties & Advocates</Text>
                </View>
                <Ionicons
                  name={expandedSections.parties ? "chevron-up-circle" : "chevron-down-circle"}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.parties && (
                <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                  <View style={{ gap: 10 }}>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Petitioner / First Party</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.FirstParty || "N/A"}</Text>
                    </View>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Respondent / Opposite Party</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.OppositeParty || "N/A"}</Text>
                    </View>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Accused Name</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.Accussed || "N/A"}</Text>
                    </View>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>On Behalf Of</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.OnBehalfOf || "N/A"}</Text>
                    </View>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Opposing Counsel / Advocate</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.OpposingCounsel || caseDetails.OppositeAdvocate || "N/A"}</Text>
                    </View>
                    {caseDetails.OppAdvocateContactNumber ? (
                      <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>Opp. Advocate Contact</Text>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 }}>{caseDetails.OppAdvocateContactNumber}</Text>
                        </View>
                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${caseDetails.OppAdvocateContactNumber}`)} style={{ backgroundColor: '#E0F2FE', padding: 8, borderRadius: 20 }}>
                          <Ionicons name="call" size={18} color="#0284C7" />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
            </View>

            {/* Accordion 4: Case Notes & Description */}
            <View style={{
              backgroundColor: theme.colors.cardBackground,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 16,
              overflow: "hidden",
            }}>
              <TouchableOpacity
                onPress={() => toggleSection('notes')}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor: theme.colors.card || "#F8FAFC",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons name="reader-outline" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>Case Notes & Description</Text>
                </View>
                <Ionicons
                  name={expandedSections.notes ? "chevron-up-circle" : "chevron-down-circle"}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.notes && (
                <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                  <View style={{ gap: 10 }}>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4 }}>Case Description</Text>
                      <Text style={{ fontSize: 13, color: theme.colors.text, lineHeight: 18 }}>{caseDetails.CaseDescription || "N/A"}</Text>
                    </View>
                    <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4 }}>Internal Case Notes</Text>
                      <Text style={{ fontSize: 13, color: theme.colors.text, lineHeight: 18 }}>{caseDetails.CaseNotes || "N/A"}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* ACCORDION 5: DOCUMENTS & ATTACHMENTS */}
            <View style={{
              backgroundColor: theme.colors.cardBackground,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 16,
              overflow: "hidden",
            }}>
              <TouchableOpacity
                onPress={() => toggleSection('documents')}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor: theme.colors.card || "#F8FAFC",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons name="folder-open-outline" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>Documents & Attachments</Text>
                  <View style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#4F46E5" }}>{documents.length} Files</Text>
                  </View>
                </View>
                <Ionicons
                  name={expandedSections.documents ? "chevron-up-circle" : "chevron-down-circle"}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.documents && (
                <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                  {/* Upload Dropzone */}
                  <DocumentUpload
                    caseId={caseId}
                    onDocumentUploaded={() => caseId && loadDocumentsAndTimeline(caseId)}
                  />

                  {/* ATTACHED DOCUMENTS LIST (DocHub Template Card Style) */}
                  <View style={{ marginTop: 14 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 10, letterSpacing: 0.5 }}>
                      ATTACHED DOCUMENTS ({documents.length})
                    </Text>

                    {documents.length === 0 ? (
                      <View style={{ backgroundColor: theme.colors.card || '#F9FAFB', padding: 14, borderRadius: 10, alignItems: 'center' }}>
                        <Ionicons name="document-text-outline" size={24} color={theme.colors.textSecondary} style={{ marginBottom: 4 }} />
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>No documents attached yet.</Text>
                      </View>
                    ) : (
                      documents.map((doc) => {
                        const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf');
                        const isImg = doc.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
                        return (
                          <View
                            key={doc.id}
                            style={{
                              backgroundColor: theme.colors.card || '#F8FAFC',
                              borderRadius: 12,
                              padding: 12,
                              marginBottom: 10,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                              <View style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                backgroundColor: isPdf ? '#FEF2F2' : isImg ? '#F0FDF4' : '#EEF2FF',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 10,
                              }}>
                                <Ionicons
                                  name={isPdf ? "document-text" : isImg ? "image" : "document"}
                                  size={18}
                                  color={isPdf ? "#DC2626" : isImg ? "#16A34A" : "#4F46E5"}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }} numberOfLines={1}>
                                  {doc.fileName || "Document"}
                                </Text>
                                <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
                                  {doc.uploaded_at ? formatDate(new Date(doc.uploaded_at)) : 'Recently attached'}
                                </Text>
                              </View>
                            </View>

                            {/* DOCUMENT QUICK ACTION TRIPLETS (OPEN, SHARE, DELETE) */}
                            <View style={{ flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10 }}>
                              <TouchableOpacity
                                onPress={() => handleDocumentInteraction(doc)}
                                activeOpacity={0.8}
                                style={{ flex: 1, backgroundColor: '#EEF2FF', paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Ionicons name="eye-outline" size={14} color="#4F46E5" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#4F46E5' }}>Open</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleShareDocument(doc)}
                                activeOpacity={0.8}
                                style={{ flex: 1, backgroundColor: '#DCFCE7', paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Ionicons name="share-outline" size={14} color="#15803D" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803D' }}>Share</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleDeleteDocument(doc)}
                                activeOpacity={0.8}
                                style={{ flex: 1, backgroundColor: '#FEF2F2', paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Ionicons name="trash-outline" size={14} color="#DC2626" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* CARD 3: CASE MANAGEMENT ACTIONS HUB */}
            <View style={{
              backgroundColor: theme.colors.cardBackground,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 16,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <Ionicons name="settings-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text }}>Case Management Actions</Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={handleEditCase}
                  activeOpacity={0.8}
                  style={{ flex: 1, backgroundColor: '#EEF2FF', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' }}
                >
                  <Ionicons name="create-outline" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#4F46E5' }}>Edit Case</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleExportPdf}
                  activeOpacity={0.8}
                  style={{ flex: 1, backgroundColor: '#E0F2FE', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BAE6FD' }}
                >
                  <Ionicons name="document-text-outline" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0284C7' }}>Export PDF</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={handleShareHistory}
                  activeOpacity={0.8}
                  style={{ flex: 1, backgroundColor: '#DCFCE7', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BBF7D0' }}
                >
                  <Ionicons name="share-social-outline" size={16} color="#15803D" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}>Share History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGenerateDocument}
                  activeOpacity={0.8}
                  style={{ flex: 1, backgroundColor: '#F3E8FF', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E9D5FF' }}
                >
                  <Ionicons name="sparkles-outline" size={16} color="#7E22CE" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#7E22CE' }}>Generate Court Document</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleDeleteCase}
                activeOpacity={0.8}
                style={{ backgroundColor: '#FEF2F2', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FCA5A5' }}
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>Delete Case Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case "documentsHeader":
        return null;
      case "timelineHeader":
        return (
          <View style={styles.timelineSection}>
            <SectionHeader title={t("casedetails_sec_timeline")} />
          </View>
        );
      case "timelineEvent":
        return (
          <TimelineEventItem
            event={item.data}
            isLast={item.isLast}
            onEditNotes={handleEditTimelineNotes}
          />
        );
      case "noTimelineEvents":
        return (
          <View style={styles.timelineSection}>
            <Text style={styles.noItemsText}>
              {t("casedetails_no_timeline")}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading || !caseDetails) {
    return <CaseDetailsSkeleton theme={theme} />;
  }

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
        transparent
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
              <ActionButton
                title={t("reminder_send_whatsapp")}
                onPress={handleSendReminderWhatsApp}
                leftIcon={
                  <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                }
                style={{ backgroundColor: "#25D366", marginVertical: 4 }}
                textStyle={{ color: "#FFF" }}
              />

              <ActionButton
                title={t("reminder_send_sms")}
                onPress={handleSendReminderSMS}
                leftIcon={
                  <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
                }
                style={{ backgroundColor: "#3B82F6", marginVertical: 4 }}
                textStyle={{ color: "#FFF" }}
              />

              <ActionButton
                title={t("reminder_copy_clipboard")}
                onPress={handleCopyReminderToClipboard}
                leftIcon={<Ionicons name="copy" size={18} color="#FFF" />}
                style={{ backgroundColor: "#6B7280", marginVertical: 4 }}
                textStyle={{ color: "#FFF" }}
              />
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowReminderModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>
                {t("alert_cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal for editing timeline event notes */}
      <Modal
        visible={showEditNotesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Notes for Past Date</Text>
            <TextInput
              style={styles.reminderInput}
              multiline
              numberOfLines={6}
              value={editedNotesText}
              onChangeText={setEditedNotesText}
              placeholder="Add details about what happened during this hearing..."
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("alert_cancel") || "Cancel"}
                  onPress={() => {
                    setShowEditNotesModal(false);
                    setEditingTimelineEvent(null);
                    setEditedNotesText("");
                  }}
                  type="secondary"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("btn_save_changes") || "Save"}
                  onPress={handleSaveTimelineNotes}
                  type="primary"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Total Fee Modal */}
      <Modal
        visible={showFeeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Total Agreed Fee</Text>
            <TextInput
              style={[styles.reminderInput, { minHeight: 48, height: 48, marginBottom: 16 }]}
              keyboardType="numeric"
              value={editingTotalFee}
              onChangeText={setEditingTotalFee}
              placeholder="Enter Total Agreed Fee (₹)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("alert_cancel") || "Cancel"}
                  onPress={() => setShowFeeModal(false)}
                  type="secondary"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("btn_save_changes") || "Save"}
                  onPress={handleSaveTotalFee}
                  type="primary"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Fee Payment</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[1000, 2000, 5000, 10000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setPaymentAmount(String(amt))}
                  style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>+ ₹{amt.toLocaleString('en-IN')}</Text>
                </TouchableOpacity>
              ))}
              {caseDetails && (caseDetails.total_fee || 0) > (caseDetails.fee_paid || 0) && (
                <TouchableOpacity
                  onPress={() => setPaymentAmount(String((caseDetails.total_fee || 0) - (caseDetails.fee_paid || 0)))}
                  style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803D' }}>
                    Full Balance (₹{((caseDetails.total_fee || 0) - (caseDetails.fee_paid || 0)).toLocaleString('en-IN')})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[styles.reminderInput, { minHeight: 48, height: 48, marginBottom: 12 }]}
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="Amount Received (₹)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={[styles.reminderInput, { minHeight: 44, height: 44, marginBottom: 16 }]}
              value={paymentNote}
              onChangeText={setPaymentNote}
              placeholder="Payment Note (e.g. Cash / GPay / Advance)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("alert_cancel") || "Cancel"}
                  onPress={() => setShowPaymentModal(false)}
                  type="secondary"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title="Record Payment"
                  onPress={handleRecordPayment}
                  type="primary"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Hearing Popup */}
      <UpdateHearingPopup
        visible={showUpdateHearingModal}
        onClose={() => setShowUpdateHearingModal(false)}
        onSave={handleSaveHearingUpdate}
      />
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
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
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    detailRow: {
      width: "48%",
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: "bold",
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
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      width: "100%",
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: "center",
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
      textAlignVertical: "top",
      marginBottom: 16,
    },
    modalButtonContainer: {
      flexDirection: "column",
      gap: 10,
      marginBottom: 16,
    },
    modalButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 8,
      width: "100%",
    },
    modalButtonText: {
      color: "#FFF",
      fontSize: 15,
      fontWeight: "bold",
    },
    modalCloseButton: {
      paddingVertical: 12,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    modalCloseButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      fontWeight: "500",
    },
  });

export default CaseDetailsScreen;
