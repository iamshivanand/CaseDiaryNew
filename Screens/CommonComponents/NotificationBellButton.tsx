// Screens/CommonComponents/NotificationBellButton.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect, useState, useCallback } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

import { getUnreadAppNotificationsCount } from "../../DataBase/appNotificationsDb";
import { ThemeContext } from "../../Providers/ThemeProvider";
import { emitter } from "../../utils/event-emitter";

interface NotificationBellButtonProps {
  color?: string;
  size?: number;
}

const NotificationBellButton: React.FC<NotificationBellButtonProps> = ({
  color,
  size = 22,
}) => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation<any>();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadAppNotificationsCount();
      setUnreadCount(count);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const onCaseUpdate = () => fetchUnreadCount();
    emitter.on("caseUpdated", onCaseUpdate);
    emitter.on("notificationsUpdated", onCaseUpdate);

    const unsubscribeFocus = navigation.addListener("focus", () => {
      fetchUnreadCount();
    });

    return () => {
      emitter.off("caseUpdated", onCaseUpdate);
      emitter.off("notificationsUpdated", onCaseUpdate);
      unsubscribeFocus();
    };
  }, [fetchUnreadCount, navigation]);

  const handlePress = () => {
    navigation.navigate("NotificationInbox");
  };

  const iconColor = color || theme.colors.text;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={styles.container}
    >
      <Ionicons
        name={unreadCount > 0 ? "notifications" : "notifications-outline"}
        size={size}
        color={iconColor}
      />
      {unreadCount > 0 && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: "#EF4444",
              borderColor: theme.colors.cardBackground || "#ffffff",
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 11,
  },
});

export default NotificationBellButton;
