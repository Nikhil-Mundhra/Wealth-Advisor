import { useSyncExternalStore } from 'react';
import { ChevronDown } from 'lucide-react';
import { LOCALES, type Locale, isLocale } from '@wealth-advisor/rules';
import { getLocale, setLocale, subscribeToLocale } from '../../lib/locale-store.ts';
import { useStrings } from '../../lib/dictionaries.ts';

const NATIVE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-HK': '繁體中文',
  de: 'Deutsch',
};

// Header control: a native select (free keyboard and screen-reader support) with a drawn
// chevron, since browser-drawn select arrows ignore padding and hug the edge.
export function LanguageSelect() {
  const locale = useSyncExternalStore(subscribeToLocale, getLocale);
  const strings = useStrings();
  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label={strings['header.language']}
        value={locale}
        onChange={(event) => {
          // The DOM only offers our own options, but a tampered value must not poison the store.
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
        className="h-11 appearance-none rounded-field border border-line bg-surface py-2 pl-3 pr-9 text-sm text-ink"
      >
        {LOCALES.map((option) => (
          <option key={option} value={option}>
            {NATIVE_LABELS[option]}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 size-4 text-subtle" />
    </span>
  );
}
