import { isCurrency, type Currency } from '@wealth-advisor/rules';
import { FxRate } from '../../domain/fx-rate.vo.ts';

const MOCK_EUR_RATES: Readonly<Record<string, number>> = {
  USD: 1.08,
  GBP: 0.85,
  SGD: 1.45,
  CNY: 7.82,
  AED: 3.97,
  INR: 90.5,
  HKD: 8.41,
  JPY: 162.5,
};

/**
 * Deterministic mock FX provider used when live ECB/Frankfurter upstream calls fail
 * and no fresh/stale cached rate exists. Responses are marked stale/mock downstream.
 */
export function buildMockFxRates(base: Currency, date: string): Array<{ quote: Currency; rate: number; date: string; source: string }> {
  const basePerEur = base === 'EUR' ? 1 : (MOCK_EUR_RATES[base] ?? 1);
  return Object.entries(MOCK_EUR_RATES)
    .filter(([quote]) => quote !== base && isCurrency(quote))
    .map(([quote, eurToQuote]) => {
      const rate = Number((eurToQuote / basePerEur).toFixed(4));
      return {
        quote: FxRate.of({ base, quote: quote as Currency, date, rate, source: 'mock:fallback' }).value.quote,
        rate,
        date,
        source: 'mock:fallback',
      };
    });
}
