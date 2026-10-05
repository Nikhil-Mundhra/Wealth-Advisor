import { strict as assert } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import type { Currency } from '@wealth-advisor/rules';
import { addDays } from '#core/time/calendar-date.ts';
import { InProcessEventBus } from '#core/events/event-bus.ts';
import type { EventEnvelope } from '#core/events/event-envelope.ts';
import type { FxSource, PriceSource } from '../../../src/modules/market/application/ports.ts';
import { MarketErrors } from '../../../src/modules/market/domain/errors/market-errors.ts';
import type { FxRate } from '../../../src/modules/market/domain/fx-rate.vo.ts';
import type { Price } from '../../../src/modules/market/domain/price.vo.ts';
import { TRACKED_SYMBOL_NAMES } from '../../../src/modules/market/domain/tracked-symbols.ts';
import { MemoryFxRateRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-fx-rate.repository.ts';
import { MemoryPriceRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-price.repository.ts';
import { createMarketApi } from '../../../src/modules/market/market.api.ts';
import { FakeClock } from '../../support/fake-clock.ts';
import { ecbRate, usdClose } from '../../support/market-fixtures.ts';

interface Call {
  readonly from: string;
  readonly to: string;
}

// Fake providers: one close per tracked symbol and one EUR/USD rate per weekday of the asked range.
function weekdays(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.push(day);
  }
  return days;
}

function fakePriceSource(): PriceSource & { calls: Call[]; failWith: Error | null } {
  const source = {
    calls: [] as Call[],
    failWith: null as Error | null,
    async fetchEndOfDay(symbols: readonly string[], from: string, to: string): Promise<Price[]> {
      source.calls.push({ from, to });
      if (source.failWith) throw source.failWith;
      return weekdays(from, to).flatMap((day) => symbols.map((symbol) => usdClose(symbol, day, 10_000)));
    },
  };
  return source;
}

function fakeFxSource(): FxSource & { calls: Call[]; failWith: Error | null } {
  const source = {
    calls: [] as Call[],
    failWith: null as Error | null,
    async fetchRange(_base: Currency, _quotes: readonly Currency[], from: string, to: string): Promise<FxRate[]> {
      source.calls.push({ from, to });
      if (source.failWith) throw source.failWith;
      return weekdays(from, to).map((day) => ecbRate('USD', day, 1.04));
    },
  };
  return source;
}

describe('market refresh', () => {
  let prices: MemoryPriceRepository;
  let fxRates: MemoryFxRateRepository;
  let priceSource: ReturnType<typeof fakePriceSource>;
  let fxSource: ReturnType<typeof fakeFxSource>;
  let published: EventEnvelope[];
  let api: ReturnType<typeof createMarketApi>;

  beforeEach(() => {
    prices = new MemoryPriceRepository();
    fxRates = new MemoryFxRateRepository();
    priceSource = fakePriceSource();
    fxSource = fakeFxSource();
    published = [];
    const events = new InProcessEventBus();
    events.subscribe('market.data_refreshed', (event) => {
      published.push(event);
    });
    const clock = new FakeClock(new Date('2025-06-10T22:00:00Z'));
    api = createMarketApi({ prices, fxRates, priceSource, fxSource, events, clock });
  });

  it('first run backfills one year for every tracked symbol and the FX series', async () => {
    const result = await api.refresh('2025-06-10');
    assert.deepEqual(priceSource.calls, [{ from: '2024-06-10', to: '2025-06-10' }]);
    assert.deepEqual(fxSource.calls, [{ from: '2024-06-10', to: '2025-06-10' }]);
    const days = weekdays('2024-06-10', '2025-06-10').length;
    assert.deepEqual(result, { asOf: '2025-06-10', pricesStored: days * TRACKED_SYMBOL_NAMES.length, ratesStored: days, from: '2024-06-10', to: '2025-06-10' });
  });

  it('second run fetches only from the last stored date and stores only new facts', async () => {
    await api.refresh('2025-06-10');
    const second = await api.refresh('2025-06-12');
    assert.deepEqual(priceSource.calls[1], { from: '2025-06-10', to: '2025-06-12' });
    assert.deepEqual(fxSource.calls[1], { from: '2025-06-10', to: '2025-06-12' });
    assert.equal(second.pricesStored, 2 * TRACKED_SYMBOL_NAMES.length);
    assert.equal(second.ratesStored, 2);
    assert.equal(second.asOf, '2025-06-12');

    const rerun = await api.refresh('2025-06-12');
    assert.deepEqual({ prices: rerun.pricesStored, rates: rerun.ratesStored }, { prices: 0, rates: 0 });
  });

  it('publishes market.data_refreshed v1 once per successful refresh', async () => {
    await api.refresh('2025-06-10');
    assert.equal(published.length, 1);
    const [event] = published;
    assert.deepEqual({ type: event.type, version: event.version, payload: event.payload }, {
      type: 'market.data_refreshed',
      version: 1,
      payload: { asOf: '2025-06-10', symbols: [...TRACKED_SYMBOL_NAMES], fxBase: 'EUR' },
    });
    await api.refresh('2025-06-11');
    assert.equal(published.length, 2);
    assert.notEqual(published[0].id, published[1].id);
  });

  const failures: [string, () => void, string][] = [
    ['quota refusal', () => { priceSource.failWith = MarketErrors.providerQuotaSpent('marketstack'); }, 'MK_1902'],
    ['price provider failure', () => { priceSource.failWith = MarketErrors.providerUnavailable('marketstack', 'answered 500'); }, 'MK_1901'],
    ['FX provider failure', () => { fxSource.failWith = MarketErrors.providerUnavailable('frankfurter', 'answered 500'); }, 'MK_1901'],
  ];
  for (const [name, arrange, code] of failures) {
    it(`${name} → ${code}, nothing written, nothing published`, async () => {
      arrange();
      await assert.rejects(api.refresh('2025-06-10'), { code });
      assert.deepEqual(await prices.history(TRACKED_SYMBOL_NAMES, '2000-01-01', '2100-01-01'), []);
      assert.equal(await fxRates.latestDate(), null);
      assert.equal(published.length, 0);
    });
  }

  it('fetches FX before the metered price source, so an FX failure spends no price request', async () => {
    fxSource.failWith = MarketErrors.providerUnavailable('frankfurter', 'answered 500');
    await assert.rejects(api.refresh('2025-06-10'));
    assert.equal(priceSource.calls.length, 0);
  });

  it('backfills again when one tracked symbol has no stored price', async () => {
    await api.refresh('2025-06-10');
    const fresh = new MemoryPriceRepository();
    await fresh.append((await prices.history(['VT'], '2000-01-01', '2100-01-01')));
    const partial = createMarketApi({ prices: fresh, fxRates, priceSource, fxSource, events: new InProcessEventBus(), clock: new FakeClock(new Date()) });
    await partial.refresh('2025-06-12');
    assert.deepEqual(priceSource.calls[1], { from: '2024-06-12', to: '2025-06-12' });
  });
});

describe('market reads', () => {
  it('quotes the latest close per tracked symbol; rates cross through EUR for any base', async () => {
    const prices = new MemoryPriceRepository();
    const fxRates = new MemoryFxRateRepository();
    await prices.append([usdClose('VT', '2025-01-03', 11_800), usdClose('VT', '2025-01-06', 11_900), usdClose('VOO', '2025-01-06', 54_600)]);
    await fxRates.append([ecbRate('USD', '2025-01-03', 1.0299), ecbRate('GBP', '2025-01-03', 0.82993)]);
    const unused = { async fetchEndOfDay() { return []; }, async fetchRange() { return []; } };
    const api = createMarketApi({
      prices, fxRates, priceSource: unused, fxSource: unused, events: new InProcessEventBus(), clock: new FakeClock(new Date('2025-01-06T12:00:00Z')),
    });

    const quotes = await api.quotes();
    assert.equal(quotes.asOf, '2025-01-06');
    assert.deepEqual(quotes.quotes.map(({ price, assetClass }) => [price.symbol, assetClass, price.close.amount]), [
      ['VT', 'EQUITY_GLOBAL', 11_900],
      ['VOO', 'EQUITY_US', 54_600],
    ]);

    const usd = await api.rates('USD');
    assert.equal(usd.asOf, '2025-01-03');
    assert.deepEqual(usd.rates.map((rate) => [rate.quote, rate.rate, rate.date]), [
      // Exact decimal ratios, then one correctly rounded division: 1/1.0299 and 0.82993/1.0299.
      ['EUR', 10_000 / 10_299, '2025-01-03'],
      ['GBP', 82_993 / 102_990, '2025-01-03'],
    ]);
    assert.deepEqual(await api.rates('EUR', '2025-01-02'), { asOf: null, base: 'EUR', rates: [] });
  });
});
