import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { de } from './de';
import { en, type Translation } from './en';

export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type TranslateParams = Record<string, string | number>;

const STORAGE_KEY = 'dt_language';

const LOCALES: Record<Language, Translation> = { en, de };

export function isSupportedLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Resolve the language to use: an explicit user choice wins, otherwise the
 * browser language (navigator.languages, best match), otherwise English.
 * Works outside React (e.g. from pwa.ts) because the user choice is persisted
 * to localStorage.
 */
export function resolveLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedLanguage(stored)) return stored;
  } catch {
    /* localStorage unavailable (private mode etc.) — fall through */
  }
  const candidates =
    typeof navigator !== 'undefined'
      ? [...(navigator.languages ?? []), navigator.language]
      : [];
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split('-')[0];
    if (isSupportedLanguage(base)) return base;
  }
  return 'en';
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/** Translate without React context (e.g. service-worker update prompts). */
export function translateFor(
  language: Language,
  key: string,
  params?: TranslateParams,
): string {
  return translate(LOCALES[language], key, params);
}

type StringTable = { [key: string]: unknown };

function lookupString(locale: StringTable, key: string): string | undefined {
  let node: unknown = locale;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as StringTable)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function translate(
  locale: Translation,
  key: string,
  params?: TranslateParams,
): string {
  const value = lookupString(locale as StringTable, key);
  if (value === undefined) return key; // missing key — surface the path
  return interpolate(value, params);
}

export interface I18nContextValue {
  language: Language;
  t: (key: string, params?: TranslateParams) => string;
  setLanguage: (language: Language) => void;
}

export const I18nContext = createContext<I18nContextValue>({
  language: 'en',
  t: (key, params) => translate(en, key, params),
  setLanguage: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(resolveLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* silently ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      t: (key, params) => translate(LOCALES[language], key, params),
      setLanguage,
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
