// ISO codes for Elena's corridors; pairs arrive with the finance module (Phase 2).
export const CURRENCIES = ['EUR', 'GBP', 'USD', 'SGD', 'CNY', 'JPY', 'HKD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}
