"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Apply theme to DOM
  const applyThemeToDOM = useCallback((targetTheme: "light" | "dark") => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (targetTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    }
  }, []);

  // Compute resolved theme from mode
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  // Initialize theme from localStorage or system
  useEffect(() => {
    try {
      const saved = localStorage.getItem("advocase_theme") as ThemeMode | null;
      const initialMode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
      setThemeState(initialMode);

      const resolved = initialMode === "system" ? getSystemTheme() : initialMode;
      setResolvedTheme(resolved);
      applyThemeToDOM(resolved);
    } catch {
      // Fallback
      const sys = getSystemTheme();
      setResolvedTheme(sys);
      applyThemeToDOM(sys);
    } finally {
      setMounted(true);
    }
  }, [applyThemeToDOM]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const nextResolved = e.matches ? "dark" : "light";
        setResolvedTheme(nextResolved);
        applyThemeToDOM(nextResolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyThemeToDOM]);

  // Set explicit theme
  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem("advocase_theme", newTheme);
      } catch {
        // LocalStorage might be disabled
      }

      const nextResolved = newTheme === "system" ? getSystemTheme() : newTheme;
      setResolvedTheme(nextResolved);
      applyThemeToDOM(nextResolved);
    },
    [applyThemeToDOM]
  );

  // Quick toggle between light and dark
  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
