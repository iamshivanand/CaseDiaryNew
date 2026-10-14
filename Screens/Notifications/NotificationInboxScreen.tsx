// Screens/Notifications/NotificationInboxScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import NotificationCard from "./components/NotificationCard";
import { getUpcomingHearingsWithPendingFee } from "../../DataBase";
import {
  getAppNotifications,
  markAppNotificationAsRead,
  markAllAppNotificationsAsRead,
  deleteAppNotification,
  clearAllAppNotifications,
} from "../../DataBase/appNotificationsDb";
import { AppNotificationRow, Case as CaseRow } from "../../DataBase/schema";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { formatDate } from "../../utils/commonFunctions";
import { emitter } from "../../utils/event-emitter";
import { promptClientNotification } from "../../utils/whatsappNotifier";

type NotificationInboxRouteProp = RouteProp<
  HomeStackParamList,
  "NotificationInbox"
>;

type FilterCategory = "all" | "unread" | "hearing" | "case_update" | "fee";

const NotificationInboxScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation<any>();
  const route = useRoute<NotificationInboxRouteProp>();

  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [feeCases, setFeeCases] = useState<CaseRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>(
    (route.params?.initialCategory as FilterCategory) || "all"
  );
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeeCases = useCallback(async () => {
    try {
      const cases = await getUpcomingHearingsWithPendingFee(14);
      setFeeCases(cases || []);
    } catch (e) {
      console.warn("Error loading pending fee cases in notifications:", e);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const rows = await getAppNotifications();
      setNotifications(rows);
    } catch (e) {
      console.error("Error loading notifications:", e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchFeeCases();

    const onUpdate = () => {
      fetchNotifications();
      fetchFeeCases();
    };
    emitter.on("caseUpdated", onUpdate);
    emitter.on("notificationsUpdated", onUpdate);

    return () => {
      emitter.off("caseUpdated", onUpdate);
      emitter.off("notificationsUpdated", onUpdate);
    };
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNotifications(), fetchFeeCases()]);
    setRefreshing(false);
  };

  const handleNotificationPress = async (item: AppNotificationRow) => {
    if (item.is_read === 0) {
      await markAppNotificationAsRead(item.id);
      emitter.emit("notificationsUpdated");
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: 1 } : n))
      );
    }

    if (item.case_id) {
      navigation.navigate("CaseDetails", { caseId: item.case_id });
    }
  };

  const handleViewCase = async (caseId: number) => {
    navigation.navigate("CaseDetails", { caseId });
  };

  const handleReschedule = async (caseId: number) => {
    navigation.navigate("CaseDetails", {
      caseId,
      autoOpenHearingModal: true,
    });
  };

  const handleDeleteItem = async (id: number) => {
    await deleteAppNotification(id);
    emitter.emit("notificationsUpdated");
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAppNotificationsAsRead();
    emitter.emit("notificationsUpdated");
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notification history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await clearAllAppNotifications();
            emitter.emit("notificationsUpdated");
            setNotifications([]);
          },
        },
      ]
    );
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.is_read === 0).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (selectedCategory === "all") return notifications;
    if (selectedCategory === "unread")
      return notifications.filter((n) => n.is_read === 0);
    return notifications.filter((n) => n.category === selectedCategory);
  }, [notifications, selectedCategory]);

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: unreadCount,
      hearing: notifications.filter((n) => n.category === "hearing").length,
      case_update: notifications.filter((n) => n.category === "case_update").length,
      fee: notifications.filter((n) => n.category === "fee").length,
    };
  }, [notifications, unreadCount]);

  const filterTabs: { key: FilterCategory; label: string; icon: string }[] = [
    { key: "all", label: `All (${counts.all})`, icon: "apps-outline" },
    { key: "unread", label: `New (${counts.unread})`, icon: "notifications-outline" },
    { key: "hearing", label: `Hearings (${counts.hearing})`, icon: "calendar-outline" },
    { key: "case_update", label: `Updates (${counts.case_update})`, icon: "sync-outline" },
    { key: "fee", label: `Fees (${counts.fee})`, icon: "cash-outline" },
  ];

  const renderFeeBannersHeader = () => {
    if (
      feeCases.length === 0 ||
      (selectedCategory !== "all" && selectedCategory !== "fee")
    ) {
      return null;
    }

    return (
      <View style={{ marginBottom: 12 }}>
        {feeCases.map((topFeeCase) => {
          const pendingAmount =
            Number(topFeeCase.total_fee || 0) -
            Number(topFeeCase.fee_paid || 0);
          const formattedDate = formatDate(topFeeCase.NextDate);

          return (
            <View
              key={`fee-nudge-${topFeeCase.id}`}
              style={{
                backgroundColor: theme.isDark ? "#064E3B" : "#ECFDF5",
                borderColor: "#10B981",
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 4,
                  marginBottom: 6,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexShrink: 1,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>💰</Text>
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 13,
                      color: theme.isDark ? "#6EE7B7" : "#065F46",
                      flexShrink: 1,
                    }}
                  >
                    Fee Recovery Reminder
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: theme.isDark ? "#A7F3D0" : "#047857",
                  }}
                >
                  Hearing: {formattedDate}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: theme.isDark ? "#A7F3D0" : "#047857",
                }}
              >
                ₹{pendingAmount.toLocaleString("en-IN")} Pending from{" "}
                {topFeeCase.ClientName || "Client"}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.isDark ? "#D1FAE5" : "#065F46",
                  opacity: 0.8,
                  marginTop: 1,
                }}
                numberOfLines={1}
              >
                Case: {topFeeCase.CaseTitle || "Legal Matter"}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() =>
                    promptClientNotification(
                      topFeeCase.id,
                      topFeeCase.NextDate,
                      `Friendly reminder regarding the hearing listed on ${formattedDate}. Pending retainer fee balance: ₹${pendingAmount.toLocaleString("en-IN")}.`
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
                  <Ionicons
                    name="logo-whatsapp"
                    size={14}
                    color="#FFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}
                  >
                    WhatsApp Client
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleViewCase(topFeeCase.id)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.isDark ? "#1E293B" : "#FFF",
                    borderColor: "#10B981",
                    borderWidth: 1,
                    paddingVertical: 7,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.isDark ? "#6EE7B7" : "#047857",
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    View Case
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background || (theme.isDark ? "#0F172A" : "#F8FAFC") },
      ]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.cardBackground || (theme.isDark ? "#1E293B" : "#FFFFFF"),
            borderBottomColor: theme.colors.border || "#E2E8F0",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Notifications & Alerts
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.headerBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.headerBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={[
                styles.markReadBtn,
                { backgroundColor: theme.isDark ? "#1E3A8A" : "#EFF6FF" },
              ]}
            >
              <Text
                style={[
                  styles.markReadBtnText,
                  { color: theme.isDark ? "#93C5FD" : "#2563EB" },
                ]}
              >
                Mark Read
              </Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.trashBtn}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.colors.textSecondary || "#64748B"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Pills */}
      <View style={styles.pillsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.pillsList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.key;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.key)}
                activeOpacity={0.7}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.isDark
                      ? "#1E293B"
                      : "#FFFFFF",
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border || "#E2E8F0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: isSelected
                        ? "#FFFFFF"
                        : theme.colors.textSecondary || "#64748B",
                      fontWeight: isSelected ? "700" : "600",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderFeeBannersHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={handleNotificationPress}
            onViewCase={handleViewCase}
            onReschedule={handleReschedule}
            onDelete={handleDeleteItem}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={56}
              color={theme.colors.textSecondary || "#94A3B8"}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {selectedCategory === "all"
                ? "No Notifications"
                : `No ${selectedCategory.replace("_", " ")} alerts`}
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: theme.colors.textSecondary || "#64748B" },
              ]}
            >
              You are all caught up! When new hearings or case milestones occur,
              they will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingRight: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  markReadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markReadBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  trashBtn: {
    padding: 4,
  },
  pillsContainer: {
    paddingVertical: 10,
  },
  pillsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});

export default NotificationInboxScreen;
