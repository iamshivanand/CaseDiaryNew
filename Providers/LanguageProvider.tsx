// Providers/LanguageProvider.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, TranslationKey, LocaleType } from "../utils/translations";

interface LanguageContextType {
  locale: LocaleType;
  setLocale: (locale: LocaleType) => Promise<void>;
  t: (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: async () => {},
  t: (key) => translations["en"][key] || (key as string),
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<LocaleType>("en");

  useEffect(() => {
    const loadSavedLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem("@app_locale");
        if (savedLocale === "en" || savedLocale === "hi") {
          setLocaleState(savedLocale);
        }
      } catch (error) {
        console.error("Failed to load saved locale:", error);
      }
    };
    loadSavedLocale();
  }, []);

  const setLocale = async (newLocale: LocaleType) => {
    try {
      setLocaleState(newLocale);
      await AsyncStorage.setItem("@app_locale", newLocale);
    } catch (error) {
      console.error("Failed to save locale:", error);
    }
  };

  const t = (key: TranslationKey): string => {
    const translation = translations[locale][key];
    if (translation === undefined) {
      return translations["en"][key] || (key as string);
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
export default LanguageProvider;
