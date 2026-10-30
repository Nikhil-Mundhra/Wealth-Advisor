import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemoryProcessedEvents } from '../../../src/core/events/memory-processed-events.ts';
import { createAnalyticsApi } from '../../../src/modules/analytics/analytics.api.ts';
import { MarketSnapshot } from '../../../src/modules/analytics/domain/market-snapshot.vo.ts';
import { MemoryMarketSnapshotRepository } from '../../../src/modules/analytics/infrastructure/db/memory/memory-market-snapshot.repository.ts';
import {
  ADVISORY_TOOL_NAMES,
  ADVISORY_TOOL_TIERS,
  canInvoke,
  createToolRegistry,
} from '../../../src/modules/advisory/domain/tool-registry.ts';
import { createFinanceApi } from '../../../src/modules/finance/finance.api.ts';
import {
  MemoryAccountRepository,
  MemoryTransactionRepository,
} from '../../../src/modules/finance/infrastructure/db/memory/memory-finance.repository.ts';
import { FxRate } from '../../../src/modules/market/domain/fx-rate.vo.ts';
import { MemoryFxRateRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-fx-rate.repository.ts';
import { MemoryPriceRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-price.repository.ts';
import { createMarketApi } from '../../../src/modules/market/market.api.ts';
import { InProcessEventBus } from '../../../src/core/events/event-bus.ts';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';
import { unregisteredPasskeyVerifier } from '../../../src/modules/wealth/infrastructure/crypto/unregistered-passkey-verifier.ts';

const TENANT = 'default';
const USER = 'default';

async function setup() {
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const finance = createFinanceApi({
    accounts: new MemoryAccountRepository(),
    transactions: new MemoryTransactionRepository(),
    clock,
  });
  const wealth = createWealthApi({
    products: new MemoryAssetProductRepository(),
    portfolios: new MemoryPortfolioRepository(),
    ledger: new MemorySandboxLedgerRepository(),
    passkeys: unregisteredPasskeyVerifier,
    clock,
  });
  const fxRates = new MemoryFxRateRepository();
  await fxRates.append([
    FxRate.of({ base: 'GBP', quote: 'EUR', date: '2026-10-06', rate: 1.17, source: 'test' }),
    FxRate.of({ base: 'SGD', quote: 'EUR', date: '2026-10-06', rate: 0.68, source: 'test' }),
  ]);
  const market = createMarketApi({
    prices: new MemoryPriceRepository(),
    fxRates,
    priceSource: { fetchEndOfDay: async () => [] },
    fxSource: { fetchRange: async () => [] },
    events: new InProcessEventBus(),
    clock,
  });
  const snapshots = new MemoryMarketSnapshotRepository();
  await snapshots.upsert(
    MarketSnapshot.of({
      asOf: '2026-10-06',
      symbols: ['CSPX.LSE', 'IEAC.LSE'],
      means: [0.08, 0.03],
      volatilities: [0.2, 0.03],
      covariance: [
        [0.04, 0.002],
        [0.002, 0.0009],
      ],
      window: { from: '2025-10-06', to: '2026-10-06', observations: 250 },
      computedAt: new Date('2026-10-06T12:00:00Z'),
    }),
  );
  const analytics = createAnalyticsApi({
    market: { history: async () => [] },
    snapshots,
    processed: new MemoryProcessedEvents(),
    clock,
  });
  const tools = createToolRegistry({ finance, wealth, market, analytics });
  return { finance, wealth, tools };
}

describe('ToolRegistry', () => {
  it('exposes one tier-tagged tool per engine row', () => {
    assert.deepEqual([...ADVISORY_TOOL_NAMES], [
      'get_cashflow_and_runway',
      'get_currency_exposure',
      'calculate_adaptive_portfolio',
      'simulate_stress_test',
      'create_rebalance_proposal',
      'execute_sandbox_trade',
    ]);
    assert.deepEqual(ADVISORY_TOOL_TIERS, {
      get_cashflow_and_runway: 'TIER_1_ADVISORY',
      get_currency_exposure: 'TIER_0_READ',
      calculate_adaptive_portfolio: 'TIER_1_ADVISORY',
      simulate_stress_test: 'TIER_2_SIMULATE',
      create_rebalance_proposal: 'TIER_2_SIMULATE',
      execute_sandbox_trade: 'TIER_3_EXECUTE',
    });
  });

  it('resolves cashflow and runway from stored data as structured fields', async () => {
    const { finance, tools } = await setup();
    const scope = { tenantId: TENANT, userId: USER };
    const viaTool = await tools.dispatch('get_cashflow_and_runway', scope, { householdMode: 'FAMILY_HOUSEHOLD' }, 'TIER_1_ADVISORY');
    const direct = await finance.getCashflowSummary(TENANT, USER, 'FAMILY_HOUSEHOLD');
    assert.deepEqual(viaTool, direct);
    assert.equal(typeof viaTool.runwayMonths, 'number');
  });

  it('converts every stored balance through the market rates', async () => {
    const { tools } = await setup();
    const res = await tools.dispatch('get_currency_exposure', { tenantId: TENANT, userId: USER }, { targetCurrency: 'EUR' }, 'TIER_0_READ');
    assert.equal(res.targetCurrency, 'EUR');
    assert.equal(res.unvaluedCount, 0);
    const byCurrency = new Map(res.exposures.map((e) => [e.currency, e]));
    // Same-currency balances convert at rate 1 with no rate day; seeded rates value the rest.
    assert.equal(byCurrency.get('EUR')?.convertedBalance, byCurrency.get('EUR')?.balance);
    assert.equal(byCurrency.get('GBP')?.convertedBalance, Math.round(600000 * 1.17));
    assert.equal(byCurrency.get('SGD')?.convertedBalance, Math.round(500000 * 0.68));
  });

  it('constructs the adaptive portfolio from the stored risk score', async () => {
    const { tools } = await setup();
    const res = await tools.dispatch('calculate_adaptive_portfolio', { tenantId: TENANT, userId: USER }, {}, 'TIER_1_ADVISORY');
    assert.ok(res.holdings.length > 0);
    const total = res.holdings.reduce((sum, h) => sum + h.weight, 0);
    assert.ok(Math.abs(total - 1) < 0.01, `weights sum to ${total}`);
  });

  it('simulates stress scenarios against the measured snapshot', async () => {
    const { tools } = await setup();
    const res = await tools.dispatch('simulate_stress_test', { tenantId: TENANT, userId: USER }, {}, 'TIER_2_SIMULATE');
    assert.equal(res.asOf, '2026-10-06');
    assert.deepEqual([...res.symbols], ['CSPX.LSE', 'IEAC.LSE']);
    assert.equal(res.scenarios.length, 4);
    assert.ok(res.scenarios.some((s) => s.scenarioName.includes('Equity Market Correction')));
    assert.equal(typeof res.portfolioVolatility, 'number');
  });

  it('proposes a rebalance from stored drift', async () => {
    const { tools } = await setup();
    const res = await tools.dispatch('create_rebalance_proposal', { tenantId: TENANT, userId: USER }, {}, 'TIER_2_SIMULATE');
    assert.ok(Array.isArray(res.actions));
    assert.equal(typeof res.effectiveRiskScore, 'number');
  });

  it('refuses tools above the granted tier', async () => {
    const { tools } = await setup();
    const scope = { tenantId: TENANT, userId: USER };
    assert.equal(canInvoke('simulate_stress_test', 'TIER_1_ADVISORY'), false);
    assert.equal(canInvoke('get_currency_exposure', 'TIER_0_READ'), true);
    await assert.rejects(
      () => tools.dispatch('simulate_stress_test', scope, {}, 'TIER_1_ADVISORY'),
      (err: any) => err.code === 'AV_1003',
    );
    await assert.rejects(
      () => tools.dispatch('execute_sandbox_trade', scope, { trades: [], passkeyAssertion: {} }, 'TIER_2_SIMULATE'),
      (err: any) => err.code === 'AV_1003',
    );
    await assert.rejects(
      () => tools.dispatch('get_cashflow_and_runway', scope, {}, 'TIER_0_READ'),
      (err: any) => err.code === 'AV_1003',
    );
  });

  it('refuses unknown tools', async () => {
    const { tools } = await setup();
    await assert.rejects(
      () => (tools as any).dispatch('rebalance_everything', { tenantId: TENANT, userId: USER }, {}, 'TIER_3_EXECUTE'),
      (err: any) => err.code === 'AV_1002',
    );
  });

  it('routes sandbox execution through the wealth ledger behind passkey verification', async () => {
    const { tools } = await setup();
    await assert.rejects(
      () =>
        tools.dispatch(
          'execute_sandbox_trade',
          { tenantId: TENANT, userId: USER },
          {
            orderType: 'PORTFOLIO_REBALANCE',
            trades: [],
            passkeyAssertion: {
              credentialId: 'cred',
              clientDataJson: 'client',
              authenticatorData: 'auth',
              signature: 'sig',
            },
          },
          'TIER_3_EXECUTE',
        ),
      (err: any) => err.code === 'WL_1004',
    );
  });
});
