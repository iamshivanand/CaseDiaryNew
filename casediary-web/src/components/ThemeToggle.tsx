"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

interface ThemeToggleProps {
  variant?: "icon" | "segmented" | "dropdown";
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  variant = "icon",
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme, mounted } = useTheme();
  const { language, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  if (!mounted) {
    // Render placeholder to avoid layout shift before client hydration
    return (
      <button
        aria-hidden="true"
        className={`p-2 rounded-xl text-zinc-400 dark:text-zinc-500 opacity-60 pointer-events-none ${className}`}
      >
        <Moon className="w-4 h-4" />
      </button>
    );
  }

  // 1. Icon variant: single click toggles between light and dark
  if (variant === "icon") {
    const isDark = resolvedTheme === "dark";
    const label = isDark
      ? language === "en"
        ? "Switch to Light Mode"
        : "लाइट थीम चुनें"
      : language === "en"
      ? "Switch to Dark Mode"
      : "डार्क थीम चुनें";

    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer relative group flex items-center justify-center ${className}`}
        title={label}
        aria-label={label}
      >
        <span className="sr-only">{label}</span>
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
        {showLabel && (
          <span className="ml-2 text-xs font-medium">
            {isDark ? t("themeLight") : t("themeDark")}
          </span>
        )}
      </button>
    );
  }

  // 2. Segmented Pill variant (e.g. for Settings & Control Panels)
  if (variant === "segmented") {
    const options: { mode: ThemeMode; label: string; icon: React.ElementType }[] = [
      { mode: "light", label: t("themeLight"), icon: Sun },
      { mode: "dark", label: t("themeDark"), icon: Moon },
      { mode: "system", label: t("themeSystem"), icon: Monitor },
    ];

    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs ${className}`}
        role="radiogroup"
        aria-label={t("themeAppearance")}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.mode;

          return (
            <button
              key={opt.mode}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.mode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isSelected
                    ? opt.mode === "light"
                      ? "text-amber-500"
                      : opt.mode === "dark"
                      ? "text-blue-400"
                      : "text-emerald-500"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 3. Dropdown Menu variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="px-2.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        title={t("themeToggle")}
      >
        {resolvedTheme === "dark" ? (
          <Moon className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
        <span className="capitalize">
          {theme === "system"
            ? t("themeSystem")
            : theme === "dark"
            ? t("themeDark")
            : t("themeLight")}
        </span>
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setTheme("light");
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
              theme === "light"
                ? "bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 font-semibold"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>{t("themeLight")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
              theme === "dark"
                ? "bg-zinc-100 dark:bg-zinc-800 text-blue-500 dark:text-blue-400 font-semibold"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-blue-400" />
            <span>{t("themeDark")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme("system");
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
              theme === "system"
                ? "bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t("themeSystem")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
