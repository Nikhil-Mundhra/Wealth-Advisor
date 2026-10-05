import { useSyncExternalStore } from 'react';
import { LOCALES, type Locale } from '@wealth-advisor/rules';
import { getLocale, setLocale, subscribeToLocale } from '../../lib/locale-store.ts';

const NATIVE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-HK': '繁體中文',
  de: 'Deutsch',
};

// Header control: a native select (free keyboard and screen-reader support); the advisory LLM answers in this locale.
export function LanguageSelect() {
  const locale = useSyncExternalStore(subscribeToLocale, getLocale);
  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(event) => setLocale(event.target.value as Locale)}
      className="h-11 rounded-field border border-line bg-surface px-3 text-sm text-ink"
    >
      {LOCALES.map((option) => (
        <option key={option} value={option}>
          {NATIVE_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
