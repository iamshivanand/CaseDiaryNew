import { NavigationContainer } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView, ActivityIndicator, View, Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mobileAds, { AppOpenAd, TestIds, AdEventType } from "react-native-google-mobile-ads";
import { AdProvider, preloadAds } from "./Screens/CommonComponents/AdManager";
import { initializeAlertInterceptor } from "./utils/AlertManager";
import CustomAlertModal from "./Screens/CommonComponents/CustomAlertModal";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from "@expo-google-fonts/inter";
import * as Application from "expo-application";
import UpdateCheckModal from "./Screens/CommonComponents/UpdateCheckModal";

// Initialize the global alert interceptor
initializeAlertInterceptor();

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { emitter } from "./utils/event-emitter";

import { getDb } from "./DataBase";
import ThemeProvider, { ThemeContext } from "./Providers/ThemeProvider";
import OnboardingProvider from "./Providers/OnboardingProvider";
import LanguageProvider from "./Providers/LanguageProvider";
import Routes from "./Routes/Routes";
import PersonalDetailsScreen from "./Screens/Onboarding/PersonalDetailsScreen";
import UploadPhotoScreen from "./Screens/Onboarding/UploadPhotoScreen";
import SetupProfileScreen from "./Screens/Onboarding/SetupProfileScreen";
import PracticeAreasScreen from "./Screens/Onboarding/PracticeAreasScreen";
import SplashScreen from "./Screens/SplashScreen/SplashScreen";
import GreetingScreen from "./Screens/Onboarding/GreetingScreen";
import ImportMigrationScreen from "./Screens/Onboarding/ImportMigrationScreen";
import DuplicateReviewScreen from "./Screens/Onboarding/DuplicateReviewScreen";

const Stack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();

import DoneScreen from "./Screens/Onboarding/DoneScreen";

import { CardStyleInterpolators } from '@react-navigation/stack';

const OnboardingNavigator = () => (
  <OnboardingStack.Navigator
    initialRouteName="Greeting"
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <OnboardingStack.Screen name="Greeting" component={GreetingScreen} />
    <OnboardingStack.Screen
      name="PersonalDetails"
      component={PersonalDetailsScreen}
    />
    <OnboardingStack.Screen name="UploadPhoto" component={UploadPhotoScreen} />
    <OnboardingStack.Screen
      name="SetupProfile"
      component={SetupProfileScreen}
    />
    <OnboardingStack.Screen
      name="PracticeAreas"
      component={PracticeAreasScreen}
    />
    <OnboardingStack.Screen
      name="ImportMigration"
      component={ImportMigrationScreen}
    />
    <OnboardingStack.Screen
      name="DuplicateReview"
      component={DuplicateReviewScreen}
    />
  </OnboardingStack.Navigator>
);

// Production Android ID: ca-app-pub-6084954144919761/6781969722
// Production iOS ID: ca-app-pub-3940256099942544/5575469517
const appOpenAdUnitId = TestIds.APP_OPEN;

const appOpenAd = AppOpenAd.createForAdRequest(appOpenAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const isVersionOlder = (local: string, remote: string) => {
  if (!local || !remote) return false;
  const localParts = local.split(".").map(Number);
  const remoteParts = remote.split(".").map(Number);
  for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
    const l = localParts[i] || 0;
    const r = remoteParts[i] || 0;
    if (l < r) return true;
    if (l > r) return false;
  }
  return false;
};

function AppContent() {
  const { theme } = useContext(ThemeContext);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isSplashscreenVisible, setSplashscreenVisible] = useState(true);
  const translateY = useSharedValue(1000);

  // Update check state variables
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [playStoreUrl, setPlayStoreUrl] = useState("https://play.google.com/store/apps/details?id=com.iamshiv.CaseDiary");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [latestVersion, setLatestVersion] = useState("1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        await getDb();
        console.log("Database initialized successfully from App.tsx");

        // Check for updates (Option 2 - Remote Version Check)
        let isUpdateForced = false;
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 3000)
          );
          const response = (await Promise.race([
            fetch("https://gangwar-shiv.github.io/app-version.json"),
            timeoutPromise,
          ])) as Response;

          if (response.ok) {
            const data = await response.json();
            const localVersion = Application.nativeApplicationVersion || "1.0.0";

            const minRequired = Platform.OS === "ios" ? data.minIosVersion : data.minAndroidVersion;
            const latestAvailable = Platform.OS === "ios" ? data.latestIosVersion : data.latestAndroidVersion;

            if (data.playStoreUrl) setPlayStoreUrl(data.playStoreUrl);
            if (data.appStoreUrl) setAppStoreUrl(data.appStoreUrl);
            if (data.releaseNotes) setReleaseNotes(data.releaseNotes);
            setLatestVersion(latestAvailable);

            if (isVersionOlder(localVersion, minRequired)) {
              setForceUpdate(true);
              setUpdateModalVisible(true);
              isUpdateForced = true;
            } else if (isVersionOlder(localVersion, latestAvailable)) {
              setForceUpdate(false);
              setUpdateModalVisible(true);
            }
          }
        } catch (fetchErr) {
          console.warn("Failed to fetch remote app version data:", fetchErr);
        }

        // Initialize Ads SDK
        await mobileAds().initialize();
        preloadAds();

        const isPremiumVal = await AsyncStorage.getItem("@user_is_premium");
        const isPremium = isPremiumVal === "true";

        const onboardingStatus = await AsyncStorage.getItem(
          "@onboarding_complete"
        );
        const isOnboarded = onboardingStatus === "true";

        if (isOnboarded) {
          setOnboardingComplete(true);
          translateY.value = 0; // Immediately set to 0 to prevent hit-box unresponsiveness!
        }

        if (!isPremium && isOnboarded) {
          let adShownOrFailed = false;

          const cleanup = () => {
            try {
              unsubLoaded();
            } catch (e) {}
            try {
              unsubError();
            } catch (e) {}
            try {
              unsubClosed();
            } catch (e) {}
          };

          const showOpenAd = () => {
            if (adShownOrFailed) return;
            adShownOrFailed = true;
            try {
              appOpenAd.show();
            } catch (err) {
              console.warn("Failed to show AppOpenAd:", err);
              cleanup();
              proceedToApp();
            }
          };

          const proceedToApp = () => {
            setSplashscreenVisible(false);
          };

          // Setup timeout for ad loading (max 3 seconds)
          const timeoutId = setTimeout(() => {
            if (!adShownOrFailed) {
              console.log("AppOpenAd preload timeout reached. Proceeding to app.");
              adShownOrFailed = true;
              cleanup();
              proceedToApp();
            }
          }, 3000);

          const unsubLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
            clearTimeout(timeoutId);
            showOpenAd();
          });

          const unsubError = appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
            clearTimeout(timeoutId);
            console.warn("AppOpenAd failed to load:", error);
            cleanup();
            proceedToApp();
          });

          const unsubClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
            cleanup();
            proceedToApp();
          });

          appOpenAd.load();
        } else {
          setSplashscreenVisible(false);
        }
      } catch (error) {
        console.error("Failed to initialize database or ads from App.tsx:", error);
        setSplashscreenVisible(false);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    const onOnboardingComplete = () => {
      setOnboardingComplete(true);
      translateY.value = withTiming(0, { duration: 500 });
    };

    emitter.on("onboardingComplete", onOnboardingComplete);

    return () => {
      emitter.off("onboardingComplete", onOnboardingComplete);
    };
  }, []);

  if (isSplashscreenVisible || !fontsLoaded) {
    return <SplashScreen />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {onboardingComplete ? (
              <Stack.Screen name="App">
                {(props) => (
                  <Animated.View style={[{ flex: 1 }, animatedStyle]}>
                    <Routes {...props} />
                  </Animated.View>
                )}
              </Stack.Screen>
            ) : (
              <Stack.Screen
                name="Onboarding"
                component={OnboardingNavigator}
              />
            )}
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
      <CustomAlertModal />
      <UpdateCheckModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
        forceUpdate={forceUpdate}
        playStoreUrl={playStoreUrl}
        appStoreUrl={appStoreUrl}
        releaseNotes={releaseNotes}
        latestVersion={latestVersion}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <OnboardingProvider>
          <AdProvider>
            <AppContent />
          </AdProvider>
        </OnboardingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
