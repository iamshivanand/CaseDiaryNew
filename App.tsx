import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CardStyleInterpolators } from "@react-navigation/stack";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as ExpoSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import {
  SafeAreaView,
  ActivityIndicator,
  View,
  Platform,
  Alert,
} from "react-native";
import mobileAds, {
  AppOpenAd,
  TestIds,
  AdEventType,
} from "react-native-google-mobile-ads";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { getDb } from "./DataBase";
import LanguageProvider from "./Providers/LanguageProvider";
import OnboardingProvider from "./Providers/OnboardingProvider";
import ThemeProvider, { ThemeContext } from "./Providers/ThemeProvider";
import Routes from "./Routes/Routes";
import { AdProvider, preloadAds } from "./Screens/CommonComponents/AdManager";
import CustomAlertModal from "./Screens/CommonComponents/CustomAlertModal";
import UpdateCheckModal from "./Screens/CommonComponents/UpdateCheckModal";
import DoneScreen from "./Screens/Onboarding/DoneScreen";
import DuplicateReviewScreen from "./Screens/Onboarding/DuplicateReviewScreen";
import GreetingScreen from "./Screens/Onboarding/GreetingScreen";
import ImportMigrationScreen from "./Screens/Onboarding/ImportMigrationScreen";
import PersonalDetailsScreen from "./Screens/Onboarding/PersonalDetailsScreen";
import PracticeAreasScreen from "./Screens/Onboarding/PracticeAreasScreen";
import SetupProfileScreen from "./Screens/Onboarding/SetupProfileScreen";
import UploadPhotoScreen from "./Screens/Onboarding/UploadPhotoScreen";
import SplashScreen from "./Screens/SplashScreen/SplashScreen";
import InAppNotificationToast, {
  ToastNotification,
} from "./Screens/CommonComponents/InAppNotificationToast";
import { initializeAlertInterceptor } from "./utils/AlertManager";
import {
  handleNotificationDeepLink,
  processInitialNotificationResponse,
} from "./utils/deepLinkHandler";
import { emitter } from "./utils/event-emitter";
import { scheduleDailyMultiIntervalNotifications } from "./utils/notificationScheduler";

// Initialize the global alert interceptor
initializeAlertInterceptor();

// Hide native splash immediately so React animated splash takes over from t = 0
ExpoSplashScreen.hideAsync().catch(() => {});

// Global production console stripping
if (!__DEV__) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}

export const navigationRef = createNavigationContainerRef<any>();

const linking = {
  prefixes: ["advocase://", "casediary://"],
  config: {
    screens: {
      App: {
        screens: {
          MainApp: {
            screens: {
              Home: {
                screens: {
                  HomeScreen: "home",
                  CaseDetails: "case/:caseId",
                  AllCases: "cases",
                  UndatedCases: "undated",
                  YesterdaysCases: "yesterday",
                  NotificationInbox: "notifications",
                  DraftsHub: "drafts",
                },
              },
              Search: {
                screens: {
                  SearchScreen: "search",
                },
              },
              Calendar: {
                screens: {
                  CalendarScreen: "calendar",
                },
              },
              Profile: {
                screens: {
                  ProfileScreen: "profile",
                  SettingsScreen: "settings",
                },
              },
            },
          },
        },
      },
    },
  },
};

const Stack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();

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

// Android: ca-app-pub-6084954144919761/6781969722
// iOS: ca-app-pub-3940256099942544/5575469517
const appOpenAdUnitId = __DEV__
  ? TestIds.APP_OPEN
  : Platform.OS === "ios"
    ? "ca-app-pub-3940256099942544/5575469517"
    : "ca-app-pub-6084954144919761/6781969722";

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
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const [inAppToast, setInAppToast] = useState<ToastNotification | null>(null);
  // Update check state variables
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [playStoreUrl, setPlayStoreUrl] = useState(
    "https://play.google.com/store/apps/details?id=com.iamshiv.CaseDiary"
  );
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [latestVersion, setLatestVersion] = useState("1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");

  // Hide the native splash screen as soon as fonts are loaded so the JS animated splash takes over smoothly
  useEffect(() => {
    if (fontsLoaded) {
      console.log("[SplashFlow] 1. Fonts loaded: Hiding native Android splash screen to reveal animated splash");
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const [, , isPremiumVal, onboardingStatus] = await Promise.all([
          getDb(),
          mobileAds()
            .initialize()
            .catch((err) =>
              console.warn("Mobile Ads SDK init non-fatal error:", err)
            ),
          AsyncStorage.getItem("@user_is_premium"),
          AsyncStorage.getItem("@onboarding_complete"),
        ]);
        console.log("Database and core services initialized concurrently.");
        scheduleDailyMultiIntervalNotifications();

        // Check for updates asynchronously (does not block startup)
        const runUpdateCheck = async () => {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 3000)
            );
            const response = (await Promise.race([
              fetch("https://iamshivanand.github.io/app-version.json"),
              timeoutPromise,
            ])) as Response;

            if (response.ok) {
              const data = await response.json();
              const nativeVer = Application.nativeApplicationVersion;
              const appConfigVer = Constants.expoConfig?.version;
              const localVersion =
                nativeVer && nativeVer !== "1.0.0"
                  ? nativeVer
                  : appConfigVer || "1.2.2";

              const minRequired =
                Platform.OS === "ios"
                  ? data.minIosVersion
                  : data.minAndroidVersion;
              const latestAvailable =
                Platform.OS === "ios"
                  ? data.latestIosVersion
                  : data.latestAndroidVersion;

              if (data.playStoreUrl) setPlayStoreUrl(data.playStoreUrl);
              if (data.appStoreUrl) setAppStoreUrl(data.appStoreUrl);
              if (data.releaseNotes) setReleaseNotes(data.releaseNotes);
              setLatestVersion(latestAvailable);

              if (minRequired && isVersionOlder(localVersion, minRequired)) {
                setForceUpdate(true);
                setUpdateModalVisible(true);
              } else if (
                latestAvailable &&
                isVersionOlder(localVersion, latestAvailable)
              ) {
                setForceUpdate(false);
                setUpdateModalVisible(true);
              } else {
                setForceUpdate(false);
                setUpdateModalVisible(false);
              }
            }
          } catch (fetchErr) {
            console.warn(
              "Failed to fetch remote app version data in background:",
              fetchErr
            );
          }
        };
        runUpdateCheck();

        const isPremium = isPremiumVal === "true";
        const isOnboarded = onboardingStatus === "true";

        if (isOnboarded) {
          setOnboardingComplete(true);
        }
      } catch (error) {
        console.error(
          "Failed to initialize database or ads from App.tsx:",
          error
        );
        Alert.alert(
          "Initialization Error",
          "Failed to initialize database connection. Please check your storage space and try again.",
          [
            {
              text: "Retry",
              onPress: () => {
                setLoading(true);
                initialize();
              },
            },
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    initialize();

    const onOnboardingComplete = () => {
      setOnboardingComplete(true);
    };

    emitter.on("onboardingComplete", onOnboardingComplete);

    const notificationSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const actionId = response.actionIdentifier;
        const content = response.notification.request.content;
        const data = content.data;
        handleNotificationDeepLink(navigationRef, data, actionId, content);
      });

    // Listen for notifications received while app is in the FOREGROUND.
    // OS banner is suppressed (see notificationScheduler.ts) so we show
    // a custom in-app toast instead — no double buzzing.
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body } = notification.request.content;
        const data = notification.request.content.data;
        setInAppToast({
          id: notification.request.identifier,
          title: title || "Reminder",
          body: body || "",
          data,
        });
      }
    );

    return () => {
      emitter.off("onboardingComplete", onOnboardingComplete);
      notificationSubscription.remove();
      foregroundSubscription.remove();
    };
  }, []);

  const isAppReady = Boolean(fontsLoaded && !loading);

  const handleSplashAnimationComplete = React.useCallback(() => {
    setSplashAnimationFinished(true);
  }, []);

  if (!splashAnimationFinished) {
    return (
      <SplashScreen
        isReady={isAppReady}
        startAnimation={Boolean(fontsLoaded)}
        onAnimationComplete={handleSplashAnimationComplete}
      />
    );
  }

  console.log("[SplashFlow] 5. Rendering main application & Dashboard");

  return (
    <>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => {
          processInitialNotificationResponse(navigationRef);
        }}
        theme={{
          dark: theme.dark,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.cardBackground,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.primary,
          },
        }}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {onboardingComplete ? (
              <Stack.Screen name="App" component={Routes} />
            ) : (
              <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
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
      {/* In-app toast for foreground notifications */}
      <InAppNotificationToast
        notification={inAppToast}
        onDismiss={() => setInAppToast(null)}
        onPress={(data) => {
          handleNotificationDeepLink(navigationRef, data);
        }}
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
