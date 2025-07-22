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

import { getDb, getUserProfile } from "./DataBase";
import ThemeProvider, { ThemeContext } from "./Providers/ThemeProvider";
import Routes from "./Routes/Routes";
import OnboardingScreen from "./Screens/OnboardingScreen/OnboardingScreen";
import SplashScreen from "./Screens/SplashScreen/SplashScreen";

const Stack = createNativeStackNavigator();

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
        const db = await getDb();
        console.log("Database initialized successfully from App.tsx");
        const userId = await AsyncStorage.getItem("@user_id");
        if (userId) {
          const profile = await getUserProfile(db, parseInt(userId, 10));
          if (profile && profile.name && profile.avatarUrl) {
            setOnboardingComplete(true);
            translateY.value = withTiming(0, { duration: 500 });
          }
        }
      } catch (error) {
        console.error("Failed to initialize database from App.tsx:", error);
      } finally {
        setTimeout(() => {
          setSplashscreenVisible(false);
        }, 3000);
        setLoading(false);
      }
    };

    initialize();
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
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            )}
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </ThemeProvider>
  );
}
