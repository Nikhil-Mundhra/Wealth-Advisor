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
  'household.individual': 'Individual',
  'household.family': 'Family household',
  'dashboard.networth': 'Net worth',
  'dashboard.runway': 'Emergency runway',
  'dashboard.months': 'months',
  'dashboard.allocation': 'Target allocation',
  'runway.critical': 'Critical',
  'runway.warning': 'Warning',
  'runway.healthy': 'Healthy',
  'portfolio.holdings': 'Holdings',
  'portfolio.current': 'Current',
  'portfolio.target': 'Target',
  'portfolio.drift': 'drift',
  'cashflow.accounts': 'Accounts',
  'cashflow.remit': 'Remittance plan',
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
  'household.individual': 'Einzelperson',
  'household.family': 'Familienhaushalt',
  'dashboard.networth': 'Nettovermögen',
  'dashboard.runway': 'Notfallreserve',
  'dashboard.months': 'Monate',
  'dashboard.allocation': 'Zielallokation',
  'runway.critical': 'Kritisch',
  'runway.warning': 'Warnung',
  'runway.healthy': 'Gesund',
  'portfolio.holdings': 'Bestände',
  'portfolio.current': 'Aktuell',
  'portfolio.target': 'Ziel',
  'portfolio.drift': 'Abweichung',
  'cashflow.accounts': 'Konten',
  'cashflow.remit': 'Überweisungsplan',
};

const zhCn: Record<StringKey, string> = {
  'app.name': 'DEWA',
  'nav.main': '主导航',
  'nav.dashboard': '仪表盘',
  'nav.portfolio': '投资组合',
  'nav.cashflow': '现金流',
  'nav.advisory': '智能投顾',
  'header.settings': '设置',
  'household.individual': '个人',
  'household.family': '家庭户',
  'dashboard.networth': '净资产',
  'dashboard.runway': '应急储备金',
  'dashboard.months': '个月',
  'dashboard.allocation': '目标配置',
  'runway.critical': '严重不足',
  'runway.warning': '偏低',
  'runway.healthy': '健康',
  'portfolio.holdings': '持仓',
  'portfolio.current': '当前',
  'portfolio.target': '目标',
  'portfolio.drift': '偏离',
  'cashflow.accounts': '账户',
  'cashflow.remit': '汇款计划',
};

const zhHk: Record<StringKey, string> = {
  'app.name': 'DEWA',
  'nav.main': '主導航',
  'nav.dashboard': '儀表板',
  'nav.portfolio': '投資組合',
  'nav.cashflow': '現金流',
  'nav.advisory': '智能投顧',
  'header.settings': '設定',
  'household.individual': '個人',
  'household.family': '家庭戶',
  'dashboard.networth': '資產淨值',
  'dashboard.runway': '應急儲備金',
  'dashboard.months': '個月',
  'dashboard.allocation': '目標配置',
  'runway.critical': '嚴重不足',
  'runway.warning': '偏低',
  'runway.healthy': '健康',
  'portfolio.holdings': '持倉',
  'portfolio.current': '當前',
  'portfolio.target': '目標',
  'portfolio.drift': '偏離',
  'cashflow.accounts': '賬戶',
  'cashflow.remit': '匯款計劃',
};

export const STRINGS: Record<Locale, Record<StringKey, string>> = { en, de, 'zh-CN': zhCn, 'zh-HK': zhHk };

export function getStrings(locale: Locale): Record<StringKey, string> {
  return STRINGS[locale];
}

export function useStrings(): Record<StringKey, string> {
  const locale = useSyncExternalStore(subscribeToLocale, getLocale);
  return STRINGS[locale];
}
