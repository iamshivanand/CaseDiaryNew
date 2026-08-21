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
import {
  getAppNotifications,
  markAppNotificationAsRead,
  markAllAppNotificationsAsRead,
  deleteAppNotification,
  clearAllAppNotifications,
} from "../../DataBase/appNotificationsDb";
import { AppNotificationRow } from "../../DataBase/schema";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { HomeStackParamList } from "../../Types/navigationtypes";
import { emitter } from "../../utils/event-emitter";

type NotificationInboxRouteProp = RouteProp<
  HomeStackParamList,
  "NotificationInbox"
>;

type FilterCategory = "all" | "hearing" | "case_update" | "fee";

const NotificationInboxScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation<any>();
  const route = useRoute<NotificationInboxRouteProp>();

  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>(
    (route.params?.initialCategory as FilterCategory) || "all"
  );
  const [refreshing, setRefreshing] = useState(false);

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

    const onUpdate = () => fetchNotifications();
    emitter.on("caseUpdated", onUpdate);
    emitter.on("notificationsUpdated", onUpdate);

    return () => {
      emitter.off("caseUpdated", onUpdate);
      emitter.off("notificationsUpdated", onUpdate);
    };
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
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

  const filteredNotifications = useMemo(() => {
    if (selectedCategory === "all") return notifications;
    return notifications.filter((n) => n.category === selectedCategory);
  }, [notifications, selectedCategory]);

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      hearing: notifications.filter((n) => n.category === "hearing").length,
      case_update: notifications.filter((n) => n.category === "case_update").length,
      fee: notifications.filter((n) => n.category === "fee").length,
    };
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.is_read === 0).length;
  }, [notifications]);

  const filterTabs: { key: FilterCategory; label: string; icon: string }[] = [
    { key: "all", label: `All (${counts.all})`, icon: "apps-outline" },
    { key: "hearing", label: `Hearings (${counts.hearing})`, icon: "calendar-outline" },
    { key: "case_update", label: `Updates (${counts.case_update})`, icon: "sync-outline" },
    { key: "fee", label: `Fees (${counts.fee})`, icon: "cash-outline" },
  ];

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
