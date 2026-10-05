import { CURRENCY_MINOR_UNITS, type Currency } from '@wealth-advisor/rules';
import { type Ratio, multiply, roundHalfEven, scaleByPowerOfTen, toNumber } from './decimal.ts';
import { Money } from './money.vo.ts';
import type { RateTable } from './rate-table.ts';
import { type ConversionMode, Valuation } from './valuation.vo.ts';

export interface ConversionItem {
  readonly money: Money;
  readonly date: string; // the day the amount is valued at; historical mode uses the rate on or before it
}

// A missing rate fails only its own item, so one gap does not void a whole portfolio's valuation.
export type ConversionResult =
  | { readonly ok: true; readonly valuation: Valuation }
  | { readonly ok: false; readonly reason: 'missing-rate'; readonly original: Money; readonly target: Currency; readonly rateDay: string };

export interface ConvertBatchInput {
  readonly items: readonly ConversionItem[];
  readonly target: Currency;
  readonly mode: ConversionMode;
  readonly rates: RateTable;
  readonly today: string;
}

// spot: every item at the latest rate on or before today; historical: each item at the rate on or before its own
// date (a weekend item takes Friday's rate); raw: no conversion. One rounding rule: half to even, to the target's
// minor unit.
export function convertBatch(input: ConvertBatchInput): ConversionResult[] {
  return input.items.map((item) => convertOne(item, input));
}

function convertOne(item: ConversionItem, { target, mode, rates, today }: ConvertBatchInput): ConversionResult {
  const original = item.money;
  if (mode === 'raw' || original.currency === target) {
    return { ok: true, valuation: Valuation.of({ original, converted: original, rate: 1, rateDate: null, mode }) };
  }
  const rateDay = mode === 'spot' ? today : item.date;
  const quote = rates.lookup(original.currency, target, rateDay);
  if (!quote) return { ok: false, reason: 'missing-rate', original, target, rateDay };
  const converted = Money.of(Number(convertMinor(original, quote.rate, target)), target);
  return { ok: true, valuation: Valuation.of({ original, converted, rate: toNumber(quote.rate), rateDate: quote.date, mode }) };
}

// Minor units scale by 10^(target exponent − source exponent): 100 JPY (exponent 0) at 0.0067 → 67 US cents.
function convertMinor(original: Money, rate: Ratio, target: Currency): bigint {
  const exponentShift = CURRENCY_MINOR_UNITS[target] - CURRENCY_MINOR_UNITS[original.currency];
  return roundHalfEven(scaleByPowerOfTen(multiply({ num: BigInt(original.amount), den: 1n }, rate), exponentShift));
}
