import type { Currency } from '@wealth-advisor/rules';
import { getLocale } from './locale-store.ts';

// Locale-aware money rendering; falls back to a plain code suffix when Intl lacks the currency.
export function formatMoney(value: number, currency: Currency): string {
  try {
    return new Intl.NumberFormat(getLocale(), { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString(getLocale())} ${currency}`;
  }
}
