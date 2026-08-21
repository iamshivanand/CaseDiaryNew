import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Pressable,
  DeviceEventEmitter,
  Alert,
} from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import * as db from "../../DataBase";
import { useTranslation } from "../../Providers/LanguageProvider";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { CaseData, CaseDataScreen } from "../../Types/appTypes";
import { CASE_UPDATED_EVENT } from "../../utils/caseEvents";
import { mapCaseDbToScreen } from "../../utils/caseMapper";
import {
  getCurrentUserId,
  formatDate,
  getLocalDateString,
  normalizeDateToYYYYMMDD,
} from "../../utils/commonFunctions";
import dbCacheManager from "../../utils/dbCacheManager";
import { exportDailyCauseListToPdf } from "../../utils/pdfExporter";
import { promptClientNotification } from "../../utils/whatsappNotifier";
import UpdateHearingPopup from "../CaseDetailsScreen/components/UpdateHearingPopup";
import { VoiceCaseNoteModal } from "../CommonComponents/VoiceCaseNoteModal";
import NewCaseCard from "../CasesList/components/NewCaseCard";
import { useAdTrigger } from "../CommonComponents/AdManager";
import { CauseListCustomizerModal } from "../CommonComponents/CauseListCustomizerModal";
import { SkeletonCard } from "../CommonComponents/SkeletonLoader";
import SectionHeader from "../CommonComponents/SectionHeader";
import VoiceSearchBar from "../CommonComponents/VoiceSearchBar";
import NotificationBellButton from "../CommonComponents/NotificationBellButton";

const WelcomeCard = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [userName, setUserName] = useState("User");
  const today = new Date();
  const formattedDate = format(today, "eeee, MMMM d, yyyy");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const database = await db.getDb();
        const userId = await AsyncStorage.getItem("@user_id");
        if (userId) {
          const profile = await db.getUserProfile(
            database,
            parseInt(userId, 10)
          );
          if (profile && profile.name) {
            setUserName(profile.name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user name for WelcomeCard:", error);
      }
    };
    fetchUserName();
  }, []);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      return { text: t("dash_greeting_morning"), emoji: "☀️" };
    } else if (hours >= 12 && hours < 17) {
      return { text: t("dash_greeting_afternoon"), emoji: "🌤️" };
    } else if (hours >= 17 && hours < 21) {
      return { text: t("dash_greeting_evening"), emoji: "🌆" };
    } else {
      return { text: t("dash_greeting_evening"), emoji: "🌙" };
    }
  };

  const greeting = getGreeting();

  const welcomeGradient = theme.dark
    ? ["#312E81", "#0F172A"] // Premium dark Indigo-Slate gradient
    : ["#6366F1", "#312E81"]; // Premium Indigo gradient for light mode

  return (
    <LinearGradient
      colors={welcomeGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.welcomeCard,
        {
          borderBottomWidth: 0,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.welcomeTitle, { color: "#FFFFFF" }]}>
            {greeting.emoji} {greeting.text}, {userName}!
          </Text>
          <Text
            style={[
              styles.welcomeSubtitle,
              { color: "rgba(255, 255, 255, 0.85)" },
            ]}
          >
            {formattedDate}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: 20,
            padding: 2,
          }}
        >
          <NotificationBellButton color="#FFFFFF" size={22} />
        </View>
      </View>
    </LinearGradient>
  );
};

const QuickActionButton = ({
  icon,
  text,
  onPress,
  color,
  badgeCount,
  badgeColor,
}: any) => {
  const { theme } = useContext(ThemeContext);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
      onPress={onPress}
      style={{ flex: 1, minWidth: "45%", margin: 6 }}
    >
      <Animated.View
        style={[
          styles.quickAction,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.dark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.04)",
            borderWidth: 1,
            overflow: "hidden", // Clip absolute watermark within rounded borders
            margin: 0,
            width: "100%",
          },
          animatedStyle,
        ]}
      >
        {/* Notification badge with count */}
        {badgeCount !== undefined && badgeCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: badgeColor || "#EF4444",
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              paddingHorizontal: 6,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 4,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>
              {badgeCount > 99 ? "99+" : badgeCount}
            </Text>
          </View>
        )}

        {/* Subtle Background Watermark Icon */}
        <Ionicons
          name={icon}
          size={64}
          color={color}
          style={{
            position: "absolute",
            right: -10,
            bottom: -10,
            opacity: theme.dark ? 0.06 : 0.03,
          }}
        />

        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: `${color}12`,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 10,
            zIndex: 2,
          }}
        >
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text
          style={[
            styles.quickActionText,
            { color: theme.colors.text, zIndex: 2 },
          ]}
          numberOfLines={2}
        >
          {text}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const BackupReminderBanner = () => {
  const navigation = useNavigation<any>();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkBackupStatus = async () => {
      try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Weekly backup reminder is shown ONLY on weekends (Saturday/Sunday)
        if (!isWeekend) {
          setShowBanner(false);
          return;
        }

        const lastBackup = await AsyncStorage.getItem("@last_backup_timestamp");
        if (!lastBackup) {
          setShowBanner(true);
          return;
        }
        const lastDate = new Date(lastBackup);
        const diffDays = Math.floor(
          (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
        );
        if (diffDays >= 5) {
          setShowBanner(true);
        } else {
          setShowBanner(false);
        }
      } catch (e) {
        console.warn("Failed to check backup timestamp:", e);
      }
    };
    checkBackupStatus();
  }, []);

  const handleBackupNow = async () => {
    await AsyncStorage.setItem(
      "@last_backup_timestamp",
      new Date().toISOString()
    );
    setShowBanner(false);
    navigation.navigate("SettingsScreen" as any);
  };

  if (!showBanner) return null;

  return (
    <View
      style={{
        backgroundColor: "#FEF3C7",
        borderColor: "#F59E0B",
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          marginRight: 8,
        }}
      >
        <Ionicons
          name="shield-checkmark"
          size={24}
          color="#D97706"
          style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 13, color: "#92400E" }}>
            Weekly Backup Reminder
          </Text>
          <Text style={{ fontSize: 12, color: "#B45309" }}>
            Keep your cases safe. Export a local backup now.
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handleBackupNow}
        style={{
          backgroundColor: "#D97706",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>
          Backup
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const LimitationWarningBanner = () => {
  const navigation = useNavigation<any>();
  const [limitationCases, setLimitationCases] = useState<any[]>([]);

  const fetchLimitations = async () => {
    try {
      const cases = await db.getExpiringLimitationCases(30);
      setLimitationCases(cases);
    } catch (e) {
      console.warn("Failed to fetch expiring limitation cases:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLimitations();
    }, [])
  );

  if (limitationCases.length === 0) return null;

  const topCase = limitationCases[0];
  const [lYear, lMonth, lDay] = topCase.StatuteOfLimitations.split("-").map(Number);
  const limDate = new Date(lYear, lMonth - 1, lDay);
  const diffDays = Math.max(
    0,
    Math.ceil((limDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate("CaseDetails", { caseId: topCase.id })}
      style={{
        backgroundColor: "#FEF2F2",
        borderColor: "#EF4444",
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons
        name="alert-circle"
        size={24}
        color="#DC2626"
        style={{ marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontWeight: "800", fontSize: 13, color: "#991B1B" }}>
            🚨 Limitation Period Expiring
          </Text>
          <View
            style={{
              backgroundColor: "#DC2626",
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "800" }}>
              {diffDays === 0 ? "TODAY" : `${diffDays}d left`}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: "#7F1D1D", marginTop: 2 }} numberOfLines={1}>
          {topCase.CaseTitle || "Case"} • Client: {topCase.ClientName || "Client"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#DC2626" />
    </TouchableOpacity>
  );
};

const UpcomingFeeRecoveryNudge = () => {
  const navigation = useNavigation<any>();
  const [feeCases, setFeeCases] = useState<any[]>([]);

  const fetchFeeCases = async () => {
    try {
      const cases = await db.getUpcomingHearingsWithPendingFee(7);
      setFeeCases(cases);
    } catch (e) {
      console.warn("Failed to fetch pending fee cases:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFeeCases();
    }, [])
  );

  if (feeCases.length === 0) return null;

  const topFeeCase = feeCases[0];
  const pendingAmount =
    Number(topFeeCase.total_fee || 0) - Number(topFeeCase.fee_paid || 0);

  return (
    <View
      style={{
        backgroundColor: "#ECFDF5",
        borderColor: "#10B981",
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>💰</Text>
          <Text style={{ fontWeight: "700", fontSize: 13, color: "#065F46" }}>
            Upcoming Fee Recovery Nudge
          </Text>
        </View>
        <Text style={{ fontSize: 11, fontWeight: "600", color: "#047857" }}>
          Hearing: {topFeeCase.NextDate}
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#047857" }}>
        ₹{pendingAmount.toLocaleString("en-IN")} Pending from {topFeeCase.ClientName || "Client"}
      </Text>
      <Text style={{ fontSize: 11, color: "#065F46", opacity: 0.8, marginTop: 1 }} numberOfLines={1}>
        Case: {topFeeCase.CaseTitle || "Legal Matter"}
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        <TouchableOpacity
          onPress={() =>
            promptClientNotification(
              topFeeCase.id,
              topFeeCase.NextDate,
              `Friendly reminder regarding the hearing listed on ${topFeeCase.NextDate}. Pending retainer fee balance: ₹${pendingAmount.toLocaleString("en-IN")}.`
            )
          }
          style={{
            flex: 1,
            backgroundColor: "#10B981",
            paddingVertical: 7,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="logo-whatsapp" size={14} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>
            WhatsApp Client
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("CaseDetails", { caseId: topFeeCase.id })
          }
          style={{
            flex: 1,
            backgroundColor: "#FFF",
            borderColor: "#10B981",
            borderWidth: 1,
            paddingVertical: 7,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#047857", fontSize: 12, fontWeight: "700" }}>
            View Case
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuickActionsGrid = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [undatedCount, setUndatedCount] = useState(0);

  const [countsLoaded, setCountsLoaded] = useState(false);

  const fetchCounts = async () => {
    try {
      const yCount = await db.getYesterdaysCasesCount();
      const uCount = await db.getUndatedCasesCount();
      setYesterdayCount(yCount);
      setUndatedCount(uCount);
      setCountsLoaded(true);
    } catch (e) {
      console.error("Error fetching quick action counts:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (dbCacheManager.shouldRefreshCounts(countsLoaded)) {
        fetchCounts();
      }
    }, [countsLoaded])
  );

  useEffect(() => {
    let isMounted = true;
    const sub = DeviceEventEmitter.addListener(CASE_UPDATED_EVENT, () => {
      if (isMounted) fetchCounts();
    });
    return () => {
      isMounted = false;
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, []);

  const actions = [
    {
      icon: "add-circle",
      text: t("dash_add_case"),
      onPress: () => navigation.navigate("AddCase" as any),
      color: "#00CC44",
    },
    {
      icon: "folder-open",
      text: t("dash_view_all_cases"),
      onPress: () => navigation.navigate("AllCases" as any),
      color: "#007BFF",
    },
    {
      icon: "briefcase",
      text: t("dash_drafts_hub") || "Document Hub",
      onPress: () => navigation.navigate("DraftsHub" as any),
      color: "#8B5CF6",
    },
    {
      icon: "camera",
      text: "PDF Scanner",
      onPress: () => navigation.navigate("PdfScanner" as any),
      color: "#EC4899",
    },
    {
      icon: "calendar",
      text: t("dash_yesterdays_cases"),
      onPress: () => navigation.navigate("YesterdaysCases" as any),
      color: "#007BFF",
      badgeCount: yesterdayCount,
      badgeColor: "#F97316",
    },
    {
      icon: "alert-circle",
      text: t("dash_undated_cases"),
      onPress: () => navigation.navigate("UndatedCases" as any),
      color: "#FF6B00",
      badgeCount: undatedCount,
      badgeColor: "#EF4444",
    },
  ];

  return (
    <View style={{ marginBottom: 12 }}>
      <LimitationWarningBanner />
      <UpcomingFeeRecoveryNudge />
      <BackupReminderBanner />
      <SectionHeader title={t("dash_quick_actions")} />
      <View
        style={[
          styles.quickActionsContainer,
          { flexWrap: "wrap", flexDirection: "row" },
        ]}
      >
        {actions.map((action, index) => (
          <Animated.View
            key={action.text}
            entering={FadeInDown.delay(index * 30)
              .springify()
              .damping(20)
              .stiffness(300)}
            style={{ width: "50%" }}
          >
            <QuickActionButton {...action} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const AnimatedNewCaseCard = ({
  caseDetails,
  onUpdateHearingPress,
  onLongPress,
  index,
}: any) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30)
        .springify()
        .damping(20)
        .stiffness(300)}
    >
      <NewCaseCard
        caseDetails={caseDetails}
        onUpdateHearingPress={onUpdateHearingPress}
        onLongPress={onLongPress}
      />
    </Animated.View>
  );
};

const TodaysCasesSection = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [todaysCases, setTodaysCases] = useState<CaseDataScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { showAdWithPreload } = useAdTrigger();
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDataScreen | null>(null);
  const [noteCase, setNoteCase] = useState<CaseDataScreen | null>(null);
  const [isCauseListModalVisible, setIsCauseListModalVisible] = useState(false);

  const fetchTodaysCases = async () => {
    try {
      const dbCases = await db.getCases(null, -1, 0, { dateFilter: "today" });
      const mappedCases: CaseDataScreen[] = dbCases.map(mapCaseDbToScreen);
      setTodaysCases(mappedCases);
    } catch (error) {
      console.error("Error fetching today's cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (dbCacheManager.shouldRefreshCases(!loading)) {
        fetchTodaysCases();
      }
    }, [loading])
  );

  useEffect(() => {
    let isMounted = true;
    const sub = DeviceEventEmitter.addListener(CASE_UPDATED_EVENT, () => {
      if (isMounted) fetchTodaysCases();
    });
    return () => {
      isMounted = false;
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, []);

  const handleUpdateHearing = (caseDetails: CaseDataScreen) => {
    setSelectedCase(caseDetails);
    setPopupVisible(true);
  };

  const handleSaveHearing = async (
    notes: string,
    nextHearingDate: Date,
    userId: number,
    dateFeeCollectedToday?: number,
    totalFeeCollectedToday?: number,
    paymentMode?: string,
    paymentNotes?: string
  ) => {
    if (!selectedCase || !selectedCase.id) return;
    const caseId = parseInt(selectedCase.id.toString(), 10);
    if (isNaN(caseId)) return;

    try {
      const caseExists = await db.getCaseById(caseId);
      if (!caseExists) {
        console.error("Case not found");
        return;
      }

      const nowIso = new Date().toISOString();
      const modeTag = paymentMode ? paymentMode : "Cash";
      const noteTag =
        paymentNotes && paymentNotes.trim() ? ` - ${paymentNotes.trim()}` : "";

      if (notes && notes.trim()) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: nowIso,
          notes: notes.trim(),
          event_type: "hearing_proceeding",
        });
      }

      if (dateFeeCollectedToday && dateFeeCollectedToday > 0) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: nowIso,
          notes: `Fee Payment Received (Date Fee): ₹${dateFeeCollectedToday.toLocaleString("en-IN")} [Mode: ${modeTag}]${noteTag}`,
          event_type: "date_fee_payment",
          amount: dateFeeCollectedToday,
          payment_mode: modeTag,
        });
      }

      if (totalFeeCollectedToday && totalFeeCollectedToday > 0) {
        await db.addCaseTimelineEvent({
          case_id: caseId,
          hearing_date: nowIso,
          notes: `Fee Payment Received (Total Retainer): ₹${totalFeeCollectedToday.toLocaleString("en-IN")} [Mode: ${modeTag}]${noteTag}`,
          event_type: "total_fee_payment",
          amount: totalFeeCollectedToday,
          payment_mode: modeTag,
        });
      }

      const updatedDateFeeCollected =
        ((caseExists as any).date_fee_collected || 0) +
        (dateFeeCollectedToday || 0);
      const updatedTotalFeePaid =
        (caseExists.fee_paid || 0) + (totalFeeCollectedToday || 0);
      const targetDateFee = (caseExists as any).date_fee || 0;
      const isDateFeePaidNow =
        targetDateFee > 0 && updatedDateFeeCollected >= targetDateFee
          ? 1
          : (caseExists as any).date_fee_paid || 0;

      await db.updateCase(
        caseId,
        {
          NextDate: getLocalDateString(nextHearingDate),
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
        userId
      );

      fetchTodaysCases();

      setTimeout(() => {
        promptClientNotification(
          caseId,
          getLocalDateString(nextHearingDate),
          notes
        );
      }, 500);
    } catch (error) {
      console.error("Error updating hearing:", error);
    }
  };

  const handleShareCauseList = () => {
    if (todaysCases.length === 0) {
      Alert.alert(
        "Empty Cause List",
        "There are no cases scheduled for today to export."
      );
      return;
    }
    setIsCauseListModalVisible(true);
  };

  const handleGenerateCauseList = async (
    selectedFields: string[],
    sortField?: string,
    sortDirection?: "asc" | "desc"
  ) => {
    try {
      await showAdWithPreload("rewarded", async (success) => {
        if (success) {
          try {
            const todayStr = format(new Date(), "eeee, MMMM d, yyyy");
            const filteredDbCases = await db.getCases(null, -1, 0, {
              dateFilter: "today",
            });
            await exportDailyCauseListToPdf(
              filteredDbCases,
              todayStr,
              navigation,
              selectedFields,
              sortField,
              sortDirection
            );
          } catch (error) {
            Alert.alert(
              "Export Failed",
              "Could not compile the daily cause list PDF."
            );
          }
        }
      });
    } catch (adError) {
      console.warn("Ad preloading or display encountered an error:", adError);
    }
  };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          marginTop: 8,
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text, marginTop: 0, marginBottom: 0 },
          ]}
        >
          {t("dash_todays_cases")}
        </Text>
        {todaysCases.length > 0 && (
          <TouchableOpacity
            onPress={handleShareCauseList}
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.primary,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 20,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons
              name="share-social"
              size={16}
              color="#FFF"
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "bold" }}>
              {t("dash_share_list")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <View style={{ marginTop: 4 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : todaysCases.length > 0 ? (
        todaysCases.map((caseData, index) => (
          <AnimatedNewCaseCard
            key={`${caseData.id}-${(caseData as any).updated_at || ""}-${(caseData as any).fee_paid || 0}-${(caseData as any).date_fee_collected || 0}-${(caseData as any).date_fee_paid || 0}-${(caseData as any).date_fee || 0}-${caseData.nextHearing || ""}`}
            caseDetails={caseData}
            onUpdateHearingPress={() => handleUpdateHearing(caseData)}
            onLongPress={() => {
              setNoteCase(caseData);
              setNoteModalVisible(true);
            }}
            index={index}
          />
        ))
      ) : (
        <View
          style={{
            padding: 24,
            alignItems: "center",
            backgroundColor: theme.colors.cardBackground,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginTop: 10,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={40}
            color={theme.colors.textSecondary}
            style={{ marginBottom: 8, opacity: 0.6 }}
          />
          <Text
            style={{
              color: theme.colors.textSecondary,
              textAlign: "center",
              fontSize: 15,
              fontWeight: "500",
            }}
          >
            {t("dash_no_cases")}
          </Text>
        </View>
      )}
      {selectedCase && (
        <UpdateHearingPopup
          visible={isPopupVisible}
          onClose={() => setPopupVisible(false)}
          onSave={async (
            notes,
            nextHearingDate,
            dateFeeCollectedToday,
            totalFeeCollectedToday,
            paymentMode,
            paymentNotes
          ) =>
            handleSaveHearing(
              notes,
              nextHearingDate,
              await getCurrentUserId(),
              dateFeeCollectedToday,
              totalFeeCollectedToday,
              paymentMode,
              paymentNotes
            )
          }
        />
      )}
      {noteCase && (
        <VoiceCaseNoteModal
          visible={isNoteModalVisible}
          caseId={parseInt(noteCase.id.toString(), 10)}
          caseTitle={noteCase.title || "Legal Matter"}
          existingNextHearingDate={noteCase.nextHearing}
          onClose={() => {
            setNoteModalVisible(false);
            setNoteCase(null);
          }}
          onSave={async (data) => {
            const caseId = parseInt(noteCase.id.toString(), 10);
            if (isNaN(caseId)) return;
            const nowIso = new Date().toISOString();
            if (data.notes && data.notes.trim()) {
              await db.addCaseTimelineEvent({
                case_id: caseId,
                hearing_date: nowIso,
                notes: data.notes.trim(),
                event_type: "hearing_note",
              });
            }
            if (data.updateNextDate && data.nextHearingDate) {
              await db.updateCase(
                caseId,
                { NextDate: data.nextHearingDate },
                await getCurrentUserId()
              );
            }
            setNoteModalVisible(false);
            setNoteCase(null);
            fetchTodaysCases();
          }}
        />
      )}
      <CauseListCustomizerModal
        visible={isCauseListModalVisible}
        onClose={() => setIsCauseListModalVisible(false)}
        onGenerate={handleGenerateCauseList}
        title="Customize Today's Cause List"
      />
    </View>
  );
};

const DashboardScreen = () => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchStart = (query: string) => {
    setSearchQuery(query);
    if (query && query.length > 0) {
      navigation.navigate("SearchTab", {
        screen: "SearchScreen",
        params: { initialQuery: query, autoFocus: true, fromDashboard: true },
      });
    }
  };

  const handleFocus = () => {
    navigation.navigate("SearchTab", {
      screen: "SearchScreen",
      params: {
        initialQuery: searchQuery,
        autoFocus: true,
        fromDashboard: true,
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.content}>
          <WelcomeCard />
          <VoiceSearchBar
            value={searchQuery}
            onChangeText={handleSearchStart}
            onFocus={handleFocus}
            placeholder="🎙️ Search cases by name, CNR, or client..."
            onClear={() => setSearchQuery("")}
          />
          <QuickActionsGrid />
          <TodaysCasesSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAction: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: "48%",
    minHeight: 115,
    marginBottom: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },

  adLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  adMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  adButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  adButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
  },
});

export default DashboardScreen;
