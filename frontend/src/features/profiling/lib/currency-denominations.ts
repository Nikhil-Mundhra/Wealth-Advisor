import type { Currency } from '@wealth-advisor/rules';

// Denominations for speed tiers [Slowest, Slow, Medium, Fast, Fastest]
// Calibrated relative to purchasing power and nominal scale (AED: 5-10-50-100-500)
export const CURRENCY_DENOMINATION_TIERS: Record<string, [number, number, number, number, number]> = {
  // Base requested benchmark: 5-10-50-100-500 AED
  AED: [5, 10, 50, 100, 500],
  SAR: [5, 10, 50, 100, 500],
  QAR: [5, 10, 50, 100, 500],

  // Western benchmark currencies (~1:1 PPP base relative scale)
  USD: [1, 5, 10, 25, 100],
  EUR: [1, 5, 10, 25, 100],
  GBP: [1, 5, 10, 25, 100],
  CHF: [1, 5, 10, 25, 100],

  // Mid-scale currencies
  SGD: [2, 5, 20, 50, 250],
  CAD: [2, 5, 20, 50, 250],
  AUD: [2, 5, 20, 50, 250],

  // East Asian multi-unit currencies
  CNY: [10, 20, 100, 200, 1000],
  HKD: [10, 20, 100, 200, 1000],

  // Higher nominal scale currencies
  INR: [100, 250, 1000, 2500, 10000],
  JPY: [200, 500, 2000, 5000, 20000],
};

const DEFAULT_TIERS: [number, number, number, number, number] = [1, 5, 25, 100, 500];

export function getDenominationTiers(currency: Currency | string): [number, number, number, number, number] {
  const upper = currency.toUpperCase();
  return CURRENCY_DENOMINATION_TIERS[upper] ?? DEFAULT_TIERS;
}

export function getTierFromMomentum(momentum: number): number {
  if (momentum < 20) return 0;
  if (momentum < 60) return 1;
  if (momentum < 120) return 2;
  if (momentum < 200) return 3;
  return 4;
}
