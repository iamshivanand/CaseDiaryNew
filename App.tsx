import { NavigationContainer } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView, ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { getDb } from "./DataBase";
import ThemeProvider, { ThemeContext } from "./Providers/ThemeProvider";
import Routes from "./Routes/Routes";
import OnboardingScreen from "./Screens/OnboardingScreen/OnboardingScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

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
        }
      } catch (error) {
        console.error("Failed to initialize database from App.tsx:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

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
              <Stack.Screen name="App" component={Routes} />
            ) : (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            )}
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </ThemeProvider>
  );
}
