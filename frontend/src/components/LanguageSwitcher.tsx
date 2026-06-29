'use client';

import { useLang } from '@/lib/LangContext';
import { Lang } from '@/lib/i18n';

// Переключатель языка интерфейса
export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const langs: Lang[] = ['ru', 'en', 'es'];
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      className="border rounded px-2 py-1 text-sm bg-white"
    >
      {langs.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
