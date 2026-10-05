import { DEFAULT_LOCALE, type Locale, isLocale } from '@wealth-advisor/rules';

const STORAGE_KEY = 'dewa-locale';
const listeners = new Set<() => void>();

const notify = (): void => listeners.forEach((listener) => listener());

function storedLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored !== null && isLocale(stored) ? stored : null;
}

function applyLocale(locale: Locale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}

// Unknown stored values fall back to the default, so a corrupt entry never breaks rendering.
let locale: Locale = storedLocale() ?? DEFAULT_LOCALE;
applyLocale(locale);

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  locale = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  applyLocale(next);
  notify();
}

export function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
