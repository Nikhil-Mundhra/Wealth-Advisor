// Locales the UI and the advisory LLM answer in; en is the International Track language.
export const LOCALES = ['en', 'zh-CN', 'zh-HK', 'de'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
