import React, { createContext, useState, ReactNode, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    placeholderText: string;
    accent: string;
    error: string;
    errorText: string;
    success: string;
    border: string;
    disabledInputBackground: string;
    disabledBorder: string;
    shadow: string;
    primaryLight: string;
    status: {
      active: string;
      pending: string;
      closed: string;
    };
  };
  fontSizes: {
    small: number;
    medium: number;
    large: number;
    title: number;
  };
}

interface ThemeContextType {
  theme: Theme;
  updateTheme: (newTheme: Partial<Theme>) => void;
  isThemeLoading: boolean;
}

const defaultTheme: Theme = {
  colors: {
    primary: "#007AFF",
    secondary: "#FF9800",
    background: "#F9FAFB",
    surface: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    placeholderText: "#9CA3AF",
    accent: "#3B82F6",
    error: "#EF4444",
    errorText: "#991B1B",
    success: "#22C55E",
    border: "#D1D5DB",
    disabledInputBackground: "#E5E7EB",
    disabledBorder: "#D1D5DB",
    shadow: "#000000",
    primaryLight: '#DBEAFE',
    status: {
      active: "#4CAF50",
      pending: "#FF9800",
      closed: "#9E9E9E",
    },
  },
  fontSizes: {
    small: 12,
    medium: 14,
    large: 16,
    title: 24,
  },
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  updateTheme: () => {},
  isThemeLoading: true,
});

const THEME_STORAGE_KEY = "@user_theme";

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme) {
          setTheme(JSON.parse(storedTheme));
        }
      } catch (error) {
        console.error("Failed to load theme from storage", error);
      } finally {
        setIsThemeLoading(false);
      }
    };

    loadTheme();
  }, []);

  const updateTheme = async (newThemeSpec: Partial<Theme>) => {
    setTheme(currentTheme => {
        const updated = {
            ...currentTheme,
            ...newThemeSpec,
            colors: {
                ...currentTheme.colors,
                ...newThemeSpec.colors,
            },
            fontSizes: {
                ...currentTheme.fontSizes,
                ...newThemeSpec.fontSizes,
            }
        };

        AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updated))
            .catch(error => console.error("Failed to save theme to storage", error));

        return updated;
    });
};


  const value = { theme, updateTheme, isThemeLoading };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
