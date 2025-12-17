'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { defaultLanguage, isLanguage, translations } from '@/lib/i18n';
import type { Language, TranslationKey } from '@/lib/i18n';

type TranslationParams = Record<string, string | number>;

type I18nContextValue = {
  language: Language;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  switchLanguage: (language: Language) => void;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return defaultLanguage;
  }

  const stored = localStorage.getItem('language');
  if (stored === 'fr' || stored === 'en') {
    return stored;
  }

  const cookieMatch = document.cookie.match(/(?:^|;\s*)language=([^;]+)/);
  const cookieLang = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  if (isLanguage(cookieLang)) {
    return cookieLang;
  }

  const browserLang = navigator.language.slice(0, 2);
  if (browserLang === 'fr' || browserLang === 'en') {
    return browserLang;
  }

  return defaultLanguage;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
      document.cookie = `language=${encodeURIComponent(language)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;
      document.documentElement.lang = language;
    }
  }, [language]);

  const translate = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const template = translations[language][key] ?? key;
      if (!params) {
        return template;
      }

      return template.replace(/\{(\w+)\}/g, (_, token: string) => {
        const value = params[token];
        return value !== undefined ? String(value) : `{${token}}`;
      });
    },
    [language],
  );

  const switchLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      t: translate,
      switchLanguage,
    }),
    [language, translate, switchLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
