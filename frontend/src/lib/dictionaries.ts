import { useSyncExternalStore } from 'react';
import type { Locale } from '@wealth-advisor/rules';
import type { StringKey } from './locales/en.ts';
import { getLocale, subscribeToLocale } from './locale-store.ts';
import { de } from './locales/de.ts';
import { en } from './locales/en.ts';
import { zhCn } from './locales/zh-cn.ts';
import { zhHk } from './locales/zh-hk.ts';

export type { StringKey };

export const STRINGS: Record<Locale, Record<StringKey, string>> = { en, de, 'zh-CN': zhCn, 'zh-HK': zhHk };

export function useStrings(): Record<StringKey, string> {
  const locale = useSyncExternalStore(subscribeToLocale, getLocale);
  return STRINGS[locale];
}
