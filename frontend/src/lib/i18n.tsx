import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DICTIONARY, DICTIONARY_JA, DICTIONARY_KO } from "./translations";

export type Lang = "vi" | "en" | "ja" | "ko";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({ lang: "vi", setLang: () => {} });

const STORAGE_KEY = "petlingo.lang";
const VALID_LANGS: Lang[] = ["vi", "en", "ja", "ko"];

/**
 * Wraps the kid-facing app (not /admin — that's a separate operator tool,
 * out of scope here). Starts from whatever was last picked on this device
 * so there's no Vietnamese flash before the real preference loads from the
 * parent's account; App.tsx calls setLang again once `/auth/me` resolves so
 * the account's saved choice always wins once known.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_LANGS.includes(stored as Lang) ? (stored as Lang) : "vi";
  });

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}

const CHROME_DICTIONARIES: Partial<Record<Lang, Record<string, string>>> = {
  en: DICTIONARY,
  ja: DICTIONARY_JA,
  ko: DICTIONARY_KO,
};

/**
 * Translates a piece of UI chrome text (labels, buttons, headers, messages)
 * from its Vietnamese original to the selected interface language; falls
 * back to the Vietnamese string itself if no translation is registered yet
 * (or lang === "vi"), so a missing dictionary entry degrades to "still
 * readable" rather than blank.
 *
 * Deliberately NOT used for lesson/vocab CONTENT (English target words +
 * their native-language meanings in Lesson/MiniGame/WordCatch/SrsCard/
 * Topics) — those are what the child is learning, not interface chrome, and
 * are already localized server-side by `pickLang()` in the backend's
 * catalog.service.ts (see schema.prisma's Language enum doc comment).
 */
export function useT() {
  const { lang } = useLang();
  const dict = CHROME_DICTIONARIES[lang];
  return useCallback((vi: string) => dict?.[vi] ?? vi, [dict]);
}
