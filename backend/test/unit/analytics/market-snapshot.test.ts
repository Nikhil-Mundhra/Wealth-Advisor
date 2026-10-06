import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { SNAPSHOT_MIN_OBSERVATIONS } from '@wealth-advisor/rules';
import { MarketSnapshot, type MarketSnapshotValue } from '../../../src/modules/analytics/domain/market-snapshot.vo.ts';
import { measureSnapshot } from '../../../src/modules/analytics/domain/measure-snapshot.ts';

const valid: MarketSnapshotValue = {
  asOf: '2025-01-09',
  symbols: ['A', 'B'],
  means: [0.1, -0.02],
  volatilities: [0.2, 0.3],
  covariance: [
    [0.04, -0.01],
    [-0.01, 0.09],
  ],
  window: { from: '2024-01-10', to: '2025-01-09', observations: 250 },
  computedAt: new Date('2025-01-09T23:00:00Z'),
};

describe('MarketSnapshot invariants', () => {
  it('accepts a consistent snapshot and freezes copies of its arrays', () => {
    const symbols = ['A', 'B'];
    const snapshot = MarketSnapshot.of({ ...valid, symbols });
    symbols.push('C');
    assert.deepEqual(snapshot.symbols, ['A', 'B']);
    assert.ok(Object.isFrozen(snapshot.covariance[0]));
  });

  const broken: [string, Partial<MarketSnapshotValue>][] = [
    ['non-square covariance', { covariance: [[0.04, -0.01], [-0.01]] }],
    ['covariance over the wrong number of symbols', { covariance: [[0.04]] }],
    ['asymmetric covariance', { covariance: [[0.04, -0.01], [0.01, 0.09]] }],
    ['NaN in the covariance', { covariance: [[0.04, Number.NaN], [Number.NaN, 0.09]] }],
    ['infinite mean', { means: [Number.POSITIVE_INFINITY, 0] }],
    ['means shorter than symbols', { means: [0.1] }],
    ['volatilities longer than symbols', { volatilities: [0.2, 0.3, 0.4] }],
    ['volatility that is not the root of its variance', { volatilities: [0.2, 0.31] }],
    ['negative volatility', { volatilities: [-0.2, 0.3] }],
    ['repeated symbol', { symbols: ['A', 'A'] }],
    ['no symbols', { symbols: [], means: [], volatilities: [], covariance: [] }],
    ['malformed asOf', { asOf: '2025-13-01' }],
    ['window ending after asOf', { window: { from: '2024-01-10', to: '2025-01-10', observations: 250 } }],
    ['window ending before it starts', { window: { from: '2025-01-09', to: '2024-01-10', observations: 250 } }],
    ['fractional observations', { window: { from: '2024-01-10', to: '2025-01-09', observations: 2.5 } }],
    ['invalid computedAt', { computedAt: new Date('nope') }],
  ];
  for (const [label, change] of broken) {
    it(`rejects ${label} with AN_1900`, () => {
      assert.throws(() => MarketSnapshot.of({ ...valid, ...change }), { code: 'AN_1900' });
    });
  }
});

describe('measureSnapshot', () => {
  const dates = (count: number) => Array.from({ length: count }, (_, i) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10));
  const series = (count: number) => ({
    symbols: ['A', 'B'],
    dates: dates(count),
    values: [dates(count).map((_, i) => 100 + (i % 3)), dates(count).map((_, i) => 50 + (i % 2))],
  });

  it(`is insufficient below ${SNAPSHOT_MIN_OBSERVATIONS} returns`, () => {
    assert.deepEqual(measureSnapshot(series(SNAPSHOT_MIN_OBSERVATIONS), '2025-03-01', new Date()), {
      kind: 'insufficient',
      observations: SNAPSHOT_MIN_OBSERVATIONS - 1,
    });
  });

  it('measures from the minimum on, with the window spanning the aligned dates', () => {
    const result = measureSnapshot(series(SNAPSHOT_MIN_OBSERVATIONS + 1), '2025-03-01', new Date('2025-03-01T23:00:00Z'));
    assert.equal(result.kind, 'measured');
    if (result.kind !== 'measured') return;
    assert.deepEqual(result.snapshot.window, { from: '2025-01-01', to: '2025-01-31', observations: SNAPSHOT_MIN_OBSERVATIONS });
    assert.deepEqual(result.snapshot.symbols, ['A', 'B']);
    assert.equal(result.snapshot.volatilities[0], Math.sqrt(result.snapshot.covariance[0][0]));
  });
});
