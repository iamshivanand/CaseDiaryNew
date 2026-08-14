import React, { useEffect, useRef, useContext } from "react";
import { View, Animated, ViewStyle, StyleSheet } from "react-native";

import { ThemeContext } from "../../Providers/ThemeProvider";

export const SkeletonItem: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useContext(ThemeContext);
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  const skeletonColor = theme.dark ? "#27272A" : "#E2E8F0";

  return (
    <Animated.View
      style={[
        {
          backgroundColor: skeletonColor,
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <View
      style={{
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <SkeletonItem style={{ width: "60%", height: 18, borderRadius: 6 }} />
        <SkeletonItem style={{ width: 64, height: 22, borderRadius: 12 }} />
      </View>
      <SkeletonItem
        style={{ width: "40%", height: 14, marginBottom: 14, borderRadius: 4 }}
      />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <SkeletonItem style={{ flex: 1, height: 40, borderRadius: 10 }} />
        <SkeletonItem style={{ flex: 1, height: 40, borderRadius: 10 }} />
      </View>
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </View>
  );
};

export const SkeletonForm: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: rows }).map((_, idx) => (
        <View key={idx} style={{ marginBottom: 18 }}>
          <SkeletonItem
            style={{
              width: "35%",
              height: 14,
              marginBottom: 8,
              borderRadius: 4,
            }}
          />
          <SkeletonItem
            style={{ width: "100%", height: 48, borderRadius: 12 }}
          />
        </View>
      ))}
    </View>
  );
};

export const SkeletonTemplateCard: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <View
      style={{
        flex: 1,
        margin: 6,
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {/* Miniature Document Preview Skeleton */}
      <SkeletonItem
        style={{
          width: 58,
          height: 84,
          borderRadius: 4,
          marginBottom: 10,
        }}
      />
      {/* Title Placeholder */}
      <SkeletonItem
        style={{
          width: "80%",
          height: 14,
          borderRadius: 4,
          marginBottom: 6,
        }}
      />
      <SkeletonItem
        style={{
          width: "55%",
          height: 12,
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      {/* Pill Badge Placeholder */}
      <SkeletonItem
        style={{
          width: 64,
          height: 18,
          borderRadius: 9,
        }}
      />
    </View>
  );
};

export const SkeletonTemplateGrid: React.FC<{ count?: number }> = ({
  count = 6,
}) => {
  const pairs = Array.from({ length: Math.ceil(count / 2) });
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 12 }}>
      {pairs.map((_, rowIdx) => (
        <View
          key={rowIdx}
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <SkeletonTemplateCard />
          <SkeletonTemplateCard />
        </View>
      ))}
    </View>
  );
};

