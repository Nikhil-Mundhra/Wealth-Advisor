import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { annualizedCovariance } from '../../../src/modules/analytics/domain/covariance.ts';
import { alignSeries, annualizedMean, logReturns, type PricePoint } from '../../../src/modules/analytics/domain/returns.ts';

const close = (actual: number, expected: number, label: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${label}: ${actual} ≠ ${expected}`);

// Prices are e^(log price), so the daily log returns are exactly the steps below and every expected figure is
// worked by hand from them (sample covariance, n − 1 = 4, × 252):
//   A returns  .01  .02 -.01  .00  .02   mean .008  deviations .002 .012 -.018 -.008 .012  Σd² 680e-6
//   B returns  .00 -.01  .01  .02 -.02   mean 0                                        Σd² 1000e-6
//   C returns  .02  .00  .00 -.02  .00   mean 0                                        Σd² 800e-6
//   Σ dA·dB = -700e-6   Σ dA·dC = 200e-6   Σ dB·dC = -400e-6
const DATES = ['2025-01-02', '2025-01-03', '2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09'];
const LOG_PRICES: Record<string, number[]> = {
  A: [0, 0.01, 0.03, 0.02, 0.02, 0.04],
  B: [0, 0, -0.01, 0, 0.02, 0],
  C: [0, 0.02, 0.02, 0.02, 0, 0],
};
const points: PricePoint[] = Object.entries(LOG_PRICES).flatMap(([symbol, logs]) =>
  logs.map((log, i) => ({ symbol, date: DATES[i], value: 100 * Math.exp(log) })),
);

describe('alignSeries', () => {
  it('keeps the dates every symbol has, ordered, with one value row per symbol in the asked order', () => {
    const series = alignSeries(points, ['C', 'A', 'B']);
    assert.deepEqual(series.dates, DATES);
    assert.deepEqual(series.symbols, ['C', 'A', 'B']);
    close(series.values[1][2], 100 * Math.exp(0.03), 'A on the third day');
  });

  it('drops a date one symbol lacks for every symbol, and ignores untracked symbols', () => {
    const gappy = [...points.filter((p) => !(p.symbol === 'B' && p.date === '2025-01-06')), { symbol: 'Z', date: '2025-01-10', value: 1 }];
    const series = alignSeries(gappy, ['A', 'B', 'C']);
    assert.deepEqual(series.dates, ['2025-01-02', '2025-01-03', '2025-01-07', '2025-01-08', '2025-01-09']);
    assert.ok(series.values.every((row) => row.length === 5));
  });

  it('a symbol with no prices leaves no aligned dates', () => {
    assert.deepEqual(alignSeries(points, ['A', 'MISSING']).dates, []);
  });
});

describe('returns', () => {
  it('daily log returns are ln(p[t]/p[t-1])', () => {
    const returns = logReturns(LOG_PRICES.A.map((log) => 100 * Math.exp(log)));
    [0.01, 0.02, -0.01, 0, 0.02].forEach((expected, i) => close(returns[i], expected, `A return ${i}`));
  });

  it('annualized mean is the daily mean × 252', () => {
    close(annualizedMean([0.01, 0.02, -0.01, 0, 0.02]), 0.008 * 252, 'A');
    close(annualizedMean([0, -0.01, 0.01, 0.02, -0.02]), 0, 'B');
  });

  it('rejects a non-positive price and an empty mean', () => {
    assert.throws(() => logReturns([100, 0, 101]), { code: 'AN_1900' });
    assert.throws(() => annualizedMean([]), { code: 'AN_1900' });
  });
});

describe('annualizedCovariance', () => {
  const returns = ['A', 'B', 'C'].map((symbol) => logReturns(LOG_PRICES[symbol].map((log) => 100 * Math.exp(log))));
  const matrix = annualizedCovariance(returns);

  it('matches the hand-computed annualized sample covariance', () => {
    const expected = [
      [(680e-6 / 4) * 252, (-700e-6 / 4) * 252, (200e-6 / 4) * 252],
      [(-700e-6 / 4) * 252, (1000e-6 / 4) * 252, (-400e-6 / 4) * 252],
      [(200e-6 / 4) * 252, (-400e-6 / 4) * 252, (800e-6 / 4) * 252],
    ];
    expected.forEach((row, i) => row.forEach((value, j) => close(matrix[i][j], value, `cov[${i}][${j}]`)));
    close(matrix[0][0], 0.04284, 'A variance in decimal');
    close(matrix[0][1], -0.0441, 'A,B covariance in decimal');
  });

  it('is exactly symmetric and its diagonal is each series variance', () => {
    matrix.forEach((row, i) => row.forEach((value, j) => assert.equal(value, matrix[j][i])));
    returns.forEach((series, i) => close(annualizedCovariance([series])[0][0], matrix[i][i], `variance ${i}`));
    close(Math.sqrt(matrix[1][1]), Math.sqrt(0.063), 'B annualized volatility');
  });

  it('rejects series of different lengths and fewer than two returns', () => {
    assert.throws(() => annualizedCovariance([[0.01, 0.02], [0.01]]), { code: 'AN_1900' });
    assert.throws(() => annualizedCovariance([[0.01]]), { code: 'AN_1900' });
  });
});
