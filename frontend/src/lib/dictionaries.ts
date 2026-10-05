import { useSyncExternalStore } from 'react';
import type { Locale } from '@wealth-advisor/rules';
import { getLocale, subscribeToLocale } from './locale-store.ts';

// UI copy. Every locale carries the same keys (dictionaries.test.ts enforces it); pages add keys here as they land.
const en = {
  'app.name': 'DEWA',
  'nav.main': 'Main',
  'nav.dashboard': 'Dashboard',
  'nav.portfolio': 'Portfolio',
  'nav.cashflow': 'Cash Flow',
  'nav.advisory': 'Advisory',
  'header.settings': 'Settings',
} as const;

export type StringKey = keyof typeof en;

const de: Record<StringKey, string> = {
  'app.name': 'DEWA',
  'nav.main': 'Hauptmenü',
  'nav.dashboard': 'Dashboard',
  'nav.portfolio': 'Portfolio',
  'nav.cashflow': 'Cashflow',
  'nav.advisory': 'Beratung',
  'header.settings': 'Einstellungen',
};

const zhCn: Record<StringKey, string> = {
  'app.name': 'DEWA',
  'nav.main': '主导航',
  'nav.dashboard': '仪表盘',
  'nav.portfolio': '投资组合',
  'nav.cashflow': '现金流',
  'nav.advisory': '智能投顾',
  'header.settings': '设置',
};

const zhHk: Record<StringKey, string> = {
  'app.name': 'DEWA',
  'nav.main': '主導航',
  'nav.dashboard': '儀表板',
  'nav.portfolio': '投資組合',
  'nav.cashflow': '現金流',
  'nav.advisory': '智能投顧',
  'header.settings': '設定',
};

export const STRINGS: Record<Locale, Record<StringKey, string>> = { en, de, 'zh-CN': zhCn, 'zh-HK': zhHk };

export function getStrings(locale: Locale): Record<StringKey, string> {
  return STRINGS[locale];
}

export function useStrings(): Record<StringKey, string> {
  const locale = useSyncExternalStore(subscribeToLocale, getLocale);
  return STRINGS[locale];
}
