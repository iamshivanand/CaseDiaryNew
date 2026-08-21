import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export interface ToastNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
}

interface InAppNotificationToastProps {
  notification: ToastNotification | null;
  onDismiss: () => void;
  onPress?: (data: any) => void;
}

const AUTO_DISMISS_MS = 4500;

const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  notification,
  onDismiss,
  onPress,
}) => {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    translateY.value = withTiming(-120, { duration: 280 });
    opacity.value = withTiming(0, { duration: 280 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  }, [onDismiss, translateY, opacity]);

  useEffect(() => {
    if (!notification) return;

    // Animate in
    translateY.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.6 });
    opacity.value = withTiming(1, { duration: 220 });

    // Auto-dismiss after delay
    timerRef.current = setTimeout(() => {
      hide();
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!notification) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.toast}
        activeOpacity={0.92}
        onPress={() => {
          hide();
          onPress?.(notification.data);
        }}
      >
        {/* Left accent bar */}
        <View style={styles.accentBar} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📅</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {notification.body}
            </Text>
          </View>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={hide}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dismissText}>✕</Text>
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
    paddingTop: 52,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  toast: {
    width: width - 24,
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
  },
  accentBar: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: "#6366F1",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F1F5F9",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 16,
  },
  dismissButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  dismissText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default InAppNotificationToast;
