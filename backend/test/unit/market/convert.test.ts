import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { Currency } from '@wealth-advisor/rules';
import { convertBatch, type ConversionResult } from '../../../src/modules/market/domain/convert.ts';
import { Money } from '../../../src/modules/market/domain/money.vo.ts';
import { createRateTable } from '../../../src/modules/market/domain/rate-table.ts';
import type { ConversionMode } from '../../../src/modules/market/domain/valuation.vo.ts';
import { ecbRate } from '../../support/market-fixtures.ts';

// ECB rates from the recorded Frankfurter fixture: Friday 2025-01-03, then Monday 2025-01-06 (no weekend rates).
const rates = createRateTable([
  ecbRate('USD', '2025-01-03', 1.0299),
  ecbRate('GBP', '2025-01-03', 0.82993),
  ecbRate('JPY', '2025-01-03', 161.77),
  ecbRate('USD', '2025-01-06', 1.0426),
  ecbRate('GBP', '2025-01-06', 0.83098),
  ecbRate('JPY', '2025-01-06', 163.25),
  ecbRate('SGD', '2025-01-06', 2),
]);

interface Row {
  readonly name: string;
  readonly money: Money;
  readonly date: string;
  readonly target: Currency;
  readonly mode: ConversionMode;
  readonly expect: { amount: number; currency: Currency; rate: number; rateDate: string | null } | 'missing-rate';
}

const TODAY = '2025-01-07';

const rows: Row[] = [
  { name: 'spot direct: latest rate on or before today', money: Money.of(10_000, 'EUR'), date: '2025-01-03', target: 'USD', mode: 'spot',
    expect: { amount: 10_426, currency: 'USD', rate: 1.0426, rateDate: '2025-01-06' } },
  { name: 'historical direct: rate of the item\'s own day', money: Money.of(10_000, 'EUR'), date: '2025-01-03', target: 'USD', mode: 'historical',
    expect: { amount: 10_299, currency: 'USD', rate: 1.0299, rateDate: '2025-01-03' } },
  { name: 'historical weekend gap: Saturday takes Friday\'s rate', money: Money.of(10_000, 'EUR'), date: '2025-01-04', target: 'USD', mode: 'historical',
    expect: { amount: 10_299, currency: 'USD', rate: 1.0299, rateDate: '2025-01-03' } },
  { name: 'historical weekend gap: Sunday takes Friday\'s rate', money: Money.of(10_000, 'EUR'), date: '2025-01-05', target: 'USD', mode: 'historical',
    expect: { amount: 10_299, currency: 'USD', rate: 1.0299, rateDate: '2025-01-03' } },
  { name: 'inverse: USD → EUR divides by EUR/USD', money: Money.of(10_426, 'USD'), date: '2025-01-06', target: 'EUR', mode: 'historical',
    expect: { amount: 10_000, currency: 'EUR', rate: 10_000 / 10_426, rateDate: '2025-01-06' } },
  { name: 'cross through EUR: USD → GBP', money: Money.of(100_000, 'USD'), date: '2025-01-06', target: 'GBP', mode: 'historical',
    // 1000 × 0.83098 / 1.0426 = 797.026661…
    expect: { amount: 79_703, currency: 'GBP', rate: 83_098 / 104_260, rateDate: '2025-01-06' } },
  { name: 'minor-unit shift: JPY (no minor unit) → EUR cents', money: Money.of(16_325, 'JPY'), date: '2025-01-06', target: 'EUR', mode: 'historical',
    expect: { amount: 10_000, currency: 'EUR', rate: 100 / 16_325, rateDate: '2025-01-06' } },
  { name: 'raw: passthrough in the original currency', money: Money.of(12_345, 'GBP'), date: '2025-01-06', target: 'USD', mode: 'raw',
    expect: { amount: 12_345, currency: 'GBP', rate: 1, rateDate: null } },
  { name: 'same currency: rate 1, no rate day', money: Money.of(500, 'USD'), date: '2025-01-01', target: 'USD', mode: 'historical',
    expect: { amount: 500, currency: 'USD', rate: 1, rateDate: null } },
  { name: 'whole-number rate: exact product', money: Money.of(1, 'EUR'), date: '2025-01-06', target: 'SGD', mode: 'historical',
    expect: { amount: 2, currency: 'SGD', rate: 2, rateDate: '2025-01-06' } },
  { name: 'missing rate: no published rate on or before the day', money: Money.of(100, 'EUR'), date: '2025-01-02', target: 'USD', mode: 'historical',
    expect: 'missing-rate' },
  { name: 'missing rate: pair never published', money: Money.of(100, 'EUR'), date: '2025-01-06', target: 'HKD', mode: 'spot', expect: 'missing-rate' },
];

describe('convertBatch', () => {
  for (const row of rows) {
    it(row.name, () => {
      const [result] = convertBatch({ items: [{ money: row.money, date: row.date }], target: row.target, mode: row.mode, rates, today: TODAY });
      if (row.expect === 'missing-rate') {
        assert.equal(result.ok, false);
        return;
      }
      assert.ok(result.ok);
      const { converted, rate, rateDate, mode, original } = result.valuation;
      assert.deepEqual({ amount: converted.amount, currency: converted.currency, rate, rateDate }, row.expect);
      assert.equal(mode, row.mode);
      assert.ok(original.equals(row.money));
    });
  }

  it('fails only the item without a rate; the rest of the batch converts', () => {
    const results = convertBatch({
      items: [
        { money: Money.of(100, 'EUR'), date: '2025-01-02' },
        { money: Money.of(100, 'EUR'), date: '2025-01-06' },
      ],
      target: 'USD',
      mode: 'historical',
      rates,
      today: TODAY,
    });
    assert.deepEqual(results.map((result: ConversionResult) => result.ok), [false, true]);
    const [missing] = results;
    assert.ok(!missing.ok);
    assert.deepEqual({ reason: missing.reason, target: missing.target, rateDay: missing.rateDay }, { reason: 'missing-rate', target: 'USD', rateDay: '2025-01-02' });
  });

  it('rounds exact ties half to even in both directions, with no float drift', () => {
    const table = createRateTable([ecbRate('USD', '2025-01-06', 1.5), ecbRate('GBP', '2025-01-06', 1.1)]);
    const convert = (amount: number, target: Currency) =>
      convertBatch({ items: [{ money: Money.of(amount, 'EUR'), date: '2025-01-06' }], target, mode: 'historical', rates: table, today: TODAY })[0];
    const amountOf = (result: ConversionResult) => (result.ok ? result.valuation.converted.amount : null);
    assert.equal(amountOf(convert(1, 'USD')), 2); // 1.5 → 2 (even)
    assert.equal(amountOf(convert(3, 'USD')), 4); // 4.5 → 4 (even)
    assert.equal(amountOf(convert(5, 'USD')), 8); // 7.5 → 8 (even)
    // 55 × 1.1 is 60.50000000000001 in floats, which would round up to 61; the exact tie 60.5 goes to 60.
    assert.equal(amountOf(convert(55, 'GBP')), 60);
  });
});

describe('Money', () => {
  it('reads a provider decimal to minor units, half to even', () => {
    assert.equal(Money.fromMajor(543.795, 'USD').amount, 54_380); // 54379.5 → 54380 (even)
    assert.equal(Money.fromMajor(543.785, 'USD').amount, 54_378); // 54378.5 → 54378 (even)
    assert.equal(Money.fromMajor(161.77, 'JPY').amount, 162);
  });

  it('rejects a non-integer amount', () => {
    assert.throws(() => Money.of(1.5, 'USD'), { code: 'MK_1900' });
  });
});
