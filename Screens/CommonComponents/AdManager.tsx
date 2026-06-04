import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Modal, ActivityIndicator, TouchableOpacity, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RewardedAd, InterstitialAd, TestIds, AdEventType, RewardedAdEventType } from "react-native-google-mobile-ads";
import { ThemeContext } from "../../Providers/ThemeProvider";
import ActionButton from "./ActionButton";

const rewardedAdUnitId = __DEV__
  ? TestIds.REWARDED
  : Platform.OS === "ios"
  ? "ca-app-pub-3940256099942544/1712485313"
  : "ca-app-pub-3940256099942544/5224354917";

const interstitialAdUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === "ios"
  ? "ca-app-pub-3940256099942544/4411468910"
  : "ca-app-pub-3940256099942544/1033173712";

// Create single global instances
let rewardedAd = RewardedAd.createForAdRequest(rewardedAdUnitId, { requestNonPersonalizedAdsOnly: true });
let interstitialAd = InterstitialAd.createForAdRequest(interstitialAdUnitId, { requestNonPersonalizedAdsOnly: true });

// Preload helper
const preloadAds = () => {
  try {
    rewardedAd.load();
    interstitialAd.load();
  } catch (e) {
    console.warn("Failed to preload ads:", e);
  }
};

// Initial load
preloadAds();

interface AdContextProps {
  showAdWithPreload: (
    adType: "rewarded" | "interstitial",
    onComplete: (success: boolean) => void
  ) => Promise<void>;
}

const AdContext = createContext<AdContextProps | null>(null);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(8);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const skipBtnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteCallbackRef = useRef<((success: boolean) => void) | null>(null);
  const eventUnsubscribesRef = useRef<(() => void)[]>([]);

  // Cleanup timers and subscriptions
  const cleanUpAdRequest = () => {
    setLoading(false);
    setShowSkip(false);
    setSecondsRemaining(8);
    if (timerRef.current) clearInterval(timerRef.current);
    if (skipBtnTimerRef.current) clearTimeout(skipBtnTimerRef.current);
    eventUnsubscribesRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {}
    });
    eventUnsubscribesRef.current = [];
  };

  const handleSkipOrTimeout = () => {
    cleanUpAdRequest();
    if (onCompleteCallbackRef.current) {
      onCompleteCallbackRef.current(false); // User proceeded without watching ad
      onCompleteCallbackRef.current = null;
    }
  };

  const showAdWithPreload = async (
    adType: "rewarded" | "interstitial",
    onComplete: (success: boolean) => void
  ) => {
    onCompleteCallbackRef.current = onComplete;

    // 1. Check Internet Connectivity
    let isConnected = true;
    try {
      const Network = require("expo-network");
      const netState = await Network.getNetworkStateAsync();
      isConnected = netState.isConnected ?? true;
    } catch (e) {
      console.warn("expo-network is not available (native module missing or failed to require). Performing fetch fallback check...", e);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        await fetch("https://clients3.google.com/generate_204", {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        isConnected = true;
      } catch (err) {
        console.warn("Fallback network check failed:", err);
        isConnected = false;
      }
    }

    if (!isConnected) {
      Alert.alert(
        "Internet Connection Required",
        "An active internet connection is required to complete this action and support this free app. Please connect to the internet and try again.",
        [{ text: "OK" }]
      );
      return;
    }

    // 2. Check Premium Status
    try {
      const isPremiumVal = await AsyncStorage.getItem("@user_is_premium");
      if (isPremiumVal === "true") {
        onComplete(true); // Premium users bypass ads immediately
        return;
      }
    } catch (e) {
      console.error("Error reading premium state in AdProvider:", e);
    }

    // 3. Check if already loaded
    const targetAd = adType === "rewarded" ? rewardedAd : interstitialAd;
    if (targetAd.loaded) {
      triggerShow(adType);
      return;
    }

    // 4. Start preloading overlay & triggers
    setLoading(true);
    setShowSkip(false);
    setSecondsRemaining(8);

    // Timeout countdown
    let remaining = 8;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        handleSkipOrTimeout();
      }
    }, 1000);

    // Show skip button after 3 seconds
    skipBtnTimerRef.current = setTimeout(() => {
      setShowSkip(true);
    }, 3000);

    // Load Ad and listen to events
    const unsubLoaded = targetAd.addAdEventListener(AdEventType.LOADED, () => {
      cleanUpAdRequest();
      triggerShow(adType);
    });

    const unsubError = targetAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn(`Ad failed to preload (${adType}):`, error);
      cleanUpAdRequest();
      if (onCompleteCallbackRef.current) {
        onCompleteCallbackRef.current(false); // Let user proceed if loading error
        onCompleteCallbackRef.current = null;
      }
    });

    eventUnsubscribesRef.current.push(unsubLoaded, unsubError);
    targetAd.load();
  };

  const triggerShow = (adType: "rewarded" | "interstitial") => {
    const targetAd = adType === "rewarded" ? rewardedAd : interstitialAd;
    let rewardEarned = false;

    const unsubClosed = targetAd.addAdEventListener(AdEventType.CLOSED, () => {
      unsubClosed();
      // Re-initialize and preload for next use
      if (adType === "rewarded") {
        rewardedAd = RewardedAd.createForAdRequest(rewardedAdUnitId, { requestNonPersonalizedAdsOnly: true });
        rewardedAd.load();
      } else {
        interstitialAd = InterstitialAd.createForAdRequest(interstitialAdUnitId, { requestNonPersonalizedAdsOnly: true });
        interstitialAd.load();
      }

      if (onCompleteCallbackRef.current) {
        onCompleteCallbackRef.current(adType === "rewarded" ? rewardEarned : true);
        onCompleteCallbackRef.current = null;
      }
    });

    if (adType === "rewarded") {
      const unsubReward = rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          rewardEarned = true;
          console.log("User earned reward:", reward);
        }
      );
      // Clean reward listener after close
      targetAd.addAdEventListener(AdEventType.CLOSED, () => unsubReward());
    }

    try {
      targetAd.show();
    } catch (e) {
      console.error("Error displaying ad:", e);
      if (onCompleteCallbackRef.current) {
        onCompleteCallbackRef.current(false);
        onCompleteCallbackRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (skipBtnTimerRef.current) clearTimeout(skipBtnTimerRef.current);
    };
  }, []);

  return (
    <AdContext.Provider value={{ showAdWithPreload }}>
      {children}
      {loading && (
        <Modal visible={loading} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>Preloading Ad...</Text>
              <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
                Please wait while we prepare your ad.
              </Text>

              {showSkip ? (
                <ActionButton
                  title="Skip Ad & Proceed"
                  type="primary"
                  onPress={handleSkipOrTimeout}
                  style={{ width: "100%", marginVertical: 0 }}
                />
              ) : (
                <Text style={[styles.countdownText, { color: theme.colors.textSecondary }]}>
                  Can skip in {secondsRemaining}s...
                </Text>
              )}
            </View>
          </View>
        </Modal>
      )}
    </AdContext.Provider>
  );
};

export const useAdTrigger = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error("useAdTrigger must be used within an AdProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
    textAlign: "center",
  },
  countdownText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    width: "100%",
  },
  skipButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
