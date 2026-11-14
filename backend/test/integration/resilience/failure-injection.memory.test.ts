import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createEnvelope } from '#core/events/event-envelope.ts';
import { DurableOutboxEventBus, createMemoryOutboxStore } from '#core/events/outbox-bus.ts';
import { HttpClientError } from '#core/http-client/http-client.ts';
import { formatPrometheusMetrics, resetMetrics } from '#core/telemetry/metrics.ts';
import { createAgentOrchestrator } from '../../../src/modules/advisory/domain/agent-orchestrator.ts';
import { factNumbers, shieldText } from '../../../src/modules/advisory/domain/calculation-shield.ts';
import { LlmGateway, summarizeProposal } from '../../../src/modules/advisory/domain/llm-gateway.ts';
import { createToolRegistry } from '../../../src/modules/advisory/domain/tool-registry.ts';
import { mapScoreToRiskTier } from '@wealth-advisor/rules';
import { createAnalyticsApi } from '../../../src/modules/analytics/analytics.api.ts';
import { MemoryMarketSnapshotRepository } from '../../../src/modules/analytics/infrastructure/db/memory/memory-market-snapshot.repository.ts';
import { createFinanceApi } from '../../../src/modules/finance/finance.api.ts';
import {
  MemoryAccountRepository,
  MemoryTransactionRepository,
} from '../../../src/modules/finance/infrastructure/db/memory/memory-finance.repository.ts';
import { MemoryFxRateRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-fx-rate.repository.ts';
import { MemoryPriceRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-price.repository.ts';
import { createMarketApi } from '../../../src/modules/market/market.api.ts';
import { unregisteredPasskeyVerifier } from '../../../src/modules/wealth/infrastructure/crypto/unregistered-passkey-verifier.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemoryRiskProfileRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
import { createProcessedEvents } from '#core/events/processed-events.ts';
import { postJson, startTestApp, type TestApp } from '../../support/test-app.ts';

describe('Failure injection integration suite', () => {
  let app: TestApp;

  before(async () => {
    resetMetrics();
    app = await startTestApp({ store: 'memory' });
  });

  after(async () => {
    await app.stop();
  });

  it('degrades gracefully to mock fallback with stale=true when external FX provider suffers an outage', async () => {
    const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
    const market = createMarketApi({
      prices: new MemoryPriceRepository(),
      fxRates: new MemoryFxRateRepository(),
      priceSource: { fetchEndOfDay: async () => [] },
      fxSource: {
        async fetchRange() {
          throw new HttpClientError('transient', 'Frankfurter upstream 503', 503);
        },
      },
      events: new DurableOutboxEventBus({ clock }),
      clock,
    });

    const finance = createFinanceApi({
      accounts: new MemoryAccountRepository(),
      transactions: new MemoryTransactionRepository(),
      clock,
      market,
    });

    const summary = await finance.getCashflowSummary('default', 'default', 'FAMILY_HOUSEHOLD');
    assert.equal(summary.stale, true);
    assert.ok(summary.staleReason && summary.staleReason.length > 0);
    assert.equal(summary.remittanceCorridors.length, 2);
  });

  it('falls back deterministically to mock model and records guardrail metric on live LLM timeout', async () => {
    resetMetrics();
    const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
    const bus = new DurableOutboxEventBus({ clock });
    const market = createMarketApi({
      prices: new MemoryPriceRepository(),
      fxRates: new MemoryFxRateRepository(),
      priceSource: { fetchEndOfDay: async () => [] },
      fxSource: { fetchRange: async () => [] },
      events: bus,
      clock,
    });
    const analytics = createAnalyticsApi({
      market: { history: async () => [] },
      snapshots: new MemoryMarketSnapshotRepository(),
      processed: createProcessedEvents('memory', async () => { throw new Error('unused'); }, clock),
      clock,
    });
    const finance = createFinanceApi({
      accounts: new MemoryAccountRepository(),
      transactions: new MemoryTransactionRepository(),
      clock,
      market,
      events: bus,
    });
    const wealth = createWealthApi({
      products: new MemoryAssetProductRepository(),
      portfolios: new MemoryPortfolioRepository(),
      profiles: new MemoryRiskProfileRepository(),
      ledger: new MemorySandboxLedgerRepository(),
      passkeys: unregisteredPasskeyVerifier,
      clock,
      analytics,
      finance,
    });

    const gateway = new LlmGateway({
      openrouterApiKey: 'fi-dummy-key',
      http: {
        getJson: async () => ({}),
        postJson: async () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('upstream LLM timeout')), 150);
          }),
      },
    });
    const tools = createToolRegistry({ finance, wealth, market, analytics });
    const orchestrator = createAgentOrchestrator({ tools, wealth, gateway });

    const baseline = await finance.getCashflowSummary('default', 'default', 'FAMILY_HOUSEHOLD');
    const portfolio = await wealth.getPortfolio('default', 'default');
    const proposal = await wealth.constructPortfolio('default', 'default', {
      riskTier: mapScoreToRiskTier(portfolio.effectiveRiskScore),
    });

    const result = await orchestrator.run({
      scope: { tenantId: 'default', userId: 'default' },
      provider: 'openrouter',
      input: {
        message: 'Check my runway after recent outflows.',
        locale: 'en',
        householdMode: 'FAMILY_HOUSEHOLD',
      },
      budget: { modelTimeoutMs: 20, fallbackOnModelError: true },
    });

    assert.equal(result.telemetry.usedDeterministicFallback, true);
    assert.ok(result.response.reply.includes(baseline.runwayMonths.toFixed(1)));
    const allowed = factNumbers(
      JSON.stringify({
        baseline,
        portfolio,
        holdingsCount: proposal.holdings.length,
        mix: summarizeProposal(proposal.holdings),
      }),
    );
    assert.equal(shieldText(result.response.reply, '__UNGROUNDED__', allowed), result.response.reply);
    assert.match(formatPrometheusMetrics(), /guardrail_triggers_total\{category="deterministic_fallback"\} 1/);
  });

  it('handles HTTP idempotency replays, conflicts, externalId dedup, and out-of-order transaction timestamps', async () => {
    const signup = await postJson(app.app, '/api/auth/signup', {
      email: 'fi-resilience@example.com',
      password: 'Password123!',
      displayName: 'Failure Injection User',
    });
    assert.equal(signup.status, 201);

    const login = await postJson(app.app, '/api/auth/login', {
      email: 'fi-resilience@example.com',
      password: 'Password123!',
    });
    assert.equal(login.status, 200);
    const { accessToken } = (await login.json()) as { accessToken: string };
    const headers = { authorization: `Bearer ${accessToken}` };

    const accountRes = await postJson(
      app.app,
      '/api/finance/accounts',
      {
        householdMode: 'FAMILY_HOUSEHOLD',
        institutionName: 'Resilience Vault Bank',
        accountType: 'CHECKING',
        currency: 'EUR',
        balance: 2_000_000,
        isPrimaryLiquidity: true,
      },
      headers,
    );
    assert.equal(accountRes.status, 201);
    const account = (await accountRes.json()) as { id: string };

    const txLaterPayload = {
      accountId: account.id,
      externalId: 'fi-tx-later',
      category: 'EXPENSE_DISCRETIONARY',
      amount: 120_000,
      currency: 'EUR',
      description: 'Out-of-order newer event',
      timestamp: '2026-10-10T10:00:00Z',
    };

    const firstRes = await postJson(app.app, '/api/finance/transactions', txLaterPayload, {
      ...headers,
      'Idempotency-Key': 'idem-fi-order-1',
    });
    assert.equal(firstRes.status, 201);
    const firstBody = (await firstRes.json()) as { transaction: { id: string }; deduplicated: boolean };
    assert.equal(firstBody.deduplicated, false);

    // Exact replay returns cached response with replay header
    const replayRes = await postJson(app.app, '/api/finance/transactions', txLaterPayload, {
      ...headers,
      'Idempotency-Key': 'idem-fi-order-1',
    });
    assert.equal(replayRes.status, 201);
    assert.equal(replayRes.headers.get('x-idempotent-replay'), 'true');
    const replayBody = (await replayRes.json()) as { transaction: { id: string } };
    assert.equal(replayBody.transaction.id, firstBody.transaction.id);

    // Mutated body reusing same Idempotency-Key returns 409 CORE_IDEMPOTENCY_CONFLICT
    const conflictRes = await postJson(
      app.app,
      '/api/finance/transactions',
      { ...txLaterPayload, amount: 150_000 },
      { ...headers, 'Idempotency-Key': 'idem-fi-order-1' },
    );
    assert.equal(conflictRes.status, 409);

    // Different Idempotency-Key with same externalId deduplicates cleanly
    const dedupRes = await postJson(app.app, '/api/finance/transactions', txLaterPayload, {
      ...headers,
      'Idempotency-Key': 'idem-fi-order-2',
    });
    assert.equal(dedupRes.status, 201);
    const dedupBody = (await dedupRes.json()) as { deduplicated: boolean };
    assert.equal(dedupBody.deduplicated, true);

    // Out-of-order earlier transaction arrives after newer transaction
    const earlierRes = await postJson(
      app.app,
      '/api/finance/transactions',
      {
        accountId: account.id,
        externalId: 'fi-tx-earlier',
        category: 'BILL_HOUSING',
        amount: 250_000,
        currency: 'EUR',
        description: 'Delayed settlement rent bill',
        timestamp: '2026-10-08T09:00:00Z',
      },
      { ...headers, 'Idempotency-Key': 'idem-fi-order-3' },
    );
    assert.equal(earlierRes.status, 201);

    const listRes = await app.app.request('/api/finance/transactions', { headers });
    assert.equal(listRes.status, 200);
    const listBody = (await listRes.json()) as { transactions: Array<{ externalId?: string }> };
    const extIds = listBody.transactions.map((t) => t.externalId);
    assert.deepEqual(extIds, ['fi-tx-later', 'fi-tx-earlier']);
  });

  it('quarantines poison outbox events into dead_letter_events after bounded retries', async () => {
    let nowMs = new Date('2026-10-06T12:00:00Z').getTime();
    const clock = { now: () => new Date(nowMs) };
    const bus = new DurableOutboxEventBus({
      store: createMemoryOutboxStore(),
      clock,
      maxAttempts: 2,
      retryBackoffMs: 500,
      autoDrain: false,
    });

    bus.subscribe('broker.poison', async () => {
      throw new Error('simulated downstream DB write failure');
    });

    await bus.publish(
      createEnvelope({
        type: 'broker.poison',
        version: 1,
        occurredAt: clock.now(),
        payload: { seq: 1 },
      }),
    );

    const pass1 = await bus.drainOnce();
    assert.deepEqual(pass1, { delivered: 0, retried: 1, deadLettered: 0 });
    nowMs += 500;
    const pass2 = await bus.drainOnce();
    assert.deepEqual(pass2, { delivered: 0, retried: 0, deadLettered: 1 });
    assert.deepEqual(await bus.stats(), { pending: 0, delivered: 0, deadLettered: 1 });
    assert.equal((await bus.deadLetters()).length, 1);
  });
});
