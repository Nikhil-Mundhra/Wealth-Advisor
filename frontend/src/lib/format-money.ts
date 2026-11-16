import { CURRENCY_MINOR_UNITS, type Currency } from '@wealth-advisor/rules';
import { getLocale } from './locale-store.ts';

// Locale-aware money rendering; falls back to a plain code suffix when Intl lacks the currency.
export function formatMoney(value: number, currency: Currency): string {
  try {
    return new Intl.NumberFormat(getLocale(), { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString(getLocale())} ${currency}`;
  }
}

export function formatMinorMoney(minorUnits: number, currency: Currency): string {
  const exponent = CURRENCY_MINOR_UNITS[currency];
  return formatMoney(Math.round(minorUnits / 10 ** exponent), currency);
}
