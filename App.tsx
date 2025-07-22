import { NavigationContainer } from "@react-navigation/native";
import React, { useContext, useEffect } from "react";
import { SafeAreaView } from "react-native";

import { getDb } from "./DataBase";
import ThemeProvider, { ThemeContext } from "./Providers/ThemeProvider";
import Routes from "./Routes/Routes";

export default function App() {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const initializeDb = async () => {
      try {
        await getDb();
        console.log("Database initialized successfully from App.tsx");
      } catch (error) {
        console.error("Failed to initialize database from App.tsx:", error);
        // Handle initialization error, e.g., show an error message to the user
      }
    };

    initializeDb();
  }, []);

  return (
    <ThemeProvider>
      <NavigationContainer>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
          }}
        >
          <Routes />
        </SafeAreaView>
      </NavigationContainer>
    </ThemeProvider>
  );
}
