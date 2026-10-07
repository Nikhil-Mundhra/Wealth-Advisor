import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Currency } from '@wealth-advisor/rules';
import { InProcessEventBus } from '#core/events/event-bus.ts';
import { createFinanceApi } from '../../../src/modules/finance/finance.api.ts';
import { calculateBurnRate } from '../../../src/modules/finance/domain/burn-rate-calculator.ts';
import {
  MemoryAccountRepository,
  MemoryTransactionRepository,
} from '../../../src/modules/finance/infrastructure/db/memory/memory-finance.repository.ts';
import { MemoryFxRateRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-fx-rate.repository.ts';
import { MemoryPriceRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-price.repository.ts';
import { createMarketApi } from '../../../src/modules/market/market.api.ts';
import { ecbRate } from '../../support/market-fixtures.ts';

const NOW = new Date('2026-10-06T12:00:00Z');

// A market whose rates are seeded but whose providers refuse every call: the tests value balances, they do not refresh.
const EUR_RATES: Readonly<Record<string, number>> = { GBP: 0.85, SGD: 1.45 };

function seededMarket(quotes: readonly Currency[] = ['GBP', 'SGD']) {
  const fxRates = new MemoryFxRateRepository();
  const clock = { now: () => NOW };
  const refuse = {
    async fetchRange(): Promise<never> {
      throw new Error('no provider in a unit test');
    },
    async fetchEndOfDay(): Promise<never> {
      throw new Error('no provider in a unit test');
    },
  };
  const api = createMarketApi({
    prices: new MemoryPriceRepository(),
    fxRates,
    priceSource: refuse,
    fxSource: refuse,
    events: new InProcessEventBus(),
    clock,
  });
  return {
    api,
    async seed() {
      // Rates dated on and before the clock's day, so a spot lookup on that day finds them.
      await fxRates.append(quotes.map((quote) => ecbRate(quote, '2026-10-05', EUR_RATES[quote] ?? 1)));
    },
  };
}

function setup(withMarket = true) {
  const accounts = new MemoryAccountRepository();
  const transactions = new MemoryTransactionRepository();
  const clock = { now: () => NOW };
  const market = withMarket ? seededMarket() : null;
  return { accounts, transactions, clock, market, api: null as unknown };
}

describe('FinanceApi', () => {
  it('loads seeded accounts across EUR, GBP, and SGD', async () => {
    const { accounts, transactions, clock } = setup();
    const api = createFinanceApi({ accounts, transactions, clock });
    const res = await api.getAccounts('default', 'default');
    assert.equal(res.accounts.length, 3);
    const currencies = res.accounts.map((a) => a.currency);
    assert.ok(currencies.includes('EUR'));
    assert.ok(currencies.includes('GBP'));
    assert.ok(currencies.includes('SGD'));
  });

  it('values every account in the base currency so the list and the summary agree', async () => {
    const { accounts, transactions, clock, market } = setup();
    if (!market) throw new Error('market required');
    await market.seed();
    const api = createFinanceApi({ accounts, transactions, clock, market: market.api });

    const list = await api.getAccounts('default', 'default');
    assert.ok(
      list.accounts.every((a) => a.baseBalance !== null),
      'every seeded account should carry a base balance',
    );
    // A base-currency account values itself; a foreign one is converted, never copied through.
    const eur = list.accounts.find((a) => a.currency === 'EUR');
    const gbp = list.accounts.find((a) => a.currency === 'GBP');
    assert.equal(eur?.baseBalance, eur?.balance);
    // The seeded rate is EUR→GBP, so GBP→EUR crosses back: 600,000p / 0.85 = 705,882 cents.
    assert.equal(gbp?.baseBalance, 705882);

    const summary = await api.getCashflowSummary('default', 'default', 'FAMILY_HOUSEHOLD');
    assert.equal(summary.unvaluedAccountCount, 0);
    const valued = list.accounts.reduce((sum, a) => sum + (a.baseBalance ?? 0), 0);
    assert.equal(summary.totalLiquidReservesBase, valued);
  });

  it('leaves an account unvalued and reports it when no rate is available', async () => {
    const { accounts, transactions, clock } = setup(false);
    const api = createFinanceApi({ accounts, transactions, clock });
    const list = await api.getAccounts('default', 'default');
    const gbp = list.accounts.find((a) => a.currency === 'GBP');
    assert.equal(gbp?.baseBalance, null, 'a GBP balance must not be presented as EUR minor units');

    const summary = await api.getCashflowSummary('default', 'default', 'FAMILY_HOUSEHOLD');
    assert.equal(summary.unvaluedAccountCount, 2);
    assert.equal(summary.totalLiquidReservesBase, 1500000, 'only the EUR account is counted');
  });

  it('computes burn rate and runway adapting to household mode', async () => {
    const { accounts, transactions, clock, market } = setup();
    if (!market) throw new Error('market required');
    await market.seed();
    const api = createFinanceApi({ accounts, transactions, clock, market: market.api });

    const family = await api.getCashflowSummary('default', 'default', 'FAMILY_HOUSEHOLD');
    assert.equal(family.householdMode, 'FAMILY_HOUSEHOLD');
    assert.equal(family.reserveMultiplier, 2.0);
    assert.ok(family.runwayMonths > 0);
    assert.equal(family.remittanceCorridors.length, 2);

    const individual = await api.getCashflowSummary('default', 'default', 'INDIVIDUAL');
    assert.equal(individual.householdMode, 'INDIVIDUAL');
    assert.equal(individual.reserveMultiplier, 1.0);
    // Individual runway is longer than family runway because reserve requirement is lower
    assert.ok(individual.runwayMonths >= family.runwayMonths);
  });
});

describe('calculateBurnRate', () => {
  const transaction = (category: string, amount: number, timestamp: string) =>
    ({ category, convertedBaseAmount: amount, timestamp: new Date(timestamp) }) as unknown as Parameters<
      typeof calculateBurnRate
    >[0]['transactions'][number];

  const base = { householdMode: 'INDIVIDUAL' as const, totalLiquidReservesBase: 0 };

  it('averages over the calendar months present, not the elapsed span', () => {
    // Two months of outflow, €300 each: one month of spending is €300, not €600 over the 60 days in between.
    const result = calculateBurnRate({
      ...base,
      transactions: [
        transaction('HOUSING_RENT', 100000, '2026-08-01T10:00:00Z'),
        transaction('DINING', 100000, '2026-08-20T10:00:00Z'),
        transaction('HOUSING_RENT', 100000, '2026-09-01T10:00:00Z'),
        transaction('DINING', 100000, '2026-09-20T10:00:00Z'),
      ],
    });
    assert.equal(result.monthlyOutflowBase, 200000);
  });

  it('treats a single busy week as a month, not as a fraction of one', () => {
    const result = calculateBurnRate({
      ...base,
      transactions: [
        transaction('HOUSING_RENT', 100000, '2026-08-01T10:00:00Z'),
        transaction('HOUSING_RENT', 100000, '2026-08-02T10:00:00Z'),
        transaction('HOUSING_RENT', 100000, '2026-08-03T10:00:00Z'),
      ],
    });
    assert.equal(result.monthlyOutflowBase, 300000);
  });

  it('separates inflow from outflow by category and averages each side independently', () => {
    const result = calculateBurnRate({
      ...base,
      transactions: [
        transaction('INCOME_SALARY', 500000, '2026-08-01T10:00:00Z'),
        transaction('DINING', 50000, '2026-08-02T10:00:00Z'),
        transaction('INCOME_SALARY', 700000, '2026-09-01T10:00:00Z'),
        transaction('DINING', 70000, '2026-09-02T10:00:00Z'),
      ],
    });
    assert.equal(result.monthlyInflowBase, 600000);
    assert.equal(result.monthlyOutflowBase, 60000);
    assert.equal(result.netCashflowBase, 540000);
  });

  it('falls back to household defaults when nothing is logged', () => {
    assert.equal(calculateBurnRate({ ...base, transactions: [] }).monthlyOutflowBase, 250000);
    assert.equal(
      calculateBurnRate({ ...base, householdMode: 'FAMILY_HOUSEHOLD', transactions: [] }).monthlyOutflowBase,
      540000,
    );
  });

  it('measures runway against the reserves it is given', () => {
    const result = calculateBurnRate({
      householdMode: 'INDIVIDUAL',
      totalLiquidReservesBase: 1200000,
      transactions: [transaction('HOUSING_RENT', 240000, '2026-08-01T10:00:00Z')],
    });
    // monthlyNeed = 240000 * 1.0 / 2 = 120000 → 1200000 / 120000
    assert.equal(result.runwayMonths, 10);
  });
});