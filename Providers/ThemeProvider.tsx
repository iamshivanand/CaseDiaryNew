import React, { createContext, useState, ReactNode, useEffect, useContext } from "react";
import { Appearance, useColorScheme } from "react-native";
import { useDB } from "../DataBase/DatabaseProvider";
import { getUserProfile, updateUserProfile } from "../DataBase/userProfileDB";
import { AuthContext } from "./AuthProvider";
import { theme as defaultTheme } from "../styles/theme";
import { useFonts } from "expo-font";

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    button: string;
  };
  fonts: {
    fontFamily: string;
    fontSize: number;
  };
}

interface ThemeContextType {
  theme: Theme;
  updateTheme: (newTheme: Partial<Theme>) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  updateTheme: () => {}, // Function to update the theme
});

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { db } = useDB();
  const { user } = useContext(AuthContext);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [fontsLoaded] = useFonts({
    "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
    "Roboto-Italic": require("../assets/fonts/Roboto-Italic.ttf"),
  });

  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        const profile = await getUserProfile(db, user.id);
        if (profile && profile.themeSettings) {
          setTheme(profile.themeSettings);
        }
      }
    };
    loadTheme();
  }, [user, db]);

  const updateTheme = async (newTheme: Partial<Theme>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    if (user) {
      const profile = await getUserProfile(db, user.id);
      await updateUserProfile(db, user.id, {
        ...profile,
        themeSettings: updatedTheme,
      });
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const value = { theme, updateTheme };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
