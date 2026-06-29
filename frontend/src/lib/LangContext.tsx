'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, Lang } from './i18n';

// Контекст языка интерфейса с переключением и переводом
interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'ru',
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('lang')) as Lang;
    if (saved && translations[saved]) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('lang', l);
  };

  const t = (key: string) => translations[lang][key] || key;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
