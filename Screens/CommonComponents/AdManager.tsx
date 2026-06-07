import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Modal, ActivityIndicator, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RewardedAd, InterstitialAd, TestIds, AdEventType, RewardedAdEventType } from "react-native-google-mobile-ads";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../../Providers/ThemeProvider";
import ActionButton from "./ActionButton";

// Production Android ID: ca-app-pub-6084954144919761/3119046561
// Production iOS ID: ca-app-pub-3940256099942544/1712485313
const rewardedAdUnitId = TestIds.REWARDED;

// Production Android ID: ca-app-pub-6084954144919761/4080470524
// Production iOS ID: ca-app-pub-3940256099942544/4411468910
const interstitialAdUnitId = TestIds.INTERSTITIAL;

// Create single global instances
let rewardedAd = RewardedAd.createForAdRequest(rewardedAdUnitId, { requestNonPersonalizedAdsOnly: true });
let interstitialAd = InterstitialAd.createForAdRequest(interstitialAdUnitId, { requestNonPersonalizedAdsOnly: true });

// State tracking for preloader to prevent race conditions
let isRewardedAdLoading = false;
let isInterstitialAdLoading = false;

// Preload helper
export const preloadAds = () => {
  try {
    if (!rewardedAd.loaded && !isRewardedAdLoading) {
      isRewardedAdLoading = true;
      const unsubLoaded = rewardedAd.addAdEventListener(AdEventType.LOADED, () => {
        isRewardedAdLoading = false;
        unsubLoaded();
        unsubError();
      });
      const unsubError = rewardedAd.addAdEventListener(AdEventType.ERROR, (err) => {
        isRewardedAdLoading = false;
        console.warn("Failed to preload rewarded ad:", err);
        unsubLoaded();
        unsubError();
      });
      rewardedAd.load();
    }

    if (!interstitialAd.loaded && !isInterstitialAdLoading) {
      isInterstitialAdLoading = true;
      const unsubLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        isInterstitialAdLoading = false;
        unsubLoaded();
        unsubError();
      });
      const unsubError = interstitialAd.addAdEventListener(AdEventType.ERROR, (err) => {
        isInterstitialAdLoading = false;
        console.warn("Failed to preload interstitial ad:", err);
        unsubLoaded();
        unsubError();
      });
      interstitialAd.load();
    }
  } catch (e) {
    console.warn("Failed to preload ads:", e);
  }
};

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
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteCallbackRef = useRef<((success: boolean) => void) | null>(null);
  const eventUnsubscribesRef = useRef<(() => void)[]>([]);

  // Cleanup timers and subscriptions
  const cleanUpAdRequest = () => {
    setLoading(false);
    setShowSkip(false);
    setSecondsRemaining(15);
    if (timerRef.current) clearInterval(timerRef.current);
    eventUnsubscribesRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {}
    });
    eventUnsubscribesRef.current = [];
  };

  const handleSkipOrTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowSkip(true);
  };

  const handleSkipAfterFailure = () => {
    cleanUpAdRequest();
    if (onCompleteCallbackRef.current) {
      onCompleteCallbackRef.current(true); // User allowed to skip to not break flow
      onCompleteCallbackRef.current = null;
    }
  };

  const handleCloseRewardModal = () => {
    setShowRewardModal(false);
    if (onCompleteCallbackRef.current) {
      onCompleteCallbackRef.current(true); // Reward earned successfully
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
    setSecondsRemaining(15);

    // Timeout countdown
    let remaining = 15;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        handleSkipOrTimeout();
      }
    }, 1000);

    // Load Ad and listen to events
    const unsubLoaded = targetAd.addAdEventListener(AdEventType.LOADED, () => {
      cleanUpAdRequest();
      triggerShow(adType);
    });

    const unsubError = targetAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn(`Ad failed to load (${adType}):`, error);
      if (timerRef.current) clearInterval(timerRef.current);
      setShowSkip(true);
    });

    eventUnsubscribesRef.current.push(unsubLoaded, unsubError);

    // Trigger load if not already in progress
    const isTargetAdLoading = adType === "rewarded" ? isRewardedAdLoading : isInterstitialAdLoading;
    if (!isTargetAdLoading) {
      if (adType === "rewarded") {
        isRewardedAdLoading = true;
      } else {
        isInterstitialAdLoading = true;
      }
      targetAd.load();
    }
  };

  const triggerShow = (adType: "rewarded" | "interstitial") => {
    const targetAd = adType === "rewarded" ? rewardedAd : interstitialAd;
    let rewardEarned = false;

    const unsubClosed = targetAd.addAdEventListener(AdEventType.CLOSED, () => {
      unsubClosed();
      // Re-initialize and preload for next use
      if (adType === "rewarded") {
        rewardedAd = RewardedAd.createForAdRequest(rewardedAdUnitId, { requestNonPersonalizedAdsOnly: true });
        isRewardedAdLoading = true;
        const unsubL = rewardedAd.addAdEventListener(AdEventType.LOADED, () => {
          isRewardedAdLoading = false;
          unsubL();
          unsubE();
        });
        const unsubE = rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
          isRewardedAdLoading = false;
          unsubL();
          unsubE();
        });
        rewardedAd.load();

        if (rewardEarned) {
          setShowRewardModal(true);
        } else {
          if (onCompleteCallbackRef.current) {
            onCompleteCallbackRef.current(false); // Closed early, reward not earned
            onCompleteCallbackRef.current = null;
          }
        }
      } else {
        interstitialAd = InterstitialAd.createForAdRequest(interstitialAdUnitId, { requestNonPersonalizedAdsOnly: true });
        isInterstitialAdLoading = true;
        const unsubL = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
          isInterstitialAdLoading = false;
          unsubL();
          unsubE();
        });
        const unsubE = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
          isInterstitialAdLoading = false;
          unsubL();
          unsubE();
        });
        interstitialAd.load();

        if (onCompleteCallbackRef.current) {
          onCompleteCallbackRef.current(true); // Interstitial completed
          onCompleteCallbackRef.current = null;
        }
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
    };
  }, []);

  return (
    <AdContext.Provider value={{ showAdWithPreload }}>
      {children}
      {loading && (
        <Modal visible={loading} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              {!showSkip ? (
                <>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.text }]}>Preloading Ad...</Text>
                  <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
                    Please wait while we prepare your ad.
                  </Text>
                  <Text style={[styles.countdownText, { color: theme.colors.textSecondary }]}>
                    Timeout in {secondsRemaining}s...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="warning-outline" size={40} color="#F59E0B" style={{ marginBottom: 12 }} />
                  <Text style={[styles.loadingText, { color: theme.colors.text }]}>Ad Loading Failed</Text>
                  <Text style={[styles.subText, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
                    We could not load the ad. You may skip this ad to proceed.
                  </Text>
                  <ActionButton
                    title="Skip Ad & Proceed"
                    type="primary"
                    onPress={handleSkipAfterFailure}
                    style={{ width: "100%", marginVertical: 0 }}
                  />
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      {showRewardModal && (
        <Modal visible={showRewardModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="gift-outline" size={36} color="#16A34A" />
              </View>
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>Reward Achieved!</Text>
              <Text style={[styles.subText, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
                Thank you for supporting this free app! Your action has been unlocked.
              </Text>
              <ActionButton
                title="Proceed"
                type="primary"
                onPress={handleCloseRewardModal}
                style={{ width: "100%", marginVertical: 0 }}
              />
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
  iconContainer: {
    padding: 12,
    borderRadius: 30,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
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
});
