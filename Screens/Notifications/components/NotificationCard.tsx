// Screens/Notifications/components/NotificationCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { AppNotificationRow } from "../../../DataBase/schema";
import { ThemeContext } from "../../../Providers/ThemeProvider";

interface NotificationCardProps {
  notification: AppNotificationRow;
  onPress: (notification: AppNotificationRow) => void;
  onViewCase?: (caseId: number) => void;
  onReschedule?: (caseId: number) => void;
  onDelete?: (id: number) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onViewCase,
  onReschedule,
  onDelete,
}) => {
  const { theme } = useContext(ThemeContext);

  const getRelativeTime = () => {
    if (!notification.created_at) return "";
    try {
      const d = parseISO(notification.created_at);
      if (isValid(d)) {
        return formatDistanceToNow(d, { addSuffix: true });
      }
    } catch (e) {
      // ignore
    }
    return "";
  };

  const getCategoryBadge = () => {
    switch (notification.category) {
      case "hearing":
        return {
          icon: "calendar-outline" as const,
          label: "Hearing",
          bg: theme.isDark ? "#1E3A8A" : "#EFF6FF",
          border: theme.isDark ? "#2563EB" : "#BFDBFE",
          color: theme.isDark ? "#93C5FD" : "#1D4ED8",
        };
      case "case_update":
        return {
          icon: "sync-outline" as const,
          label: "Case Update",
          bg: theme.isDark ? "#3B0764" : "#FAF5FF",
          border: theme.isDark ? "#7C3AED" : "#E9D5FF",
          color: theme.isDark ? "#C084FC" : "#6D28D9",
        };
      case "fee":
        return {
          icon: "cash-outline" as const,
          label: "Fee",
          bg: theme.isDark ? "#064E3B" : "#ECFDF5",
          border: theme.isDark ? "#059669" : "#A7F3D0",
          color: theme.isDark ? "#6EE7B7" : "#047857",
        };
      default:
        return {
          icon: "notifications-outline" as const,
          label: "System",
          bg: theme.isDark ? "#1E293B" : "#F1F5F9",
          border: theme.colors.border,
          color: theme.colors.textSecondary,
        };
    }
  };

  const badge = getCategoryBadge();
  const isUnread = notification.is_read === 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(notification)}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.cardBackground || (theme.isDark ? "#1E293B" : "#ffffff"),
          borderColor: isUnread
            ? theme.colors.primary
            : theme.colors.border || "#E2E8F0",
          borderWidth: isUnread ? 1.5 : 1,
        },
      ]}
    >
      {/* Top Row: Category Badge, Relative Time & Delete */}
      <View style={styles.topRow}>
        <View style={styles.badgeContainer}>
          {isUnread && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badge.bg,
                borderColor: badge.border,
              },
            ]}
          >
            <Ionicons name={badge.icon} size={12} color={badge.color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
            {getRelativeTime()}
          </Text>
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(notification.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="close-circle-outline" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Title & Content */}
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontWeight: isUnread ? "700" : "600",
          },
        ]}
      >
        {notification.title}
      </Text>

      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        {notification.body}
      </Text>

      {/* Quick Action Buttons */}
      {notification.case_id != null && (
        <View style={styles.actionRow}>
          {onViewCase && (
            <TouchableOpacity
              onPress={() => onViewCase(notification.case_id!)}
              activeOpacity={0.7}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF",
                  borderColor: theme.isDark ? "#4338CA" : "#C7D2FE",
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={14}
                color={theme.isDark ? "#A5B4FC" : "#4F46E5"}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: theme.isDark ? "#A5B4FC" : "#4F46E5" },
                ]}
              >
                View Case
              </Text>
            </TouchableOpacity>
          )}

          {notification.category === "hearing" && onReschedule && (
            <TouchableOpacity
              onPress={() => onReschedule(notification.case_id!)}
              activeOpacity={0.7}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.isDark ? "#0C4A6E" : "#F0F9FF",
                  borderColor: theme.isDark ? "#0284C7" : "#BAE6FD",
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={theme.isDark ? "#7DD3FC" : "#0284C7"}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: theme.isDark ? "#7DD3FC" : "#0284C7" },
                ]}
              >
                Reschedule
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  title: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 19,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

export default NotificationCard;
