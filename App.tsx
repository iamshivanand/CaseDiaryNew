import { NavigationContainer } from "@react-navigation/native";
import React, { useContext, useEffect } from "react";
import { SafeAreaView } from "react-native";

import { openDatabaseAsync } from "./DataBase";
import ThemeProvider, { ThemeContext } from "./Providers/ThemeProvider";
import Routes from "./Routes/Routes";

export default function App() {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    openDatabaseAsync();
  }, []);

  return (
    <ThemeProvider>
      <NavigationContainer>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
            height: "100%",
          }}
        >
          <Routes />
        </SafeAreaView>
      </NavigationContainer>
    </ThemeProvider>
  );
}
