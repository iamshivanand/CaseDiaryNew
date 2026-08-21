// Screens/CaseDetailsScreen/CaseDetailsScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
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
  LayoutAnimation,
  UIManager,
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
import { shareNamedPdf } from "../../utils/fileShareHelper";
import { sendFeeReminderWhatsApp } from "../../utils/whatsappNotifier";
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

const SkeletonItem: React.FC<{ style: any; theme?: Theme }> = ({
  style,
  theme,
}) => {
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
      style={[
        {
          backgroundColor: theme?.isDark ? "#334155" : "#E2E8F0",
          borderRadius: 8,
        },
        style,
        { opacity },
      ]}
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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <SkeletonItem style={{ width: "65%", height: 22 }} />
        <SkeletonItem style={{ width: 60, height: 22, borderRadius: 12 }} />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
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
      <SkeletonItem
        style={{
          width: "100%",
          height: 50,
          borderRadius: 12,
          marginBottom: 10,
        }}
      />
      <SkeletonItem
        style={{
          width: "100%",
          height: 40,
          borderRadius: 10,
          marginBottom: 14,
        }}
      />
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
  const [editingTimelineEvent, setEditingTimelineEvent] =
    useState<TimelineEvent | null>(null);
  const [editedNotesText, setEditedNotesText] = useState("");

  // Fee, Hearing & Accordion States
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false);
  const [showUpdateHearingModal, setShowUpdateHearingModal] = useState(false);
  const [editingTotalFee, setEditingTotalFee] = useState("");
  const [editingRecordedPayment, setEditingRecordedPayment] = useState("");
  const [editingRecordedPaymentNote, setEditingRecordedPaymentNote] =
    useState("");
  const [editingTimelinePaymentAmount, setEditingTimelinePaymentAmount] =
    useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Timeline Filter States
  const [timelineCategory, setTimelineCategory] = useState<
    "all" | "case_updates" | "payments"
  >("all");
  const [timelineSubFilter, setTimelineSubFilter] = useState<
    "all_updates" | "hearings" | "status" | "judge_court" | "stage"
  >("all_updates");

  // Date Fee Specific States
  const [showDateFeeModal, setShowDateFeeModal] = useState(false);
  const [editingDateFeeAmount, setEditingDateFeeAmount] = useState("");
  const [showDateFeePaymentModal, setShowDateFeePaymentModal] = useState(false);
  const [editingDateFeePaymentAmount, setEditingDateFeePaymentAmount] =
    useState("");
  const [editingDateFeePaymentNote, setEditingDateFeePaymentNote] =
    useState("");

  // Accordion Sections State
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    court: true, // Default expanded
    identifiers: false,
    parties: false,
    notes: false,
    documents: true, // Default expanded
  });

  const toggleSection = (sectionKey: string) => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
        const [fetchedDocs, fetchedTimelineEvents] = await Promise.all([
          db.getCaseDocuments(currentCaseId),
          getCaseTimelineEventsByCaseId(currentCaseId),
        ]);
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

        setTimelineEvents(
          fetchedTimelineEvents.map((tle) => ({
            id: tle.id.toString(),
            date: tle.hearing_date,
            description: tle.notes,
            event_type: (tle.event_type || "hearing_proceeding") as TimelineEventType,
            amount: tle.amount,
            payment_mode: tle.payment_mode,
            created_at: tle.created_at,
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

  useFocusEffect(
    useCallback(() => {
      if (!caseId) return;
      const caseIdToLoad = parseInt(caseId.toString(), 10);
      if (!caseIdToLoad || isNaN(caseIdToLoad)) {
        Alert.alert(t("alert_error"), t("casedetails_err_no_id"));
        setIsLoading(false);
        if (navigation.canGoBack()) navigation.goBack();
        return;
      }

      let isActive = true;
      const fetchAllData = async () => {
        setIsLoading(true);
        try {
          await Promise.all([
            loadCaseDetails(caseIdToLoad),
            loadDocumentsAndTimeline(caseIdToLoad),
          ]);
        } catch (error) {
          console.error("Error fetching case details:", error);
          Alert.alert(t("alert_error"), t("casedetails_err_load"));
          if (navigation.canGoBack()) navigation.goBack();
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      fetchAllData();

      return () => {
        isActive = false;
      };
    }, [caseId, navigation, loadDocumentsAndTimeline, loadCaseDetails, t])
  );

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
    const text = event.description || "";
    const isDateFeeAgreed =
      event.event_type === "date_fee_agreed" ||
      text.includes("Date Hearing Fee Agreed");
    const isDateFeePayment =
      event.event_type === "date_fee_payment" || text.includes("(Date Fee)");
    const isTotalFeePayment =
      event.event_type === "total_fee_payment" ||
      text.includes("(Total Retainer)");
    const isPayment =
      isDateFeePayment ||
      isTotalFeePayment ||
      isDateFeeAgreed ||
      Boolean(
        text.match(/(Fee Payment Received|Recorded Payment|Fee Received)/i)
      );

    if (isPayment) {
      const amtMatch = text.match(/₹\s*([\d,]+)/);
      const extractedAmt = amtMatch
        ? amtMatch[1].replace(/,/g, "")
        : event.amount != null
          ? String(event.amount)
          : "";
      setEditingTimelinePaymentAmount(extractedAmt);
      const noteMatch = text.match(/\[(.*?)\]/) || text.match(/\s+-\s+(.*)$/);
      setEditedNotesText(
        noteMatch ? noteMatch[1].replace(/\(Edited\)/g, "").trim() : ""
      );
    } else {
      setEditingTimelinePaymentAmount("");
      setEditedNotesText(text.replace(/\(Edited\)/g, "").trim());
    }
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

      const origText = editingTimelineEvent.description || "";
      const isDateFeeAgreed =
        editingTimelineEvent.event_type === "date_fee_agreed" ||
        origText.includes("Date Hearing Fee Agreed");
      const isDateFeePayment =
        editingTimelineEvent.event_type === "date_fee_payment" ||
        origText.includes("(Date Fee)");
      const isTotalFeePayment =
        editingTimelineEvent.event_type === "total_fee_payment" ||
        origText.includes("(Total Retainer)");
      const isPayment =
        isDateFeePayment ||
        isTotalFeePayment ||
        isDateFeeAgreed ||
        Boolean(
          origText.match(
            /(Fee Payment Received|Recorded Payment|Fee Received)/i
          )
        );

      let finalNotes = editedNotesText;
      let newAmount: number | undefined = undefined;

      if (isPayment) {
        newAmount = editingTimelinePaymentAmount.trim()
          ? parseFloat(editingTimelinePaymentAmount.trim())
          : 0;
        const notePart = editedNotesText.trim()
          ? ` [${editedNotesText.trim()}]`
          : "";

        if (isDateFeeAgreed) {
          finalNotes = `Date Hearing Fee Agreed: ₹${newAmount.toLocaleString("en-IN")}${notePart}`;
        } else if (isDateFeePayment) {
          finalNotes = `Fee Payment Received (Date Fee): ₹${newAmount.toLocaleString("en-IN")}${notePart}`;
        } else if (isTotalFeePayment) {
          finalNotes = `Fee Payment Received (Total Retainer): ₹${newAmount.toLocaleString("en-IN")}${notePart}`;
        } else {
          finalNotes = `Fee Payment Received: ₹${newAmount.toLocaleString("en-IN")}${notePart}`;
        }
      }

      const success = await db.updateCaseTimelineEvent(eventId, {
        notes: finalNotes,
        ...(newAmount !== undefined ? { amount: newAmount } : {}),
      });

      if (success) {
        if (caseId) {
          const caseIdToLoad = parseInt(caseId.toString(), 10);

          const allEvents =
            await db.getCaseTimelineEventsByCaseId(caseIdToLoad);

          let recalculatedTotalFeePaid = 0;
          let recalculatedDateFeeCollected = 0;
          let recalculatedDateFeeAgreed: number | null = null;

          allEvents.forEach((ev) => {
            const evId = parseInt(ev.id.toString(), 10);
            const evText =
              evId === eventId
                ? finalNotes
                : (ev as any).notes || ev.description || "";
            const evType = ev.event_type;

            if (
              evType === "date_fee_payment" ||
              evText.includes("(Date Fee)")
            ) {
              const match = evText.match(/₹\s*([\d,]+)/);
              if (match) {
                recalculatedDateFeeCollected += parseFloat(
                  match[1].replace(/,/g, "")
                );
              } else if (ev.amount) {
                recalculatedDateFeeCollected += ev.amount;
              }
            } else if (
              evType === "date_fee_agreed" ||
              evText.includes("Date Hearing Fee Agreed")
            ) {
              const match = evText.match(/₹\s*([\d,]+)/);
              if (match) {
                recalculatedDateFeeAgreed = parseFloat(
                  match[1].replace(/,/g, "")
                );
              } else if (ev.amount) {
                recalculatedDateFeeAgreed = ev.amount;
              }
            } else if (
              evType === "total_fee_payment" ||
              evText.includes("(Total Retainer)") ||
              evText.match(
                /(Fee Payment Received|Recorded Payment|Fee Received)/i
              )
            ) {
              const match = evText.match(/₹\s*([\d,]+)/);
              if (match) {
                recalculatedTotalFeePaid += parseFloat(
                  match[1].replace(/,/g, "")
                );
              } else if (ev.amount) {
                recalculatedTotalFeePaid += ev.amount;
              }
            }
          });

          const currentTargetDateFee =
            recalculatedDateFeeAgreed !== null
              ? recalculatedDateFeeAgreed
              : caseDetails?.date_fee || 0;
          const isDateFeePaidNow =
            currentTargetDateFee > 0 &&
            recalculatedDateFeeCollected >= currentTargetDateFee
              ? 1
              : 0;
          const uId = await getCurrentUserId();

          await db.updateCase(
            caseIdToLoad,
            {
              fee_paid: recalculatedTotalFeePaid,
              date_fee_collected: recalculatedDateFeeCollected,
              date_fee_paid: isDateFeePaidNow,
              ...(recalculatedDateFeeAgreed !== null
                ? { date_fee: recalculatedDateFeeAgreed }
                : {}),
            },
            uId
          );

          await loadCaseDetails(caseIdToLoad);
          await loadDocumentsAndTimeline(caseIdToLoad);
        }

        Alert.alert(
          t("alert_success"),
          "Timeline event and case fees updated successfully."
        );
        setShowEditNotesModal(false);
        setEditingTimelineEvent(null);
        setEditedNotesText("");
        setEditingTimelinePaymentAmount("");
      } else {
        Alert.alert(t("alert_error"), "Failed to update notes.");
      }
    } catch (error) {
      console.error("Error updating timeline event notes:", error);
      Alert.alert(
        t("alert_error"),
        "Failed to update notes due to database error."
      );
    }
  };

  const handlePromptDeleteTimelineNotes = (event: TimelineEvent) => {
    Alert.alert(
      t("alert_confirm_delete") || "Confirm Delete",
      "Are you sure you want to permanently delete this timeline event?",
      [
        { text: t("alert_cancel") || "Cancel", style: "cancel" },
        {
          text: t("editcase_delete") || "Delete",
          style: "destructive",
          onPress: async () => {
            setEditingTimelineEvent(event);
            try {
              const eventId = parseInt(event.id.toString(), 10);
              if (isNaN(eventId)) return;
              const success = await db.deleteCaseTimelineEvent(eventId);
              if (success && caseId) {
                const caseIdToLoad = parseInt(caseId.toString(), 10);
                const allEvents =
                  await db.getCaseTimelineEventsByCaseId(caseIdToLoad);
                let recalculatedTotalFeePaid = 0;
                let recalculatedDateFeeCollected = 0;
                allEvents.forEach((ev) => {
                  const evId = parseInt(ev.id.toString(), 10);
                  if (evId === eventId) return;
                  const evText = (ev as any).notes || ev.description || "";
                  const evType = ev.event_type;
                  if (
                    evType === "date_fee_payment" ||
                    evText.includes("(Date Fee)")
                  ) {
                    const match = evText.match(/₹\s*([\d,]+)/);
                    if (match)
                      recalculatedDateFeeCollected += parseFloat(
                        match[1].replace(/,/g, "")
                      );
                    else if (ev.amount)
                      recalculatedDateFeeCollected += ev.amount;
                  } else if (
                    evType === "total_fee_payment" ||
                    evText.includes("(Total Retainer)") ||
                    evText.match(
                      /(Fee Payment Received|Recorded Payment|Fee Received)/i
                    )
                  ) {
                    const match = evText.match(/₹\s*([\d,]+)/);
                    if (match)
                      recalculatedTotalFeePaid += parseFloat(
                        match[1].replace(/,/g, "")
                      );
                    else if (ev.amount) recalculatedTotalFeePaid += ev.amount;
                  }
                });
                const currentTargetDateFee = caseDetails?.date_fee || 0;
                const isDateFeePaidNow =
                  currentTargetDateFee > 0 &&
                  recalculatedDateFeeCollected >= currentTargetDateFee
                    ? 1
                    : 0;
                const uId = await getCurrentUserId();
                await db.updateCase(
                  caseIdToLoad,
                  {
                    fee_paid: recalculatedTotalFeePaid,
                    date_fee_collected: recalculatedDateFeeCollected,
                    date_fee_paid: isDateFeePaidNow,
                  },
                  uId
                );
                await loadCaseDetails(caseIdToLoad);
                await loadDocumentsAndTimeline(caseIdToLoad);
                DeviceEventEmitter.emit(CASE_UPDATED_EVENT);
                Alert.alert(
                  t("alert_success"),
                  "Timeline event deleted successfully."
                );
              }
            } catch (error) {
              console.error("Error deleting timeline event:", error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteTimelineNotes = async () => {
    if (!editingTimelineEvent) return;
    try {
      const eventId = parseInt(editingTimelineEvent.id.toString(), 10);
      if (isNaN(eventId)) return;

      const success = await db.deleteCaseTimelineEvent(eventId);
      if (success) {
        if (caseId) {
          const caseIdToLoad = parseInt(caseId.toString(), 10);
          const allEvents =
            await db.getCaseTimelineEventsByCaseId(caseIdToLoad);

          let recalculatedTotalFeePaid = 0;
          let recalculatedDateFeeCollected = 0;

          allEvents.forEach((ev) => {
            const evId = parseInt(ev.id.toString(), 10);
            if (evId === eventId) return; // Skip deleted event
            const evText = ev.description || "";
            const evType = ev.event_type;

            if (
              evType === "date_fee_payment" ||
              evText.includes("(Date Fee)")
            ) {
              const match = evText.match(/₹\s*([\d,]+)/);
              if (match) {
                recalculatedDateFeeCollected += parseFloat(
                  match[1].replace(/,/g, "")
                );
              } else if (ev.amount) {
                recalculatedDateFeeCollected += ev.amount;
              }
            } else if (
              evType === "total_fee_payment" ||
              evText.includes("(Total Retainer)") ||
              evText.match(
                /(Fee Payment Received|Recorded Payment|Fee Received)/i
              )
            ) {
              const match = evText.match(/₹\s*([\d,]+)/);
              if (match) {
                recalculatedTotalFeePaid += parseFloat(
                  match[1].replace(/,/g, "")
                );
              } else if (ev.amount) {
                recalculatedTotalFeePaid += ev.amount;
              }
            }
          });

          const currentTargetDateFee = caseDetails?.date_fee || 0;
          const isDateFeePaidNow =
            currentTargetDateFee > 0 &&
            recalculatedDateFeeCollected >= currentTargetDateFee
              ? 1
              : 0;
          const uId = await getCurrentUserId();

          await db.updateCase(
            caseIdToLoad,
            {
              fee_paid: recalculatedTotalFeePaid,
              date_fee_collected: recalculatedDateFeeCollected,
              date_fee_paid: isDateFeePaidNow,
            },
            uId
          );

          await loadCaseDetails(caseIdToLoad);
          await loadDocumentsAndTimeline(caseIdToLoad);
        }

        Alert.alert(t("alert_success"), "Timeline event deleted successfully.");
        setShowEditNotesModal(false);
        setEditingTimelineEvent(null);
        setEditedNotesText("");
        setEditingTimelinePaymentAmount("");
      }
    } catch (error) {
      console.error("Error deleting timeline event:", error);
    }
  };

  const handleSaveTotalFee = async () => {
    if (!caseDetails || !caseDetails.id) return;
    const caseIdToUpdate = parseInt(caseDetails.id.toString(), 10);
    const newTotalFee = editingTotalFee.trim()
      ? parseFloat(editingTotalFee.trim())
      : 0;
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

  const handleDeleteDocument = (doc: Document) => {
    Alert.alert(
      t("alert_confirm_delete") || "Confirm Delete",
      `Are you sure you want to permanently delete "${doc.fileName}"?`,
      [
        { text: t("alert_cancel") || "Cancel", style: "cancel" },
        {
          text: t("alert_delete") || "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await db.deleteCaseDocument(doc.id);
              if (success) {
                if (caseId) {
                  const caseIdToLoad = parseInt(caseId.toString(), 10);
                  await loadDocumentsAndTimeline(caseIdToLoad);
                }
              } else {
                Alert.alert(
                  t("alert_error"),
                  "Failed to delete document file."
                );
              }
            } catch (error) {
              console.error("Error deleting case document:", error);
              Alert.alert(
                t("alert_error"),
                "Failed to delete document due to database error."
              );
            }
          },
        },
      ]
    );
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
        notes: `Fee Payment Received: ₹${amount.toLocaleString("en-IN")}${noteStr}`,
      });
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentNote("");
      await loadCaseDetails(caseIdToUpdate);
      await loadDocumentsAndTimeline(caseIdToUpdate);
      Alert.alert(
        t("alert_success"),
        `Payment of ₹${amount.toLocaleString("en-IN")} recorded successfully.`
      );
    } catch (e) {
      console.error("Failed to record payment:", e);
      Alert.alert(t("alert_error"), "Failed to record payment.");
    }
  };

  const handleSaveRecordedPayment = async () => {
    if (!caseDetails || !caseDetails.id) return;
    const caseIdToUpdate = parseInt(caseDetails.id.toString(), 10);
    const newFeePaid = editingRecordedPayment.trim()
      ? parseFloat(editingRecordedPayment.trim())
      : 0;
    if (newFeePaid < 0) {
      Alert.alert(
        t("alert_warning"),
        "Recorded payment amount cannot be negative."
      );
      return;
    }
    try {
      await db.updateCase(caseIdToUpdate, { fee_paid: newFeePaid });
      await db.addCaseTimelineEvent({
        case_id: caseIdToUpdate,
        hearing_date: new Date().toISOString(),
        notes: `Recorded Payment Updated: ₹${newFeePaid.toLocaleString("en-IN")} (Edited)`,
      });
      setShowPaymentEditModal(false);
      await loadCaseDetails(caseIdToUpdate);
      await loadDocumentsAndTimeline(caseIdToUpdate);
      Alert.alert(
        t("alert_success"),
        `Recorded payment updated to ₹${newFeePaid.toLocaleString("en-IN")} (Edited) successfully.`
      );
    } catch (e) {
      console.error("Failed to update recorded payment:", e);
      Alert.alert(t("alert_error"), "Failed to update recorded payment.");
    }
  };

  const getRelativeHearingTag = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hearingDate = new Date(dateStr);
      hearingDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (hearingDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
      );
      if (diffDays === 0)
        return { label: "TODAY", bg: "#DCFCE7", text: "#15803D" };
      if (diffDays === 1)
        return { label: "TOMORROW", bg: "#FEF3C7", text: "#D97706" };
      if (diffDays > 1)
        return { label: `IN ${diffDays} DAYS`, bg: "#E0F2FE", text: "#0284C7" };
      return {
        label: `${Math.abs(diffDays)} DAYS AGO`,
        bg: "#FEE2E2",
        text: "#B91C1C",
      };
    } catch (e) {
      return null;
    }
  };

  const handleSaveHearingUpdate = async (
    notes: string,
    nextHearingDate: Date,
    dateFeeCollectedToday?: number,
    totalFeeCollectedToday?: number,
    paymentMode?: string,
    paymentNotes?: string
  ) => {
    if (!caseDetails || !caseDetails.id) return;
    const caseIdToUpdate = parseInt(caseDetails.id.toString(), 10);
    try {
      const uId = await getCurrentUserId();
      const caseExists = await db.getCaseById(caseIdToUpdate);
      if (!caseExists) return;

      const nowIso = new Date().toISOString();
      const modeTag = paymentMode ? paymentMode : "Cash";
      const noteTag =
        paymentNotes && paymentNotes.trim() ? ` - ${paymentNotes.trim()}` : "";

      // 1. Log Court Proceedings & Notes event if notes present
      if (notes && notes.trim()) {
        await db.addCaseTimelineEvent({
          case_id: caseIdToUpdate,
          hearing_date: nowIso,
          notes: notes.trim(),
          event_type: "hearing_proceeding",
        });
      }

      // 2. Log Date Fee Payment event if dateFeeCollectedToday > 0
      if (dateFeeCollectedToday && dateFeeCollectedToday > 0) {
        const dateFeeStr = `Fee Payment Received (Date Fee): ₹${dateFeeCollectedToday.toLocaleString("en-IN")} [Mode: ${modeTag}]${noteTag}`;
        await db.addCaseTimelineEvent({
          case_id: caseIdToUpdate,
          hearing_date: nowIso,
          notes: dateFeeStr,
          event_type: "date_fee_payment",
          amount: dateFeeCollectedToday,
          payment_mode: modeTag,
        });
      }

      // 3. Log Total Fee Payment event if totalFeeCollectedToday > 0
      if (totalFeeCollectedToday && totalFeeCollectedToday > 0) {
        const totalFeeStr = `Fee Payment Received (Total Retainer): ₹${totalFeeCollectedToday.toLocaleString("en-IN")} [Mode: ${modeTag}]${noteTag}`;
        await db.addCaseTimelineEvent({
          case_id: caseIdToUpdate,
          hearing_date: nowIso,
          notes: totalFeeStr,
          event_type: "total_fee_payment",
          amount: totalFeeCollectedToday,
          payment_mode: modeTag,
        });
      }

      const year = nextHearingDate.getFullYear();
      const month = String(nextHearingDate.getMonth() + 1).padStart(2, "0");
      const day = String(nextHearingDate.getDate()).padStart(2, "0");
      const formattedNextDate = `${year}-${month}-${day}`;

      const updatedDateFeeCollected =
        (caseDetails.date_fee_collected || 0) + (dateFeeCollectedToday || 0);
      const updatedTotalFeePaid =
        (caseDetails.fee_paid || 0) + (totalFeeCollectedToday || 0);
      const targetDateFee = caseDetails.date_fee || 0;
      const isDateFeePaidNow =
        targetDateFee > 0 && updatedDateFeeCollected >= targetDateFee
          ? 1
          : caseDetails.date_fee_paid || 0;

      await db.updateCase(
        caseIdToUpdate,
        {
          NextDate: formattedNextDate,
          ...(dateFeeCollectedToday && dateFeeCollectedToday > 0
            ? {
                date_fee_collected: updatedDateFeeCollected,
                date_fee_paid: isDateFeePaidNow,
              }
            : {}),
          ...(totalFeeCollectedToday && totalFeeCollectedToday > 0
            ? { fee_paid: updatedTotalFeePaid }
            : {}),
        },
        uId
      );

      setShowUpdateHearingModal(false);
      await loadCaseDetails(caseIdToUpdate);
      await loadDocumentsAndTimeline(caseIdToUpdate);
      Alert.alert(
        t("alert_success"),
        "Hearing date and fee payment details updated successfully."
      );
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
    if (localPath) {
      await shareNamedPdf(
        localPath,
        doc.fileName || doc.title || "Document",
        doc.fileName || doc.title || "Document"
      );
    } else {
      Alert.alert(t("alert_warning"), "Sharing unavailable for this document.");
    }
  };

  // Helper to categorize events
  const isPaymentEvent = (ev: TimelineEvent) => {
    const evT = ev.event_type || "";
    const d = ev.description || "";
    return (
      evT === "date_fee_payment" ||
      evT === "total_fee_payment" ||
      evT === "date_fee_agreed" ||
      evT === "total_fee_agreed" ||
      d.includes("(Date Fee)") ||
      d.includes("(Total Retainer)") ||
      d.includes("Fee Payment Received") ||
      d.includes("Recorded Payment") ||
      d.includes("Fee Received") ||
      d.includes("Fee Agreed") ||
      d.includes("retainer fee")
    );
  };

  const isHearingEvent = (ev: TimelineEvent) => {
    const evT = ev.event_type || "";
    const d = ev.description || "";
    return (
      evT === "hearing_scheduled" ||
      evT === "hearing_adjourned" ||
      evT === "hearing_proceeding" ||
      d.includes("Hearing") ||
      d.includes("hearing") ||
      d.includes("adjourned") ||
      d.includes("scheduled")
    );
  };

  const isStatusEvent = (ev: TimelineEvent) => {
    const evT = ev.event_type || "";
    const d = ev.description || "";
    return evT === "status_change" || d.includes("Case status changed");
  };

  const isJudgeOrCourtEvent = (ev: TimelineEvent) => {
    const evT = ev.event_type || "";
    const d = ev.description || "";
    return (
      evT === "judge_change" ||
      evT === "court_change" ||
      d.includes("Judge") ||
      d.includes("Court")
    );
  };

  const isStageEvent = (ev: TimelineEvent) => {
    const evT = ev.event_type || "";
    const d = ev.description || "";
    return evT === "stage_change" || d.includes("Case stage");
  };

  // Counts for category badges
  const totalEventsCount = timelineEvents.length;
  const paymentEventsCount = useMemo(
    () => timelineEvents.filter(isPaymentEvent).length,
    [timelineEvents]
  );
  const caseUpdatesCount = totalEventsCount - paymentEventsCount;

  // Filtered timeline events list
  const filteredTimelineEvents = useMemo(() => {
    return timelineEvents.filter((ev) => {
      if (timelineCategory === "payments") {
        return isPaymentEvent(ev);
      }
      if (timelineCategory === "case_updates") {
        if (isPaymentEvent(ev)) return false;
        if (timelineSubFilter === "hearings") return isHearingEvent(ev);
        if (timelineSubFilter === "status") return isStatusEvent(ev);
        if (timelineSubFilter === "judge_court") return isJudgeOrCourtEvent(ev);
        if (timelineSubFilter === "stage") return isStageEvent(ev);
        return true;
      }
      // "all" category
      if (timelineSubFilter === "hearings") return isHearingEvent(ev);
      if (timelineSubFilter === "status") return isStatusEvent(ev);
      if (timelineSubFilter === "judge_court") return isJudgeOrCourtEvent(ev);
      if (timelineSubFilter === "stage") return isStageEvent(ev);
      return true;
    });
  }, [timelineEvents, timelineCategory, timelineSubFilter]);

  const listData: ListItemType[] = [];
  listData.push({ type: "summary", data: caseDetails });

  listData.push({ type: "documentsHeader" });
  if (isLoadingDocuments) {
    listData.push({ type: "loadingDocuments" });
  } else {
    // Rendered directly
  }

  listData.push({ type: "timelineHeader" });
  if (filteredTimelineEvents.length > 0) {
    filteredTimelineEvents.forEach((event, index) =>
      listData.push({
        type: "timelineEvent",
        data: event,
        isLast: index === filteredTimelineEvents.length - 1,
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
  const handleSendTotalFeeReminder = async () => {
    if (!caseDetails || !caseDetails.ClientContactNumber) {
      Alert.alert(t("alert_error"), "Client contact number is not available.");
      return;
    }
    const totFee = caseDetails.total_fee || 0;
    const pdFee = caseDetails.fee_paid || 0;
    const balFee = Math.max(0, totFee - pdFee);
    const msg = `Dear ${caseDetails.ClientName || "Client"},\n\nThis is a gentle reminder regarding the total fee for your case "${caseDetails.CaseTitle || "Legal Matter"}":\n- Total Agreed Fee: ₹${totFee.toLocaleString("en-IN")}\n- Amount Paid: ₹${pdFee.toLocaleString("en-IN")}\n- Outstanding Balance: ₹${balFee.toLocaleString("en-IN")}\n\nKindly arrange to settle the outstanding balance at your convenience.\n\nThank you.`;
    await sendFeeReminderWhatsApp(caseDetails.ClientContactNumber, msg);
  };

  const handleSendDateFeeReminder = async () => {
    if (!caseDetails || !caseDetails.ClientContactNumber) {
      Alert.alert(t("alert_error"), "Client contact number is not available.");
      return;
    }
    const dateFeeAmt = caseDetails.date_fee || 0;
    const isPaid = Boolean(caseDetails.date_fee_paid);
    const dateStr = caseDetails.NextDate
      ? formatDate(caseDetails.NextDate)
      : "Upcoming Hearing";
    const msg = `Dear ${caseDetails.ClientName || "Client"},\n\nThis is a reminder regarding the date hearing fee for your case "${caseDetails.CaseTitle || "Legal Matter"}" (Hearing Date: ${dateStr}):\n- Date Fee: ₹${dateFeeAmt.toLocaleString("en-IN")}\n- Payment Status: ${isPaid ? "Paid" : "Unpaid / Pending"}\n\nKindly process the hearing fee payment. Thank you.`;
    await sendFeeReminderWhatsApp(caseDetails.ClientContactNumber, msg);
  };

  const handleSendCombinedFeeReminder = async () => {
    if (!caseDetails || !caseDetails.ClientContactNumber) {
      Alert.alert(t("alert_error"), "Client contact number is not available.");
      return;
    }
    const totFee = caseDetails.total_fee || 0;
    const pdFee = caseDetails.fee_paid || 0;
    const balFee = Math.max(0, totFee - pdFee);
    const dateFeeAmt = caseDetails.date_fee || 0;
    const isPaid = Boolean(caseDetails.date_fee_paid);
    const dateStr = caseDetails.NextDate
      ? formatDate(caseDetails.NextDate)
      : "Upcoming Hearing";
    const msg = `Dear ${caseDetails.ClientName || "Client"},\n\nFee update summary for your case "${caseDetails.CaseTitle || "Legal Matter"}":\n1. Overall Agreed Fee: ₹${totFee.toLocaleString("en-IN")} (Paid: ₹${pdFee.toLocaleString("en-IN")}, Remaining Balance: ₹${balFee.toLocaleString("en-IN")})\n2. Date Hearing Fee (${dateStr}): ₹${dateFeeAmt.toLocaleString("en-IN")} (${isPaid ? "Paid" : "Unpaid / Pending"})\n\nKindly settle the pending fees at your earliest convenience.\n\nThank you.`;
    await sendFeeReminderWhatsApp(caseDetails.ClientContactNumber, msg);
  };

  const handleToggleDateFeePaid = async () => {
    if (!caseDetails || !caseDetails.id) return;
    const caseIdToUpdate = parseInt(caseDetails.id.toString(), 10);
    const newStatus = caseDetails.date_fee_paid ? 0 : 1;
    try {
      const uId = await getCurrentUserId();
      await db.updateCase(caseIdToUpdate, { date_fee_paid: newStatus }, uId);
      await loadCaseDetails(caseIdToUpdate);
    } catch (e) {
      console.error("Failed to toggle date fee status:", e);
    }
  };

  const handleSaveDateFeeAmount = async () => {
    if (!caseDetails || !caseDetails.id) return;
    const caseIdToUpdate = parseInt(caseDetails.id.toString(), 10);
    const newDateFee = editingDateFeeAmount.trim()
      ? parseFloat(editingDateFeeAmount.trim())
      : 0;
    if (newDateFee < 0) {
      Alert.alert(t("alert_error"), "Date fee cannot be negative.");
      return;
    }
    try {
      const uId = await getCurrentUserId();
      await db.updateCase(caseIdToUpdate, { date_fee: newDateFee }, uId);

      await db.addCaseTimelineEvent({
        case_id: caseIdToUpdate,
        hearing_date: new Date().toISOString(),
        notes: `Date Hearing Fee Agreed: ₹${newDateFee.toLocaleString("en-IN")}`,
        event_type: "date_fee_agreed",
        amount: newDateFee,
      });

      setShowDateFeeModal(false);
      await loadCaseDetails(caseIdToUpdate);
      await loadDocumentsAndTimeline(caseIdToUpdate);
      Alert.alert(
        t("alert_success"),
        `Date hearing fee updated to ₹${newDateFee.toLocaleString("en-IN")} successfully.`
      );
    } catch (e) {
      console.error("Failed to update date fee:", e);
      Alert.alert(t("alert_error"), "Failed to update date hearing fee.");
    }
  };

  const handleRecordDateFeePayment = async () => {
    if (!caseDetails || !caseDetails.id) return;
    const caseIdToUpdate = parseInt(caseDetails.id.toString(), 10);
    const amount = editingDateFeePaymentAmount.trim()
      ? parseFloat(editingDateFeePaymentAmount.trim())
      : 0;
    if (amount <= 0) {
      Alert.alert(
        t("alert_error"),
        "Please enter a valid payment amount greater than 0."
      );
      return;
    }
    try {
      const uId = await getCurrentUserId();
      const updatedDateFeeCollected =
        (caseDetails.date_fee_collected || 0) + amount;
      const targetDateFee = caseDetails.date_fee || 0;
      const isNowFullyPaid =
        targetDateFee > 0 && updatedDateFeeCollected >= targetDateFee
          ? 1
          : caseDetails.date_fee_paid || 0;

      await db.updateCase(
        caseIdToUpdate,
        {
          date_fee_collected: updatedDateFeeCollected,
          date_fee_paid: isNowFullyPaid,
        },
        uId
      );

      const noteStr = editingDateFeePaymentNote.trim()
        ? ` - ${editingDateFeePaymentNote.trim()}`
        : "";
      await db.addCaseTimelineEvent({
        case_id: caseIdToUpdate,
        hearing_date: new Date().toISOString(),
        notes: `Fee Payment Received (Date Fee): ₹${amount.toLocaleString("en-IN")}${noteStr}`,
        event_type: "date_fee_payment",
        amount,
        payment_mode: "Cash",
      });

      setShowDateFeePaymentModal(false);
      setEditingDateFeePaymentAmount("");
      setEditingDateFeePaymentNote("");
      await loadCaseDetails(caseIdToUpdate);
      await loadDocumentsAndTimeline(caseIdToUpdate);
      Alert.alert(
        t("alert_success"),
        `Recorded ₹${amount.toLocaleString("en-IN")} payment for date hearing fee.`
      );
    } catch (e) {
      console.error("Failed to record date fee payment:", e);
      Alert.alert(t("alert_error"), "Failed to record date fee payment.");
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
        const pctPaid =
          totFee > 0 ? Math.min(100, Math.round((pdFee / totFee) * 100)) : 0;

        return (
          <View
            style={{ padding: 16, backgroundColor: theme.colors.background }}
          >
            {/* CARD 1: HERO CASE & CLIENT SPOTLIGHT (STRICT GEOMETRIC ALIGNMENT) */}
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={{
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
              }}
            >
              {/* ROW 1: Case Title & Status Badge (Geometrically Aligned Header) */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: theme.colors.text,
                      lineHeight: 26,
                    }}
                    numberOfLines={2}
                  >
                    {caseDetails.CaseTitle}
                  </Text>
                </View>
                <View style={{ marginTop: 2 }}>
                  <StatusBadge status={caseDetails.CaseStatus} />
                </View>
              </View>

              {/* ROW 2: Client Name & Stage/Priority Badges (Strict Horizontal Line) */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    paddingRight: 8,
                  }}
                >
                  <Ionicons
                    name="person-circle"
                    size={22}
                    color={theme.colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: theme.colors.text,
                    }}
                    numberOfLines={1}
                  >
                    {t("casedetails_client_prefix")}
                    {caseDetails.ClientName}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  {caseDetails.case_stage ? (
                    <View
                      style={{
                        backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.isDark ? "#4338CA" : "#C7D2FE",
                      }}
                    >
                      <Text
                        style={{
                          color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                          fontWeight: "700",
                          fontSize: 11,
                        }}
                      >
                        {caseDetails.case_stage}
                      </Text>
                    </View>
                  ) : null}
                  {caseDetails.Priority ? (
                    <View
                      style={{
                        backgroundColor: theme.isDark ? "#451A1A" : "#FEF2F2",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.isDark ? "#991B1B" : "#FCA5A5",
                      }}
                    >
                      <Text
                        style={{
                          color: theme.isDark ? "#F87171" : "#DC2626",
                          fontWeight: "700",
                          fontSize: 11,
                        }}
                      >
                        {getTranslatedPriority(caseDetails.Priority)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* ROW 3: CLIENT QUICK CONTACT GRID (ALWAYS VISIBLE - 3 EQUAL 1/3-WIDTH COLUMNS) */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                  paddingTop: 12,
                }}
              >
                <TouchableOpacity
                  onPress={handlePhoneCall}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 40,
                    backgroundColor: caseDetails.ClientContactNumber
                      ? theme.isDark
                        ? "#075985"
                        : "#E0F2FE"
                      : theme.isDark
                        ? "#334155"
                        : "#F3F4F6",
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: caseDetails.ClientContactNumber
                      ? theme.isDark
                        ? "#0284C7"
                        : "#BAE6FD"
                      : theme.isDark
                        ? "#475569"
                        : "#E5E7EB",
                  }}
                >
                  <Ionicons
                    name="call"
                    size={15}
                    color={
                      caseDetails.ClientContactNumber
                        ? theme.isDark
                          ? "#7DD3FC"
                          : "#0284C7"
                        : theme.isDark
                          ? "#94A3B8"
                          : "#6B7280"
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: caseDetails.ClientContactNumber
                        ? theme.isDark
                          ? "#7DD3FC"
                          : "#0284C7"
                        : theme.isDark
                          ? "#94A3B8"
                          : "#6B7280",
                    }}
                  >
                    Call
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleWhatsAppChat}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 40,
                    backgroundColor: caseDetails.ClientContactNumber
                      ? theme.isDark
                        ? "#064E3B"
                        : "#DCFCE7"
                      : theme.isDark
                        ? "#334155"
                        : "#F3F4F6",
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: caseDetails.ClientContactNumber
                      ? theme.isDark
                        ? "#059669"
                        : "#BBF7D0"
                      : theme.isDark
                        ? "#475569"
                        : "#E5E7EB",
                  }}
                >
                  <Ionicons
                    name="logo-whatsapp"
                    size={15}
                    color={
                      caseDetails.ClientContactNumber
                        ? theme.isDark
                          ? "#6EE7B7"
                          : "#15803D"
                        : theme.isDark
                          ? "#94A3B8"
                          : "#6B7280"
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: caseDetails.ClientContactNumber
                        ? theme.isDark
                          ? "#6EE7B7"
                          : "#15803D"
                        : theme.isDark
                          ? "#94A3B8"
                          : "#6B7280",
                    }}
                  >
                    WhatsApp
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOpenReminderModal}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 40,
                    backgroundColor: theme.isDark ? "#78350F" : "#FEF3C7",
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.isDark ? "#B45309" : "#FDE68A",
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={15}
                    color={theme.isDark ? "#FDE68A" : "#D97706"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: theme.isDark ? "#FDE68A" : "#D97706",
                    }}
                  >
                    Reminder
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* CARD 2: NEXT HEARING & RETAINER FINANCIAL DASHBOARD */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={{
                backgroundColor: theme.colors.cardBackground,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: 16,
              }}
            >
              {/* HEARING SPOTLIGHT SECTION */}
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={theme.colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: theme.colors.text,
                      }}
                    >
                      Next Hearing Spotlight
                    </Text>
                  </View>
                  {relTag && (
                    <View
                      style={{
                        backgroundColor: relTag.bg,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: relTag.text,
                        }}
                      >
                        {relTag.label}
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  style={{
                    backgroundColor:
                      theme.colors.inputBackground ||
                      (theme.isDark ? "#1E293B" : "#F8FAFC"),
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                          marginBottom: 2,
                        }}
                      >
                        Hearing Date
                      </Text>
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: "700",
                          color: theme.colors.text,
                        }}
                      >
                        {formatDate(caseDetails.NextDate)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                          marginBottom: 2,
                        }}
                      >
                        Total Case Fee
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: theme.colors.primary,
                        }}
                      >
                        ₹{totFee.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>
                  {caseDetails.PreviousDate && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: theme.colors.textSecondary,
                        marginTop: 6,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                        paddingTop: 4,
                      }}
                    >
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
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#FFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}
                  >
                    Update Next Hearing Date
                  </Text>
                </TouchableOpacity>
              </View>

              {/* OVERDUE HEARING PENDING ACTION BANNER */}
              {(() => {
                if (!caseDetails.NextDate) return null;
                try {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const parts = caseDetails.NextDate.split("-");
                  if (parts.length === 3) {
                    const hDate = new Date(
                      parseInt(parts[0], 10),
                      parseInt(parts[1], 10) - 1,
                      parseInt(parts[2], 10)
                    );
                    hDate.setHours(0, 0, 0, 0);
                    if (hDate.getTime() < today.getTime()) {
                      return (
                        <View
                          style={{
                            backgroundColor: theme.isDark
                              ? "#7F1D1D"
                              : "#FEF2F2",
                            borderWidth: 1,
                            borderColor: theme.isDark ? "#991B1B" : "#FCA5A5",
                            borderRadius: 12,
                            padding: 12,
                            marginTop: 10,
                            marginBottom: 4,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Ionicons
                            name="alert-circle"
                            size={22}
                            color={theme.isDark ? "#F87171" : "#DC2626"}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: theme.isDark ? "#F87171" : "#991B1B",
                              }}
                            >
                              ⚠️ Pending Action: Hearing Date Passed
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: theme.isDark ? "#FCA5A5" : "#B91C1C",
                                marginTop: 2,
                              }}
                            >
                              Hearing date ({formatDate(caseDetails.NextDate)})
                              has passed. Update hearing proceedings or remind
                              your client.
                            </Text>
                          </View>
                        </View>
                      );
                    }
                  }
                } catch (e) {}
                return null;
              })()}

              {/* RETAINER FEE SECTION */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                  paddingTop: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="wallet-outline"
                      size={20}
                      color="#16A34A"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: theme.colors.text,
                      }}
                    >
                      Fee & Retainer Hub
                    </Text>
                  </View>
                </View>

                {/* --- SECTION A: TOTAL CASE RETAINER FEE --- */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: theme.colors.textSecondary,
                      marginBottom: 6,
                    }}
                  >
                    TOTAL CASE RETAINER FEE
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F8FAFC"),
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Agreed Fee
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        ₹{totFee.toLocaleString("en-IN")}
                      </Text>
                    </View>

                    <View
                      style={{
                        flex: 1,
                        backgroundColor: theme.isDark ? "#064E3B" : "#F0FDF4",
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.isDark ? "#059669" : "#BBF7D0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.isDark ? "#A7F3D0" : "#166534",
                        }}
                      >
                        Collected
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: theme.isDark ? "#34D399" : "#16A34A",
                          marginTop: 2,
                        }}
                      >
                        ₹{pdFee.toLocaleString("en-IN")}
                      </Text>
                    </View>

                    <View
                      style={{
                        flex: 1,
                        backgroundColor:
                          balFee > 0
                            ? theme.isDark
                              ? "#7F1D1D"
                              : "#FEF2F2"
                            : theme.isDark
                              ? "#064E3B"
                              : "#F0FDF4",
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor:
                          balFee > 0
                            ? theme.isDark
                              ? "#991B1B"
                              : "#FCA5A5"
                            : theme.isDark
                              ? "#059669"
                              : "#BBF7D0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color:
                            balFee > 0
                              ? theme.isDark
                                ? "#FCA5A5"
                                : "#991B1B"
                              : theme.isDark
                                ? "#A7F3D0"
                                : "#166534",
                        }}
                      >
                        Balance
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color:
                            balFee > 0
                              ? theme.isDark
                                ? "#F87171"
                                : "#DC2626"
                              : theme.isDark
                                ? "#34D399"
                                : "#16A34A",
                          marginTop: 2,
                        }}
                      >
                        ₹{balFee.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setShowPaymentModal(true)}
                      activeOpacity={0.85}
                      style={{
                        flex: 1,
                        backgroundColor: "#16A34A",
                        paddingVertical: 8,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={14}
                        color="#FFF"
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#FFF",
                        }}
                      >
                        Record Total Payment
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setEditingTotalFee(
                          caseDetails.total_fee != null
                            ? String(caseDetails.total_fee)
                            : ""
                        );
                        setShowFeeModal(true);
                      }}
                      activeOpacity={0.85}
                      style={{
                        flex: 1,
                        backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
                        paddingVertical: 8,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: theme.isDark ? "#4338CA" : "#C7D2FE",
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={14}
                        color={theme.isDark ? "#A5B4FC" : "#4F46E5"}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                        }}
                      >
                        Edit Total Fee
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* --- SECTION B: HEARING DATE FEE (PER HEARING) --- */}
                {(() => {
                  const dfAgreed = caseDetails.date_fee || 0;
                  const dfCollected = caseDetails.date_fee_collected || 0;
                  const dfBalance = Math.max(0, dfAgreed - dfCollected);

                  const getStatusTag = () => {
                    if (dfAgreed > 0 && dfCollected >= dfAgreed) {
                      return {
                        label: "✓ Paid",
                        bg: theme.isDark ? "#064E3B" : "#DCFCE7",
                        border: theme.isDark ? "#059669" : "#86EFAC",
                        text: theme.isDark ? "#34D399" : "#15803D",
                      };
                    }
                    if (dfCollected > 0) {
                      return {
                        label: "⏳ Partially Paid",
                        bg: theme.isDark ? "#78350F" : "#FEF3C7",
                        border: theme.isDark ? "#B45309" : "#FDE68A",
                        text: theme.isDark ? "#FDE68A" : "#D97706",
                      };
                    }
                    return {
                      label: "⚠️ Pending",
                      bg: theme.isDark ? "#7F1D1D" : "#FEF2F2",
                      border: theme.isDark ? "#991B1B" : "#FCA5A5",
                      text: theme.isDark ? "#F87171" : "#DC2626",
                    };
                  };

                  const statusTag = getStatusTag();

                  return (
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                        paddingTop: 12,
                        marginBottom: 16,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: theme.colors.textSecondary,
                          }}
                        >
                          HEARING DATE FEE (
                          {caseDetails.NextDate
                            ? formatDate(caseDetails.NextDate)
                            : "Upcoming"}
                          )
                        </Text>
                        <View
                          style={{
                            backgroundColor: statusTag.bg,
                            borderWidth: 1,
                            borderColor: statusTag.border,
                            borderRadius: 16,
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: statusTag.text,
                            }}
                          >
                            {statusTag.label}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            backgroundColor:
                              theme.colors.inputBackground ||
                              (theme.isDark ? "#1E293B" : "#F8FAFC"),
                            padding: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.colors.textSecondary,
                            }}
                          >
                            Agreed Date Fee
                          </Text>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: theme.colors.text,
                              marginTop: 2,
                            }}
                          >
                            ₹{dfAgreed.toLocaleString("en-IN")}
                          </Text>
                        </View>

                        <View
                          style={{
                            flex: 1,
                            backgroundColor: theme.isDark
                              ? "#064E3B"
                              : "#F0FDF4",
                            padding: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: theme.isDark ? "#059669" : "#BBF7D0",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.isDark ? "#A7F3D0" : "#166534",
                            }}
                          >
                            Date Fee Collected
                          </Text>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: theme.isDark ? "#34D399" : "#16A34A",
                              marginTop: 2,
                            }}
                          >
                            ₹{dfCollected.toLocaleString("en-IN")}
                          </Text>
                        </View>

                        <View
                          style={{
                            flex: 1,
                            backgroundColor:
                              dfBalance > 0
                                ? theme.isDark
                                  ? "#7F1D1D"
                                  : "#FEF2F2"
                                : theme.isDark
                                  ? "#064E3B"
                                  : "#F0FDF4",
                            padding: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor:
                              dfBalance > 0
                                ? theme.isDark
                                  ? "#991B1B"
                                  : "#FCA5A5"
                                : theme.isDark
                                  ? "#059669"
                                  : "#BBF7D0",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color:
                                dfBalance > 0
                                  ? theme.isDark
                                    ? "#FCA5A5"
                                    : "#991B1B"
                                  : theme.isDark
                                    ? "#A7F3D0"
                                    : "#166534",
                            }}
                          >
                            Date Fee Balance
                          </Text>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color:
                                dfBalance > 0
                                  ? theme.isDark
                                    ? "#F87171"
                                    : "#DC2626"
                                  : theme.isDark
                                    ? "#34D399"
                                    : "#16A34A",
                              marginTop: 2,
                            }}
                          >
                            ₹{dfBalance.toLocaleString("en-IN")}
                          </Text>
                        </View>
                      </View>

                      {/* SEPARATE ACTION BUTTONS FOR DATE FEE ONLY */}
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingDateFeePaymentAmount("");
                            setEditingDateFeePaymentNote("");
                            setShowDateFeePaymentModal(true);
                          }}
                          activeOpacity={0.85}
                          style={{
                            flex: 1,
                            backgroundColor: "#16A34A",
                            paddingVertical: 8,
                            borderRadius: 8,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name="add-circle-outline"
                            size={14}
                            color="#FFF"
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: "#FFF",
                            }}
                          >
                            Record Date Payment
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setEditingDateFeeAmount(
                              caseDetails.date_fee != null
                                ? String(caseDetails.date_fee)
                                : ""
                            );
                            setShowDateFeeModal(true);
                          }}
                          activeOpacity={0.85}
                          style={{
                            flex: 1,
                            backgroundColor: theme.isDark
                              ? "#1E1B4B"
                              : "#EEF2FF",
                            paddingVertical: 8,
                            borderRadius: 8,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: theme.isDark ? "#4338CA" : "#C7D2FE",
                          }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={14}
                            color={theme.isDark ? "#A5B4FC" : "#4F46E5"}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                            }}
                          >
                            Edit Agreed Date Fee
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}

                {/* 3 SEPARATE & CONSISTENT WHATSAPP REMINDER BUTTONS */}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: theme.colors.textSecondary,
                    marginBottom: 6,
                  }}
                >
                  Client Fee Reminders (WhatsApp)
                </Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <TouchableOpacity
                    onPress={handleSendTotalFeeReminder}
                    activeOpacity={0.85}
                    style={{
                      flex: 1,
                      backgroundColor: theme.isDark ? "#064E3B" : "#F0FDF4",
                      paddingVertical: 8,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: theme.isDark ? "#059669" : "#BBF7D0",
                    }}
                  >
                    <Ionicons
                      name="logo-whatsapp"
                      size={14}
                      color={theme.isDark ? "#34D399" : "#16A34A"}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: theme.isDark ? "#34D399" : "#16A34A",
                      }}
                    >
                      Total Fee
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSendDateFeeReminder}
                    activeOpacity={0.85}
                    style={{
                      flex: 1,
                      backgroundColor: theme.isDark ? "#78350F" : "#FEF3C7",
                      paddingVertical: 8,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: theme.isDark ? "#B45309" : "#FDE68A",
                    }}
                  >
                    <Ionicons
                      name="logo-whatsapp"
                      size={14}
                      color={theme.isDark ? "#FDE68A" : "#D97706"}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: theme.isDark ? "#FDE68A" : "#D97706",
                      }}
                    >
                      Date Fee
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSendCombinedFeeReminder}
                    activeOpacity={0.85}
                    style={{
                      flex: 1,
                      backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
                      paddingVertical: 8,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: theme.isDark ? "#4338CA" : "#C7D2FE",
                    }}
                  >
                    <Ionicons
                      name="logo-whatsapp"
                      size={14}
                      color={theme.isDark ? "#A5B4FC" : "#4F46E5"}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                      }}
                    >
                      Combined
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* 4. EXPANDABLE ACCORDIONS (INLINE ON SCREEN) */}

            {/* Accordion 1: Court & Jurisdiction (Default Expanded) */}
            <View
              style={{
                backgroundColor: theme.colors.cardBackground,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => toggleSection("court")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor:
                    theme.colors.cardBackground ||
                    (theme.isDark ? "#1E293B" : "#F8FAFC"),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.colors.text,
                    }}
                  >
                    Court & Jurisdiction
                  </Text>
                  <View
                    style={{
                      backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                      marginLeft: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                      }}
                    >
                      6 Details
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={
                    expandedSections.court
                      ? "chevron-up-circle"
                      : "chevron-down-circle"
                  }
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.court && (
                <View
                  style={{
                    padding: 14,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}
                >
                  <View style={{ gap: 10 }}>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Court Name
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.court_name || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Judge Name
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.JudgeName || "N/A"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          District
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.text,
                            marginTop: 2,
                          }}
                        >
                          {caseDetails.districtName || "N/A"}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Police Station
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.text,
                            marginTop: 2,
                          }}
                        >
                          {caseDetails.policeStationName || "N/A"}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Date Filed
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.text,
                            marginTop: 2,
                          }}
                        >
                          {caseDetails.dateFiled
                            ? formatDate(new Date(caseDetails.dateFiled))
                            : "N/A"}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Statute of Limitations
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.text,
                            marginTop: 2,
                          }}
                        >
                          {caseDetails.StatuteOfLimitations
                            ? formatDate(
                                new Date(caseDetails.StatuteOfLimitations)
                              )
                            : "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Accordion 2: Case Identifiers & Sections */}
            <View
              style={{
                backgroundColor: theme.colors.cardBackground,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => toggleSection("identifiers")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor:
                    theme.colors.cardBackground ||
                    (theme.isDark ? "#1E293B" : "#F8FAFC"),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Ionicons
                    name="journal-outline"
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.colors.text,
                    }}
                  >
                    Case Numbers & Sections
                  </Text>
                </View>
                <Ionicons
                  name={
                    expandedSections.identifiers
                      ? "chevron-up-circle"
                      : "chevron-down-circle"
                  }
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.identifiers && (
                <View
                  style={{
                    padding: 14,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}
                >
                  <View style={{ gap: 10 }}>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        CNR Number
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.CNRNumber || "N/A"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Case Number
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.text,
                            marginTop: 2,
                          }}
                        >
                          {caseDetails.case_number || "N/A"}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Case Year
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.text,
                            marginTop: 2,
                          }}
                        >
                          {caseDetails.case_year || "N/A"}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Session / Trial Number
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.session_trial_number || "N/A"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Crime Number
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.text,
                            marginTop: 2,
                          }}
                        >
                          {caseDetails.crime_number || "N/A"}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Crime Year
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.text,
                            marginTop: 2,
                          }}
                        >
                          {caseDetails.crime_year || "N/A"}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Under Section / IPC / CrPC
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.Undersection || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Accordion 3: Parties & Representation */}
            <View
              style={{
                backgroundColor: theme.colors.cardBackground,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => toggleSection("parties")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor:
                    theme.colors.cardBackground ||
                    (theme.isDark ? "#1E293B" : "#F8FAFC"),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Ionicons
                    name="people-outline"
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.colors.text,
                    }}
                  >
                    Parties & Advocates
                  </Text>
                </View>
                <Ionicons
                  name={
                    expandedSections.parties
                      ? "chevron-up-circle"
                      : "chevron-down-circle"
                  }
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.parties && (
                <View
                  style={{
                    padding: 14,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}
                >
                  <View style={{ gap: 10 }}>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Petitioner / First Party
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.FirstParty || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Respondent / Opposite Party
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.OppositeParty || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Accused Name
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.Accussed || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        On Behalf Of
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.OnBehalfOf || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Opposing Counsel / Advocate
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.colors.text,
                          marginTop: 2,
                        }}
                      >
                        {caseDetails.OpposingCounsel ||
                          caseDetails.OppositeAdvocate ||
                          "N/A"}
                      </Text>
                    </View>
                    {caseDetails.OppAdvocateContactNumber ? (
                      <View
                        style={{
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.colors.textSecondary,
                            }}
                          >
                            Opp. Advocate Contact
                          </Text>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: theme.colors.text,
                              marginTop: 2,
                            }}
                          >
                            {caseDetails.OppAdvocateContactNumber}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              `tel:${caseDetails.OppAdvocateContactNumber}`
                            )
                          }
                          style={{
                            backgroundColor: theme.isDark
                              ? "#075985"
                              : "#E0F2FE",
                            padding: 8,
                            borderRadius: 20,
                          }}
                        >
                          <Ionicons
                            name="call"
                            size={18}
                            color={theme.isDark ? "#7DD3FC" : "#0284C7"}
                          />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
            </View>

            {/* Accordion 4: Case Notes & Description */}
            <View
              style={{
                backgroundColor: theme.colors.cardBackground,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => toggleSection("notes")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor:
                    theme.colors.cardBackground ||
                    (theme.isDark ? "#1E293B" : "#F8FAFC"),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Ionicons
                    name="reader-outline"
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.colors.text,
                    }}
                  >
                    Case Notes & Description
                  </Text>
                </View>
                <Ionicons
                  name={
                    expandedSections.notes
                      ? "chevron-up-circle"
                      : "chevron-down-circle"
                  }
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.notes && (
                <View
                  style={{
                    padding: 14,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}
                >
                  <View style={{ gap: 10 }}>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                          marginBottom: 4,
                        }}
                      >
                        Case Description
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.colors.text,
                          lineHeight: 18,
                        }}
                      >
                        {caseDetails.CaseDescription || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          theme.colors.inputBackground ||
                          (theme.isDark ? "#1E293B" : "#F9FAFB"),
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSecondary,
                          marginBottom: 4,
                        }}
                      >
                        Internal Case Notes
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.colors.text,
                          lineHeight: 18,
                        }}
                      >
                        {caseDetails.CaseNotes || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* ACCORDION 5: DOCUMENTS & ATTACHMENTS */}
            <View
              style={{
                backgroundColor: theme.colors.cardBackground,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => toggleSection("documents")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor:
                    theme.colors.cardBackground ||
                    (theme.isDark ? "#1E293B" : "#F8FAFC"),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Ionicons
                    name="folder-open-outline"
                    size={20}
                    color={theme.colors.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.colors.text,
                    }}
                  >
                    Documents & Attachments
                  </Text>
                  <View
                    style={{
                      backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                      marginLeft: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                      }}
                    >
                      {documents.length} Files
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={
                    expandedSections.documents
                      ? "chevron-up-circle"
                      : "chevron-down-circle"
                  }
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.documents && (
                <View
                  style={{
                    padding: 14,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}
                >
                  {/* Upload Dropzone */}
                  <DocumentUpload
                    caseId={caseId}
                    onDocumentUploaded={() =>
                      caseId && loadDocumentsAndTimeline(caseId)
                    }
                  />

                  {/* ATTACHED DOCUMENTS LIST (DocHub Template Card Style) */}
                  <View style={{ marginTop: 14 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: theme.colors.textSecondary,
                        marginBottom: 10,
                        letterSpacing: 0.5,
                      }}
                    >
                      ATTACHED DOCUMENTS ({documents.length})
                    </Text>

                    {documents.length === 0 ? (
                      <View
                        style={{
                          backgroundColor:
                            theme.colors.inputBackground ||
                            (theme.isDark ? "#1E293B" : "#F9FAFB"),
                          padding: 14,
                          borderRadius: 10,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={24}
                          color={theme.colors.textSecondary}
                          style={{ marginBottom: 4 }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          No documents attached yet.
                        </Text>
                      </View>
                    ) : (
                      documents.map((doc) => {
                        const isPdf = doc.fileName
                          ?.toLowerCase()
                          .endsWith(".pdf");
                        const isImg = doc.fileName
                          ?.toLowerCase()
                          .match(/\.(jpg|jpeg|png|webp)$/);
                        return (
                          <View
                            key={doc.id}
                            style={{
                              backgroundColor:
                                theme.colors.inputBackground ||
                                (theme.isDark ? "#1E293B" : "#F8FAFC"),
                              borderRadius: 12,
                              padding: 12,
                              marginBottom: 10,
                              borderWidth: 1,
                              borderColor: theme.colors.border,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <View
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  backgroundColor: isPdf
                                    ? theme.isDark
                                      ? "#451A1A"
                                      : "#FEF2F2"
                                    : isImg
                                      ? theme.isDark
                                        ? "#064E3B"
                                        : "#F0FDF4"
                                      : theme.isDark
                                        ? "#1E1B4B"
                                        : "#EEF2FF",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginRight: 10,
                                }}
                              >
                                <Ionicons
                                  name={
                                    isPdf
                                      ? "document-text"
                                      : isImg
                                        ? "image"
                                        : "document"
                                  }
                                  size={18}
                                  color={
                                    isPdf
                                      ? theme.isDark
                                        ? "#F87171"
                                        : "#DC2626"
                                      : isImg
                                        ? theme.isDark
                                          ? "#34D399"
                                          : "#16A34A"
                                        : theme.isDark
                                          ? "#A5B4FC"
                                          : "#4F46E5"
                                  }
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    fontWeight: "700",
                                    color: theme.colors.text,
                                  }}
                                  numberOfLines={1}
                                >
                                  {doc.fileName || "Document"}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: theme.colors.textSecondary,
                                    marginTop: 2,
                                  }}
                                >
                                  {doc.uploaded_at
                                    ? formatDate(new Date(doc.uploaded_at))
                                    : "Recently attached"}
                                </Text>
                              </View>
                            </View>

                            {/* DOCUMENT QUICK ACTION TRIPLETS (OPEN, SHARE, DELETE) */}
                            <View
                              style={{
                                flexDirection: "row",
                                gap: 8,
                                borderTopWidth: 1,
                                borderTopColor: theme.colors.border,
                                paddingTop: 10,
                              }}
                            >
                              <TouchableOpacity
                                onPress={() => handleDocumentInteraction(doc)}
                                activeOpacity={0.8}
                                style={{
                                  flex: 1,
                                  backgroundColor: theme.isDark
                                    ? "#1E1B4B"
                                    : "#EEF2FF",
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderWidth: 1,
                                  borderColor: theme.isDark
                                    ? "#4338CA"
                                    : "#C7D2FE",
                                }}
                              >
                                <Ionicons
                                  name="eye-outline"
                                  size={14}
                                  color={theme.isDark ? "#A5B4FC" : "#4F46E5"}
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: "700",
                                    color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                                  }}
                                >
                                  Open
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleShareDocument(doc)}
                                activeOpacity={0.8}
                                style={{
                                  flex: 1,
                                  backgroundColor: theme.isDark
                                    ? "#064E3B"
                                    : "#DCFCE7",
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderWidth: 1,
                                  borderColor: theme.isDark
                                    ? "#059669"
                                    : "#BBF7D0",
                                }}
                              >
                                <Ionicons
                                  name="share-outline"
                                  size={14}
                                  color={theme.isDark ? "#6EE7B7" : "#15803D"}
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: "700",
                                    color: theme.isDark ? "#6EE7B7" : "#15803D",
                                  }}
                                >
                                  Share
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleDeleteDocument(doc)}
                                activeOpacity={0.8}
                                style={{
                                  flex: 1,
                                  backgroundColor: theme.isDark
                                    ? "#451A1A"
                                    : "#FEF2F2",
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderWidth: 1,
                                  borderColor: theme.isDark
                                    ? "#991B1B"
                                    : "#FCA5A5",
                                }}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={14}
                                  color={theme.isDark ? "#F87171" : "#DC2626"}
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: "700",
                                    color: theme.isDark ? "#F87171" : "#DC2626",
                                  }}
                                >
                                  Delete
                                </Text>
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: theme.colors.text,
                  }}
                >
                  Case Management Actions
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={handleEditCase}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.isDark ? "#4338CA" : "#C7D2FE",
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={theme.isDark ? "#A5B4FC" : "#4F46E5"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                    }}
                  >
                    Edit Case
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleExportPdf}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: theme.isDark ? "#075985" : "#E0F2FE",
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.isDark ? "#0284C7" : "#BAE6FD",
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={theme.isDark ? "#7DD3FC" : "#0284C7"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: theme.isDark ? "#7DD3FC" : "#0284C7",
                    }}
                  >
                    Export PDF
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={handleShareHistory}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: theme.isDark ? "#064E3B" : "#DCFCE7",
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.isDark ? "#059669" : "#BBF7D0",
                  }}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={16}
                    color={theme.isDark ? "#6EE7B7" : "#15803D"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: theme.isDark ? "#6EE7B7" : "#15803D",
                    }}
                  >
                    Share History
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGenerateDocument}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: theme.isDark ? "#3B0764" : "#F3E8FF",
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.isDark ? "#7E22CE" : "#E9D5FF",
                  }}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={16}
                    color={theme.isDark ? "#D8B4FE" : "#7E22CE"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: theme.isDark ? "#D8B4FE" : "#7E22CE",
                    }}
                  >
                    Generate Court Document
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleDeleteCase}
                activeOpacity={0.8}
                style={{
                  backgroundColor: theme.isDark ? "#451A1A" : "#FEF2F2",
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: theme.isDark ? "#991B1B" : "#FCA5A5",
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={theme.isDark ? "#F87171" : "#DC2626"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: theme.isDark ? "#F87171" : "#DC2626",
                  }}
                >
                  Delete Case Record
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case "documentsHeader":
        return null;
      case "timelineHeader": {
        return (
          <View style={[styles.timelineSection, { marginBottom: 12 }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <SectionHeader title={t("casedetails_sec_timeline")} />
                <View
                  style={{
                    backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.isDark ? "#4338CA" : "#C7D2FE",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: theme.isDark ? "#A5B4FC" : "#4F46E5",
                    }}
                  >
                    {totalEventsCount} Total
                  </Text>
                </View>
              </View>
            </View>

            {/* Main Category Tabs */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9",
                borderRadius: 12,
                padding: 4,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <TouchableOpacity
                onPress={() => setTimelineCategory("all")}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  backgroundColor:
                    timelineCategory === "all"
                      ? theme.colors.primary
                      : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color:
                      timelineCategory === "all"
                        ? "#ffffff"
                        : theme.colors.textSecondary,
                  }}
                >
                  All ({totalEventsCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTimelineCategory("case_updates")}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  backgroundColor:
                    timelineCategory === "case_updates"
                      ? theme.colors.primary
                      : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color:
                      timelineCategory === "case_updates"
                        ? "#ffffff"
                        : theme.colors.textSecondary,
                  }}
                >
                  Updates ({caseUpdatesCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTimelineCategory("payments")}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  backgroundColor:
                    timelineCategory === "payments"
                      ? theme.colors.primary
                      : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color:
                      timelineCategory === "payments"
                        ? "#ffffff"
                        : theme.colors.textSecondary,
                  }}
                >
                  Payments ({paymentEventsCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub-Filters Chips (Available on All & Case Updates) */}
            {timelineCategory !== "payments" && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
                style={{ marginBottom: 8 }}
              >
                {[
                  { key: "all_updates", label: "All Events" },
                  { key: "hearings", label: "📅 Hearings" },
                  { key: "status", label: "🔄 Status" },
                  { key: "judge_court", label: "⚖️ Judge & Court" },
                  { key: "stage", label: "🎯 Stage" },
                ].map((chip) => {
                  const isSelected = timelineSubFilter === chip.key;
                  return (
                    <TouchableOpacity
                      key={chip.key}
                      onPress={() => setTimelineSubFilter(chip.key as any)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 16,
                        backgroundColor: isSelected
                          ? theme.isDark
                            ? "#312E81"
                            : "#EEF2FF"
                          : theme.isDark
                          ? "#1E293B"
                          : "#F8FAFC",
                        borderWidth: 1,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.textSecondary,
                        }}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        );
      }
      case "timelineEvent":
        return (
          <TimelineEventItem
            event={item.data}
            isLast={item.isLast}
            onEditNotes={handleEditTimelineNotes}
            onDeleteNotes={handlePromptDeleteTimelineNotes}
          />
        );
      case "noTimelineEvents":
        return (
          <View
            style={[
              styles.timelineSection,
              {
                paddingVertical: 24,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  theme.colors.cardBackground ||
                  (theme.isDark ? "#1E293B" : "#F8FAFC"),
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginTop: 4,
                marginBottom: 16,
              },
            ]}
          >
            <Ionicons
              name={
                timelineCategory === "payments"
                  ? "wallet-outline"
                  : "calendar-outline"
              }
              size={32}
              color={theme.colors.textSecondary}
              style={{ opacity: 0.6, marginBottom: 8 }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: theme.colors.textSecondary,
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              {timelineCategory === "payments"
                ? "No payment or fee events recorded yet."
                : timelineSubFilter !== "all_updates"
                ? `No events matching "${timelineSubFilter.replace("_", " ")}" filter.`
                : t("casedetails_no_timeline")}
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
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
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
            <Text style={styles.modalTitle}>
              {editingTimelineEvent?.event_type === "date_fee_agreed"
                ? "Edit Agreed Date Fee"
                : editingTimelineEvent?.event_type === "date_fee_payment" ||
                    editingTimelineEvent?.description?.includes("(Date Fee)")
                  ? "Edit Date Fee Payment"
                  : editingTimelineEvent?.description?.match(
                        /(Fee Payment Received|Recorded Payment|Fee Received)/i
                      )
                    ? "Edit Recorded Fee Payment"
                    : "Update Timeline Event Notes"}
            </Text>
            {Boolean(
              editingTimelineEvent?.event_type === "date_fee_agreed" ||
              editingTimelineEvent?.event_type === "date_fee_payment" ||
              editingTimelineEvent?.event_type === "total_fee_payment" ||
              editingTimelineEvent?.description?.match(
                /(Fee Payment Received|Recorded Payment|Fee Received|Date Fee|Date Hearing Fee)/i
              )
            ) && (
              <View style={{ width: "100%", marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: theme.colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  FEE / PAYMENT AMOUNT (₹)
                </Text>
                <TextInput
                  style={[styles.reminderInput, { minHeight: 48, height: 48 }]}
                  keyboardType="numeric"
                  value={editingTimelinePaymentAmount}
                  onChangeText={setEditingTimelinePaymentAmount}
                  placeholder="Fee / Payment Amount (₹)"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            )}
            <View style={{ width: "100%", marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: theme.colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                {editingTimelineEvent?.description?.match(
                  /(Fee Payment Received|Recorded Payment|Fee Received)/i
                )
                  ? "PAYMENT NOTE / DESCRIPTION"
                  : "EVENT NOTES"}
              </Text>
              <TextInput
                style={[styles.reminderInput, { minHeight: 70 }]}
                multiline
                numberOfLines={3}
                value={editedNotesText}
                onChangeText={setEditedNotesText}
                placeholder="Add notes or description..."
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("alert_cancel") || "Cancel"}
                  onPress={() => {
                    setShowEditNotesModal(false);
                    setEditingTimelineEvent(null);
                    setEditedNotesText("");
                    setEditingTimelinePaymentAmount("");
                  }}
                  type="secondary"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("btn_save_changes") || "Save (Edited)"}
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
              style={[
                styles.reminderInput,
                { minHeight: 48, height: 48, marginBottom: 16 },
              ]}
              keyboardType="numeric"
              value={editingTotalFee}
              onChangeText={setEditingTotalFee}
              placeholder="Enter Total Agreed Fee (₹)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
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
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {[1000, 2000, 5000, 10000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setPaymentAmount(String(amt))}
                  style={{
                    backgroundColor: theme.isDark ? "#334155" : "#F3F4F6",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.isDark ? "#E2E8F0" : "#374151",
                    }}
                  >
                    + ₹{amt.toLocaleString("en-IN")}
                  </Text>
                </TouchableOpacity>
              ))}
              {caseDetails &&
                (caseDetails.total_fee || 0) > (caseDetails.fee_paid || 0) && (
                  <TouchableOpacity
                    onPress={() =>
                      setPaymentAmount(
                        String(
                          (caseDetails.total_fee || 0) -
                            (caseDetails.fee_paid || 0)
                        )
                      )
                    }
                    style={{
                      backgroundColor: theme.isDark ? "#064E3B" : "#DCFCE7",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: theme.isDark ? "#34D399" : "#15803D",
                      }}
                    >
                      Full Balance (₹
                      {(
                        (caseDetails.total_fee || 0) -
                        (caseDetails.fee_paid || 0)
                      ).toLocaleString("en-IN")}
                      )
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
            <TextInput
              style={[
                styles.reminderInput,
                { minHeight: 48, height: 48, marginBottom: 12 },
              ]}
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="Amount Received (₹)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={[
                styles.reminderInput,
                { minHeight: 44, height: 44, marginBottom: 16 },
              ]}
              value={paymentNote}
              onChangeText={setPaymentNote}
              placeholder="Payment Note (e.g. Cash / GPay / Advance)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
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

      {/* Edit Recorded Payment Modal */}
      <Modal
        visible={showPaymentEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Recorded Fee Payment</Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Correct mistaken payment entry. An (Edited) audit tag will be
              logged.
            </Text>
            <TextInput
              style={[
                styles.reminderInput,
                { minHeight: 48, height: 48, marginBottom: 16 },
              ]}
              keyboardType="numeric"
              value={editingRecordedPayment}
              onChangeText={setEditingRecordedPayment}
              placeholder="Total Collected Fee (₹)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("alert_cancel") || "Cancel"}
                  onPress={() => setShowPaymentEditModal(false)}
                  type="secondary"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("btn_save_changes") || "Save (Edited)"}
                  onPress={handleSaveRecordedPayment}
                  type="primary"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Decided Date Hearing Fee Modal */}
      <Modal
        visible={showDateFeeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateFeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Decided Date Hearing Fee</Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Set or update the agreed fee for this specific hearing date.
            </Text>
            <TextInput
              style={[
                styles.reminderInput,
                { minHeight: 48, height: 48, marginBottom: 16 },
              ]}
              keyboardType="numeric"
              value={editingDateFeeAmount}
              onChangeText={setEditingDateFeeAmount}
              placeholder="Decided Date Fee (₹)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("alert_cancel") || "Cancel"}
                  onPress={() => setShowDateFeeModal(false)}
                  type="secondary"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("btn_save_changes") || "Save Fee"}
                  onPress={handleSaveDateFeeAmount}
                  type="primary"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Record Payment for Date Hearing Fee Modal */}
      <Modal
        visible={showDateFeePaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateFeePaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Date Fee Payment</Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Record payment received specifically for this hearing date fee.
            </Text>
            <TextInput
              style={[
                styles.reminderInput,
                { minHeight: 48, height: 48, marginBottom: 12 },
              ]}
              keyboardType="numeric"
              value={editingDateFeePaymentAmount}
              onChangeText={setEditingDateFeePaymentAmount}
              placeholder="Payment Amount Received (₹)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={[
                styles.reminderInput,
                { minHeight: 44, height: 44, marginBottom: 16 },
              ]}
              value={editingDateFeePaymentNote}
              onChangeText={setEditingDateFeePaymentNote}
              placeholder="Payment Notes / Mode (Optional)"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("alert_cancel") || "Cancel"}
                  onPress={() => setShowDateFeePaymentModal(false)}
                  type="secondary"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title="Record Payment"
                  onPress={handleRecordDateFeePayment}
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
