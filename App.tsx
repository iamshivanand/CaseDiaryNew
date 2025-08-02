import { NavigationContainer } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView, ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { emitter } from "./utils/event-emitter";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";

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

export default function App() {
  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isSplashscreenVisible, setSplashscreenVisible] = useState(true);
  const translateY = useSharedValue(1000);

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

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
        const onboardingStatus = await AsyncStorage.getItem(
          "@onboarding_complete"
        );
        if (onboardingStatus === "true") {
          setOnboardingComplete(true);
          translateY.value = withTiming(0, { duration: 500 });
        }
      } catch (error) {
        console.error("Failed to initialize database from App.tsx:", error);
      } finally {
        if (fontsLoaded) {
          setTimeout(() => {
            setSplashscreenVisible(false);
          }, 3000);
          setLoading(false);
        }
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
  }, [fontsLoaded]);

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
    <ThemeProvider>
      <OnboardingProvider>
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
      </OnboardingProvider>
    </ThemeProvider>
  );
}
