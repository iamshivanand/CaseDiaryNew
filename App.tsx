import { NavigationContainer } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView, ActivityIndicator, View, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mobileAds, { AppOpenAd, TestIds, AdEventType } from "react-native-google-mobile-ads";
import { AdProvider } from "./Screens/CommonComponents/AdManager";
import { initializeAlertInterceptor } from "./utils/AlertManager";
import CustomAlertModal from "./Screens/CommonComponents/CustomAlertModal";

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
import Routes from "./Routes/Routes";
import PersonalDetailsScreen from "./Screens/Onboarding/PersonalDetailsScreen";
import UploadPhotoScreen from "./Screens/Onboarding/UploadPhotoScreen";
import SetupProfileScreen from "./Screens/Onboarding/SetupProfileScreen";
import PracticeAreasScreen from "./Screens/Onboarding/PracticeAreasScreen";
import SplashScreen from "./Screens/SplashScreen/SplashScreen";
import GreetingScreen from "./Screens/Onboarding/GreetingScreen";

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
  </OnboardingStack.Navigator>
);

const appOpenAdUnitId = __DEV__
  ? TestIds.APP_OPEN
  : Platform.OS === "ios"
  ? "ca-app-pub-3940256099942544/5575469517"
  : "ca-app-pub-3940256099942544/9257395921";

const appOpenAd = AppOpenAd.createForAdRequest(appOpenAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export default function App() {
  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isSplashscreenVisible, setSplashscreenVisible] = useState(true);
  const translateY = useSharedValue(1000);

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

        // Initialize Ads SDK
        await mobileAds().initialize();

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

          const showOpenAd = () => {
            if (adShownOrFailed) return;
            adShownOrFailed = true;
            try {
              appOpenAd.show();
            } catch (err) {
              console.warn("Failed to show AppOpenAd:", err);
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
            proceedToApp();
          });

          const unsubClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
            unsubClosed();
            unsubLoaded();
            unsubError();
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

  if (isSplashscreenVisible) {
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
    <ThemeProvider>
      <OnboardingProvider>
        <AdProvider>
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
        </AdProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}
