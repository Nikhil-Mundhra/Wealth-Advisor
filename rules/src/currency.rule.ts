// ISO codes for Elena's corridors; pairs arrive with the finance module (Phase 2).
export const CURRENCIES = ['EUR', 'GBP', 'USD', 'SGD', 'CNY', 'JPY', 'HKD'] as const;
export type Currency = (typeof CURRENCIES)[number];

// ISO 4217 minor-unit exponent: amounts are stored as integers of 10^-exponent of the unit (yen has no minor unit).
export const CURRENCY_MINOR_UNITS: Readonly<Record<Currency, number>> = {
  EUR: 2,
  GBP: 2,
  USD: 2,
  SGD: 2,
  CNY: 2,
  JPY: 0,
  HKD: 2,
};

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}
