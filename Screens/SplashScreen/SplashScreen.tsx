import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface SplashScreenProps {
  isReady?: boolean;
  startAnimation?: boolean;
  onAnimationComplete?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  isReady,
  startAnimation = true,
  onAnimationComplete,
}) => {
  const notifyComplete = React.useCallback(() => {
    console.log("[SplashFlow] 4. Scale balance animation completed, transitioning to Dashboard");
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  }, [onAnimationComplete]);

  // Screen container fade-out for seamless dashboard handoff
  const containerOpacity = useSharedValue(1);

  // Scale of Balance equilibrium motion
  const scaleRotate = useSharedValue(0);

  // Typography & accent line
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(10);
  const lineWidth = useSharedValue(0);
  const lineOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  // Start animation ONLY when native splash is dismissed (startAnimation = true)
  useEffect(() => {
    if (startAnimation) {
      console.log("[SplashFlow] 2. Native splash dismissed: Starting Scales of Balance animation in full view");

      // 1. Text entrance
      textOpacity.value = withDelay(150, withTiming(1, { duration: 350 }));
      textTranslateY.value = withDelay(
        150,
        withSpring(0, { damping: 18, stiffness: 180, mass: 0.7 })
      );

      lineOpacity.value = withDelay(300, withTiming(0.85, { duration: 300 }));
      lineWidth.value = withDelay(
        300,
        withSpring(48, { damping: 15, stiffness: 130 })
      );

      footerOpacity.value = withDelay(350, withTiming(1, { duration: 400 }));

      // 2. Full natural Scales of Justice balance animation sequence
      scaleRotate.value = withSequence(
        withTiming(2.8, { duration: 320, easing: Easing.out(Easing.quad) }),
        withTiming(-2.0, { duration: 360, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.9, { duration: 280, easing: Easing.inOut(Easing.quad) }),
        withSpring(0, { damping: 14, stiffness: 120, mass: 0.6 })
      );
    }
  }, [startAnimation]);

  // When app signals ready and animation is started, fade out gracefully after full balance sequence
  useEffect(() => {
    if (isReady && startAnimation) {
      console.log("[SplashFlow] 3. Background services ready: Waiting for smooth exit transition");
      containerOpacity.value = withDelay(
        1100, // Guarantees the complete 4-stage balance animation sequence is visible to the user
        withTiming(0, { duration: 220 }, (finished) => {
          if (finished) {
            runOnJS(notifyComplete)();
          }
        })
      );
    }
  }, [isReady, startAnimation, notifyComplete]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
    };
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${scaleRotate.value}deg` },
      ] as [{ rotate: string }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  const lineAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: lineOpacity.value,
      width: lineWidth.value,
    };
  });

  const footerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: footerOpacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <StatusBar style="light" translucent backgroundColor="#0F172A" />

      {/* 
        Exact Center Layer: 
        Places the 100dp Scale at EXACT vertical & horizontal screen center,
        matching the native Android splash screen 1-to-1 without any layout shift.
      */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.centerAlignmentWrapper}>
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <Image
              source={require("../../assets/splash.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>

      {/* 
        Typography Layer:
        Positioned below the center logo without shifting the logo's center coordinates.
      */}
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.title}>ADVOCASE</Text>

        {/* Subtle Golden Accent Underline */}
        <Animated.View style={[styles.goldenLine, lineAnimatedStyle]} />

        <Text style={styles.subtitle}>Your Digital Court Companion</Text>
      </Animated.View>

      {/* Footer Branding */}
      <Animated.View style={[styles.footer, footerAnimatedStyle]}>
        <Text style={styles.footerText}>Secure • Digital • Offline</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  centerAlignmentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 100,
    height: 100,
    maxWidth: 100,
    maxHeight: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  logoImage: {
    width: 100,
    height: 100,
    maxWidth: 100,
    maxHeight: 100,
  },
  textContainer: {
    position: "absolute",
    top: "50%",
    marginTop: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 4,
    textAlign: "center",
  },
  goldenLine: {
    height: 2,
    backgroundColor: "#F59E0B",
    borderRadius: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5,
    textAlign: "center",
    fontWeight: "400",
  },
  footer: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
});

export default SplashScreen;

