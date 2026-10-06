import { strict as assert } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { createEnvelope } from '#core/events/event-envelope.ts';
import { MemoryProcessedEvents } from '#core/events/memory-processed-events.ts';
import { addDays } from '#core/time/calendar-date.ts';
import { createAnalyticsApi, SNAPSHOT_HANDLER } from '../../../src/modules/analytics/analytics.api.ts';
import { MemoryMarketSnapshotRepository } from '../../../src/modules/analytics/infrastructure/db/memory/memory-market-snapshot.repository.ts';
import { Money } from '../../../src/modules/market/domain/money.vo.ts';
import { Price } from '../../../src/modules/market/domain/price.vo.ts';
import { FakeClock } from '../../support/fake-clock.ts';
import { usdClose, weekdays } from '../../support/market-fixtures.ts';

const AS_OF = '2025-03-14';
const SYMBOLS = ['VT', 'IEF'];

function refreshed(asOf = AS_OF, version = 1) {
  return createEnvelope({ type: 'market.data_refreshed', version, occurredAt: new Date(), payload: { asOf, symbols: SYMBOLS, fxBase: 'EUR' } });
}

// Stored history fake: answers from a fixed list of prices and records every window it was asked for.
function fakeMarket(prices: Price[]) {
  const calls: { symbols: readonly string[]; from: string; to: string }[] = [];
  return {
    calls,
    async history(symbols: readonly string[], from: string, to: string) {
      calls.push({ symbols, from, to });
      return prices.filter((price) => symbols.includes(price.symbol) && price.date >= from && price.date <= to);
    },
  };
}

function closes(days: string[]): Price[] {
  return days.flatMap((day, i) => [usdClose('VT', day, 10_000 + ((i * 37) % 101)), usdClose('IEF', day, 9_000 + ((i * 53) % 89))]);
}

describe('analytics onMarketDataRefreshed', () => {
  let snapshots: MemoryMarketSnapshotRepository;
  let processed: MemoryProcessedEvents;
  const clock = new FakeClock(new Date('2025-03-14T23:30:00Z'));
  const build = (prices: Price[]) => {
    const market = fakeMarket(prices);
    return { market, api: createAnalyticsApi({ market, snapshots, processed, clock }) };
  };

  beforeEach(() => {
    snapshots = new MemoryMarketSnapshotRepository();
    processed = new MemoryProcessedEvents();
  });

  it('reads the 365 days ending at asOf and stores one snapshot keyed by asOf', async () => {
    const { market, api } = build(closes(weekdays('2025-01-02', AS_OF)));
    const result = await api.onMarketDataRefreshed(refreshed());
    assert.deepEqual(market.calls, [{ symbols: SYMBOLS, from: addDays(AS_OF, -365), to: AS_OF }]);
    assert.deepEqual({ outcome: result.outcome, mark: 'mark' in result ? result.mark : null }, { outcome: 'measured', mark: 'first' });
    const stored = await api.latestSnapshot();
    assert.equal(stored.asOf, AS_OF);
    assert.deepEqual(stored.symbols, SYMBOLS);
    assert.deepEqual(stored.window, { from: '2025-01-02', to: AS_OF, observations: weekdays('2025-01-02', AS_OF).length - 1 });
    assert.deepEqual(stored.computedAt, clock.now());
  });

  it('the same event twice leaves one snapshot; the second delivery reports duplicate', async () => {
    const { api } = build(closes(weekdays('2025-01-02', AS_OF)));
    const event = refreshed();
    const first = await api.onMarketDataRefreshed(event);
    const again = await api.onMarketDataRefreshed(event);
    assert.equal('mark' in first && first.mark, 'first');
    assert.equal('mark' in again && again.mark, 'duplicate');
    assert.equal((await api.snapshotAt(AS_OF)).asOf, AS_OF);
    assert.deepEqual(await snapshots.latest(), await snapshots.at(AS_OF));
  });

  it('too few aligned observations: no snapshot, event still marked', async () => {
    const { api } = build(closes(weekdays('2025-02-20', AS_OF)));
    const event = refreshed();
    const result = await api.onMarketDataRefreshed(event);
    assert.equal(result.outcome, 'insufficient');
    assert.equal(await snapshots.latest(), null);
    assert.equal(await processed.markProcessed(SNAPSHOT_HANDLER, event.id), 'duplicate');
    await assert.rejects(api.latestSnapshot(), { code: 'AN_1001' });
  });

  it('aligns on dates both symbols have: a gap in one series removes that date from both', async () => {
    const days = weekdays('2025-01-02', AS_OF);
    const prices = closes(days).filter((price) => !(price.symbol === 'IEF' && price.date === days[10]));
    const { api } = build(prices);
    await api.onMarketDataRefreshed(refreshed());
    assert.equal((await api.latestSnapshot()).window.observations, days.length - 2);
  });

  it('uses the adjusted close, falling back to the close where none was sent', async () => {
    const days = weekdays('2025-01-02', AS_OF);
    // Adjusted closes are constant, raw closes move: only the fallback rows can produce non-zero returns.
    const withAdjusted = days.flatMap((day, i) => [
      Price.of({ symbol: 'VT', date: day, close: Money.of(10_000 + i, 'USD'), adjClose: Money.of(10_000, 'USD'), source: 'test' }),
      Price.of({ symbol: 'IEF', date: day, close: Money.of(9_000 + (i % 7), 'USD'), adjClose: null, source: 'test' }),
    ]);
    const { api } = build(withAdjusted);
    await api.onMarketDataRefreshed(refreshed());
    const snapshot = await api.latestSnapshot();
    assert.equal(snapshot.volatilities[0], 0);
    assert.ok(snapshot.volatilities[1] > 0);
  });

  it('ignores another version of the event without marking it', async () => {
    const { market, api } = build(closes(weekdays('2025-01-02', AS_OF)));
    const event = refreshed(AS_OF, 2);
    assert.deepEqual(await api.onMarketDataRefreshed(event), { outcome: 'ignored' });
    assert.equal(market.calls.length, 0);
    assert.equal(await processed.markProcessed(SNAPSHOT_HANDLER, event.id), 'first');
  });

  it('rejects a v1 payload that breaks its contract', async () => {
    const { api } = build([]);
    const event = createEnvelope({ type: 'market.data_refreshed', version: 1, occurredAt: new Date(), payload: { asOf: 'yesterday' } });
    await assert.rejects(api.onMarketDataRefreshed(event));
  });

  it('snapshotAt answers AN_1001 for a date without a snapshot', async () => {
    const { api } = build(closes(weekdays('2025-01-02', AS_OF)));
    await api.onMarketDataRefreshed(refreshed());
    await assert.rejects(api.snapshotAt('2025-03-13'), { code: 'AN_1001' });
  });
});
