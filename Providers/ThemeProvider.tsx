import React, { createContext, useState, ReactNode } from "react";
import { Appearance, useColorScheme } from "react-native";
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  updateTheme: (newTheme: Partial<Theme>) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: {
    colors: {
      primary: "#007bff",
      secondary: "#ffc107",
      background: "#fff",
      text: "#000",
    },
  },
  updateTheme: () => {},
});

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const defaultTheme: Theme = {
      colors: {
        primary: "#007bff",
        secondary: "#ffc107",
        background: "white", // Use black background for dark mode, white for light mode
        text: "black", // Use white text for dark mode, black for light mode
      },
    };
    return defaultTheme;
  });

  const updateTheme = (newTheme: Partial<Theme>) => {
    setTheme({ ...theme, ...newTheme });
  };

  const value = { theme, updateTheme };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
