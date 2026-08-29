import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export interface ToastNotification {
  id: string;
  title: string;
  body: string;
  type?: "success" | "info" | "warning" | "error";
  duration?: number;
  data?: any;
  onPress?: (data: any) => void;
}

interface InAppNotificationToastProps {
  notification: ToastNotification | null;
  onDismiss: () => void;
  onPress?: (data: any) => void;
}

const TYPE_CONFIG = {
  success: {
    accentColor: "#10B981",
    bgTint: "rgba(16, 185, 129, 0.16)",
    iconName: "checkmark-circle" as const,
    iconColor: "#34D399",
  },
  info: {
    accentColor: "#3B82F6",
    bgTint: "rgba(59, 130, 246, 0.16)",
    iconName: "information-circle" as const,
    iconColor: "#60A5FA",
  },
  warning: {
    accentColor: "#F59E0B",
    bgTint: "rgba(245, 158, 11, 0.16)",
    iconName: "alert-circle" as const,
    iconColor: "#FBBF24",
  },
  error: {
    accentColor: "#EF4444",
    bgTint: "rgba(239, 68, 68, 0.16)",
    iconName: "close-circle" as const,
    iconColor: "#F87171",
  },
};

const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  notification,
  onDismiss,
  onPress,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    translateY.value = withTiming(-120, { duration: 240 });
    opacity.value = withTiming(0, { duration: 240 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  }, [onDismiss, translateY, opacity]);

  useEffect(() => {
    if (!notification) return;

    // Animate in
    translateY.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.6 });
    opacity.value = withTiming(1, { duration: 200 });

    const dismissDuration = notification.duration || 3000;

    // Auto-dismiss after delay
    timerRef.current = setTimeout(() => {
      hide();
    }, dismissDuration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification?.id, hide, notification?.duration, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!notification) return null;

  const typeConfig =
    TYPE_CONFIG[notification.type || "success"] || TYPE_CONFIG.success;

  const topOffset = Math.max(insets.top + (Platform.OS === "android" ? 10 : 6), 20);

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: topOffset },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.toast}
        activeOpacity={0.94}
        onPress={() => {
          hide();
          onPress?.(notification.data);
        }}
      >
        {/* Left accent bar */}
        <View
          style={[
            styles.accentBar,
            { backgroundColor: typeConfig.accentColor },
          ]}
        />

        {/* Content */}
        <View style={styles.content}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: typeConfig.bgTint },
            ]}
          >
            <Ionicons
              name={typeConfig.iconName}
              size={20}
              color={typeConfig.iconColor}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            {Boolean(notification.body) && (
              <Text style={styles.body} numberOfLines={2}>
                {notification.body}
              </Text>
            )}
          </View>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={hide}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color="#64748B" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  toast: {
    width: Math.min(width - 32, 420),
    backgroundColor: "#1E293B",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  accentBar: {
    width: 4,
    alignSelf: "stretch",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F1F5F9",
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  body: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 16,
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignSelf: "stretch",
    justifyContent: "center",
  },
});

export default InAppNotificationToast;

