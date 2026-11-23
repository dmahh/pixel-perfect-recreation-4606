import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LANGUAGE_STORAGE_KEY, parseLanguage, translate, type Language } from "@/lib/i18n";

type LanguageContextValue = { language: Language; setLanguage: (value: Language) => void; t: (text: string) => string };
const LanguageContext = createContext<LanguageContextValue>({ language: "en", setLanguage: () => {}, t: text => text });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => {
    try { setLanguageState(parseLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))); } catch { /* Storage may be disabled. */ }
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: next => {
      setLanguageState(next);
      try { localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* Switching still works without storage. */ }
    },
    t: text => translate(language, text),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);