import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    cardBackground: string;
    inputBackground: string;
    border: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    danger: string;
  };
  fonts: {
    regular: string;
    medium: string;
    bold: string;
  };
}

export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: "#1E3A8A", // Royal Sapphire Blue
    secondary: "#D97706", // Champagne Gold
    background: "#F8FAFC", // Slate-50
    cardBackground: "#FFFFFF",
    inputBackground: "#F1F5F9", // Slate-100
    border: "#E2E8F0", // Slate-200
    text: "#0F172A", // Slate-900
    textSecondary: "#64748B", // Slate-500
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
  },
  fonts: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    bold: "Inter_700Bold",
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: "#6366F1", // Indigo Accent
    secondary: "#38BDF8", // Sky Cyan Accent
    background: "#0B0F19", // Midnight Sapphire Deep Black
    cardBackground: "#161D2B", // Obsidian Navy Card
    inputBackground: "#202B3E", // Steel Metallic Slate Input
    border: "#2E3A4E", // Subtle Navy Border
    text: "#F8FAFC", // Pure Off-White
    textSecondary: "#94A3B8", // Pastel Slate Muted
    success: "#10B981", // Vibrant Emerald Success
    warning: "#FBBF24",
    danger: "#EF4444",
  },
  fonts: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    bold: "Inter_700Bold",
  },
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themeMode: "system",
  setThemeMode: async () => {},
});

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    const loadSavedThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem("@theme_mode");
        if (savedMode) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error("Failed to load theme mode:", error);
      }
    };
    loadSavedThemeMode();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem("@theme_mode", mode);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  const getActiveTheme = (): Theme => {
    if (themeMode === "light") {
      return lightTheme;
    }
    if (themeMode === "dark") {
      return darkTheme;
    }
    // Follow system settings
    return systemColorScheme === "dark" ? darkTheme : lightTheme;
  };

  const activeTheme = getActiveTheme();

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

