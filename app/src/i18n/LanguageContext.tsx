import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { databaseService } from "../services/databaseService";
import {
  AppLanguage,
  getLocalizedClassName,
  TranslationKey,
  translations,
} from "./translations";

interface LanguageContextValue {
  language: AppLanguage;
  isLanguageLoaded: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  localizeClassName: (value: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setActiveLanguage] = useState<AppLanguage>("en");
  const [isLanguageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    databaseService
      .getSetting("language")
      .then((storedLanguage) => {
        if (mounted && (storedLanguage === "en" || storedLanguage === "ta")) {
          setActiveLanguage(storedLanguage);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load saved language preference:", error);
      })
      .finally(() => {
        if (mounted) setLanguageLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    await databaseService.setSetting("language", nextLanguage);
    setActiveLanguage(nextLanguage);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: TranslationKey, values?: Record<string, string | number>) => {
      let text: string = translations[language][key];
      if (values) {
        for (const [name, replacement] of Object.entries(values)) {
          text = text.split(`{${name}}`).join(String(replacement));
        }
      }
      return text;
    };
    return {
      language,
      isLanguageLoaded,
      setLanguage,
      t,
      localizeClassName: (value) =>
        getLocalizedClassName(value, language, (key) => t(key)),
    };
  }, [isLanguageLoaded, language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
