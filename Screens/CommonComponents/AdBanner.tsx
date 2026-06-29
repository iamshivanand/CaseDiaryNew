import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { ThemeContext } from "../../Providers/ThemeProvider";

// Android: ca-app-pub-6084954144919761/2767388859
// iOS: ca-app-pub-3940256099942544/2934735716
const adUnitId = __DEV__
  ? TestIds.BANNER
  : Platform.OS === "ios"
  ? "ca-app-pub-3940256099942544/2934735716"
  : "ca-app-pub-6084954144919761/2767388859";

interface AdBannerProps {
  containerStyle?: StyleProp<ViewStyle>;
}

const AdBanner: React.FC<AdBannerProps> = ({ containerStyle }) => {
  const { theme } = useContext(ThemeContext);
  const [isPremium, setIsPremium] = useState<boolean>(true); // Default to true to hide ads until checked
  const [adState, setAdState] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const isPremiumVal = await AsyncStorage.getItem("@user_is_premium");
        setIsPremium(isPremiumVal === "true");
      } catch (error) {
        console.error("Error checking premium status in AdBanner:", error);
        setIsPremium(false);
      }
    };
    checkPremiumStatus();
  }, []);

  if (isPremium) {
    return null;
  }

  if (adState === 'failed') {
    return (
      <View
        style={[
          styles.adContainer,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.border,
            minHeight: 50,
            justifyContent: 'center',
            alignItems: 'center',
          },
          containerStyle,
        ]}
      >
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
          Go Premium for an Ad-Free Experience!
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.adContainer,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.border,
        },
        containerStyle,
      ]}
    >
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setAdState('success');
          console.log("AdBanner: Test Banner Ad loaded successfully.");
        }}
        onAdFailedToLoad={(error) => {
          setAdState('failed');
          console.warn("AdBanner: Test Banner Ad failed to load:", error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    minHeight: 66,
  },
});

export default AdBanner;
