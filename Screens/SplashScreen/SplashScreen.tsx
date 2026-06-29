import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const SplashScreen = () => {
  const logoScale = useSharedValue(0);
  const gavelRotate = useSharedValue(-60);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Logo container scales up with spring bounce
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    
    // 2. Ripple ring effect scaling out
    ringScale.value = withTiming(1.4, { duration: 1500 });
    ringOpacity.value = withSequence(
      withTiming(0.6, { duration: 400 }),
      withTiming(0, { duration: 1100 })
    );

    // 3. Gavel rotation strike animation
    gavelRotate.value = withDelay(
      350,
      withSpring(0, { damping: 8, stiffness: 80 })
    );

    // 4. Text slide-up & fade-in animations
    textOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    textTranslateY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 100 }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const ringAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringScale.value }],
      opacity: ringOpacity.value,
    };
  });

  const gavelAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${gavelRotate.value}deg` }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  return (
    <LinearGradient
      colors={["#0F172A", "#1E1B4B", "#0F172A"]} // Sleek dark Indigo-Slate gradient
      style={styles.container}
    >
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.logoOuterContainer}>
        {/* Animated Ripple Ring */}
        <Animated.View style={[styles.rippleRing, ringAnimatedStyle]} />

        {/* Animated Logo Container */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Animated.View style={gavelAnimatedStyle}>
            <Icon name="gavel" size={50} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      </View>

      {/* Animated Text Container */}
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.title}>LAWYERS DIARY</Text>
        <Text style={styles.subtitle}>Your Digital Court Companion</Text>
      </Animated.View>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure • Digital • Offline</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoOuterContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  rippleRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.4)",
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#6366F1", // Indigo primary accent color
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 8,
    letterSpacing: 1,
    textAlign: "center",
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
});

export default SplashScreen;
