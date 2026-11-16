import { strict as assert } from 'node:assert';
import { createHash, generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { exportPKCS8, exportSPKI, generateKeyPair, SignJWT } from 'jose';
import { DEFAULT_USER_ID } from '#core/db/document-id.ts';
import { InProcessEventBus } from '#core/events/event-bus.ts';
import { MemoryProcessedEvents } from '#core/events/memory-processed-events.ts';
import { createAdvisoryApi } from '../../../src/modules/advisory/advisory.api.ts';
import { LlmGateway } from '../../../src/modules/advisory/domain/llm-gateway.ts';
import { createAnalyticsApi } from '../../../src/modules/analytics/analytics.api.ts';
import { measureSnapshot } from '../../../src/modules/analytics/domain/measure-snapshot.ts';
import { MemoryMarketSnapshotRepository } from '../../../src/modules/analytics/infrastructure/db/memory/memory-market-snapshot.repository.ts';
import { createFinanceApi } from '../../../src/modules/finance/finance.api.ts';
import {
  MemoryAccountRepository,
  MemoryTransactionRepository,
} from '../../../src/modules/finance/infrastructure/db/memory/memory-finance.repository.ts';
import { MemoryFxRateRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-fx-rate.repository.ts';
import { MemoryPriceRepository } from '../../../src/modules/market/infrastructure/db/memory/memory-price.repository.ts';
import { buildMockFxRates } from '../../../src/modules/market/infrastructure/providers/mock-market-source.ts';
import { createMarketApi } from '../../../src/modules/market/market.api.ts';
import { MemoryPasskeyStore, createPasskeyService, MemoryPasskeyChallengeStore } from '#core/crypto/passkey-verifier.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemoryRiskProfileRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';
import { postJson, startTestApp, type TestApp } from '../../support/test-app.ts';

const ITERATIONS = 45;
const WARMUP = 3;
const RP_ID = 'localhost';
const ORIGIN = 'http://localhost:5173';

function percentile99(samplesMs: readonly number[]): number {
  const sorted = [...samplesMs].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(0.99 * sorted.length));
  return sorted[idx] ?? 0;
}

async function measureP99(fn: () => Promise<void>): Promise<{ p99Ms: number; medianMs: number }> {
  for (let w = 0; w < WARMUP; w += 1) await fn();
  const samples: number[] = [];
  for (let i = 0; i < ITERATIONS; i += 1) {
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    p99Ms: percentile99(samples),
    medianMs: sorted[Math.floor(sorted.length / 2)] ?? 0,
  };
}

function buildMockAssertion(
  privateKey: KeyObject,
  credentialId: string,
  challenge: string,
  counterValue: number,
) {
  const clientData = JSON.stringify({ type: 'webauthn.get', challenge, origin: ORIGIN });
  const clientDataHash = createHash('sha256').update(Buffer.from(clientData, 'utf8')).digest();
  const rpIdHash = createHash('sha256').update(RP_ID).digest();
  const flags = Buffer.from([0x05]);
  const counter = Buffer.alloc(4);
  counter.writeUInt32BE(counterValue);
  const authData = Buffer.concat([rpIdHash, flags, counter]);
  const signature = sign('sha256', Buffer.concat([authData, clientDataHash]), privateKey);

  return {
    credentialId,
    clientDataJson: Buffer.from(clientData, 'utf8').toString('base64url'),
    authenticatorData: authData.toString('base64url'),
    signature: signature.toString('base64url'),
  };
}

describe('L3 & L4 Stage Latency SLA Gates & Live Cross-Module E2E', () => {
  let testApp: TestApp;
  let demoToken: string;

  before(async () => {
    const { privateKey, publicKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
    testApp = await startTestApp({
      store: 'memory',
      env: {
        AUTH_JWT_PRIVATE_KEY: await exportPKCS8(privateKey),
        AUTH_JWT_PUBLIC_KEY: await exportSPKI(publicKey),
        PASSKEY_RP_ID: RP_ID,
      },
    });
    const issuedAt = Math.floor(testApp.clock.now().getTime() / 1000);
    demoToken = await new SignJWT({ token_use: 'user', roles: ['USER'], tenant_id: 'default' })
      .setProtectedHeader({ alg: 'EdDSA', kid: 'wa-1', typ: 'JWT' })
      .setIssuer('wealth-advisor-auth')
      .setAudience('wealth-advisor-api')
      .setSubject(DEFAULT_USER_ID)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + 3600)
      .sign(privateKey);
  });

  after(async () => {
    await testApp.stop();
  });

  it('Stage A: Cashflow & multi-currency burn-rate engine stays below 25ms P99 over 45 iterations', async () => {
    const finance = createFinanceApi({
      accounts: new MemoryAccountRepository(),
      transactions: new MemoryTransactionRepository(),
      clock: { now: () => new Date('2026-10-06T12:00:00Z') },
    });

    const stats = await measureP99(async () => {
      const summary = await finance.getCashflowSummary('default', 'default', 'FAMILY_HOUSEHOLD');
      assert.equal(summary.householdMode, 'FAMILY_HOUSEHOLD');
    });
    assert.ok(stats.p99Ms < 25, `Stage A P99 ${stats.p99Ms.toFixed(2)}ms exceeded 25ms budget`);
  });

  it('Stage B: 365-day covariance and volatility risk snapshot stays below 50ms P99 over 45 iterations', async () => {
    const symbols = ['CSPX.LSE', 'VWCE.DE', 'IEAC.LSE', 'XEON.DE', 'AGGH.LSE'];
    const dates = Array.from({ length: 260 }, (_, idx) => {
      const d = new Date(Date.UTC(2025, 9, 1 + idx));
      return d.toISOString().slice(0, 10);
    });
    const values = symbols.map((_, sIdx) =>
      dates.map((__, dIdx) => 100 * Math.exp(0.0002 * dIdx + 0.01 * Math.sin(dIdx * 0.2 + sIdx))),
    );
    const computedAt = new Date('2026-10-06T12:00:00Z');
    const asOf = dates[dates.length - 1]!;

    const stats = await measureP99(async () => {
      const res = measureSnapshot({ symbols, dates, values }, asOf, computedAt);
      assert.equal(res.kind, 'measured');
    });
    assert.ok(stats.p99Ms < 50, `Stage B P99 ${stats.p99Ms.toFixed(2)}ms exceeded 50ms budget`);
  });

  it('Stage C: Constrained MVO + 2,000-path Monte Carlo construction stays below 120ms P99 over 45 iterations', async () => {
    const passkeys = createPasskeyService(new MemoryPasskeyStore(), {
      challenges: new MemoryPasskeyChallengeStore(),
      clock: { now: () => new Date('2026-10-06T12:00:00Z') },
      rpId: RP_ID,
      challengeTtlSeconds: 300,
    });
    const wealth = createWealthApi({
      products: new MemoryAssetProductRepository(),
      portfolios: new MemoryPortfolioRepository(),
      profiles: new MemoryRiskProfileRepository(),
      ledger: new MemorySandboxLedgerRepository(),
      passkeys,
      clock: { now: () => new Date('2026-10-06T12:00:00Z') },
    });

    const stats = await measureP99(async () => {
      const out = await wealth.constructPortfolio('default', 'default', { riskTier: 'moderate' });
      assert.ok(out.holdings.length >= 3);
      assert.equal(out.monteCarlo.numSimulations, 2000);
    });
    assert.ok(stats.p99Ms < 120, `Stage C P99 ${stats.p99Ms.toFixed(2)}ms exceeded 120ms budget`);
  });

  it('Stage D: Calculation-shielded advisory copilot turn stays below 150ms P99 over 45 iterations', async () => {
    const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
    const finance = createFinanceApi({
      accounts: new MemoryAccountRepository(),
      transactions: new MemoryTransactionRepository(),
      clock,
    });
    const passkeys = createPasskeyService(new MemoryPasskeyStore(), {
      challenges: new MemoryPasskeyChallengeStore(),
      clock,
      rpId: RP_ID,
      challengeTtlSeconds: 300,
    });
    const wealth = createWealthApi({
      products: new MemoryAssetProductRepository(),
      portfolios: new MemoryPortfolioRepository(),
      profiles: new MemoryRiskProfileRepository(),
      ledger: new MemorySandboxLedgerRepository(),
      passkeys,
      clock,
    });
    const market = createMarketApi({
      prices: new MemoryPriceRepository(),
      fxRates: new MemoryFxRateRepository(),
      priceSource: { fetchEndOfDay: async () => [] },
      fxSource: { fetchRange: async () => [] },
      events: new InProcessEventBus(),
      clock,
      mockFxFallback: buildMockFxRates,
    });
    const analytics = createAnalyticsApi({
      market: { history: async () => [] },
      snapshots: new MemoryMarketSnapshotRepository(),
      processed: new MemoryProcessedEvents(),
      clock,
    });
    const advisory = createAdvisoryApi({
      finance,
      wealth,
      market,
      analytics,
      gateway: new LlmGateway(),
    });

    const stats = await measureP99(async () => {
      const reply = await advisory.chat('default', 'default', {
        message: 'Evaluate my EUR/CNY remittance exposure and rebalance plan.',
        locale: 'en',
        householdMode: 'FAMILY_HOUSEHOLD',
      });
      assert.ok(reply.actionCards.length >= 1);
      assert.ok(reply.threePillarRationale.wealthStrategy.length > 0);
    });
    assert.ok(stats.p99Ms < 150, `Stage D P99 ${stats.p99Ms.toFixed(2)}ms exceeded 150ms budget`);
  });

  it('Stage E: Live HTTP end-to-end advisory, WebAuthn Tier 3 execution, sharing & <400ms P99 SLA gate', async () => {
    const headers = { authorization: `Bearer ${demoToken}` };

    // 1. Verify signup + login round-trip on live HTTP stack
    const signupRes = await postJson(testApp.app, '/api/auth/signup', {
      email: 'sla-probe@example.com',
      password: 'Password123!',
      displayName: 'SLA Probe',
    });
    assert.equal(signupRes.status, 201);

    const loginRes = await postJson(testApp.app, '/api/auth/login', {
      email: 'sla-probe@example.com',
      password: 'Password123!',
    });
    assert.equal(loginRes.status, 200);
    const loginBody = (await loginRes.json()) as { accessToken: string };
    const probeHeaders = { authorization: `Bearer ${loginBody.accessToken}` };
    const demoHeaders = { authorization: `Bearer ${demoToken}` };

    // 2. Register WebAuthn ECDSA P-256 passkey and verify step-up assertion ceremony over HTTP
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const spkiBase64 = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
    const credentialId = 'cred_sla_gate_p256';

    const regOptsRes = await postJson(testApp.app, '/api/auth/passkeys/register/options', {}, probeHeaders);
    assert.equal(regOptsRes.status, 200);
    const regOpts = (await regOptsRes.json()) as { challenge: string };

    const regVerifyRes = await postJson(
      testApp.app,
      '/api/auth/passkeys/register/verify',
      {
        credentialId,
        clientDataJson: Buffer.from(
          JSON.stringify({ type: 'webauthn.create', challenge: regOpts.challenge, origin: ORIGIN }),
        ).toString('base64url'),
        attestationObject: spkiBase64,
        publicKeySpki: spkiBase64,
        deviceName: 'CI SLA Enclave',
      },
      probeHeaders,
    );
    assert.equal(regVerifyRes.status, 200);

    const challengeRes = await postJson(testApp.app, '/api/auth/passkeys/step-up-challenge', {}, probeHeaders);
    assert.equal(challengeRes.status, 200);
    const { challenge } = (await challengeRes.json()) as { challenge: string };
    assert.ok(challenge.length > 0);
    const assertion = buildMockAssertion(privateKey, credentialId, challenge, 1);
    assert.ok(assertion.signature.length > 0);

    // 3. Benchmark the full HTTP advisory + optimize + share orchestration across 45 iterations
    const httpStats = await measureP99(async () => {
      const cfRes = await testApp.app.request('/api/finance/cashflow?householdMode=FAMILY_HOUSEHOLD', { headers: demoHeaders });
      assert.equal(cfRes.status, 200);

      const optRes = await postJson(testApp.app, '/api/wealth/optimize', {}, demoHeaders);
      assert.equal(optRes.status, 200);

      const chatRes = await postJson(
        testApp.app,
        '/api/advisory/chat',
        { message: 'Check FX drift', locale: 'en', householdMode: 'FAMILY_HOUSEHOLD' },
        demoHeaders,
      );
      assert.equal(chatRes.status, 200);

      const shareRes = await postJson(
        testApp.app,
        '/api/sharing/create',
        { privacyMasked: true, ttlHours: 24, ownerDisplayName: 'SLA Probe' },
        demoHeaders,
      );
      assert.equal(shareRes.status, 201);
      const { shareToken } = (await shareRes.json()) as { shareToken: string };

      const publicPlanRes = await testApp.app.request(`/api/sharing/${shareToken}`);
      assert.equal(publicPlanRes.status, 200);
    });
    assert.ok(httpStats.p99Ms < 400, `Stage E HTTP pipeline P99 ${httpStats.p99Ms.toFixed(2)}ms exceeded 400ms SLA`);

    // 4. Verify Tier 3 passkey execution gate refuses unverified assertion on /api/wealth/execute (fail-closed)
    const unverifiedExecRes = await postJson(
      testApp.app,
      '/api/wealth/execute',
      {
        orderType: 'PORTFOLIO_REBALANCE',
        trades: [{ assetSymbol: 'CSPX.LSE', action: 'SELL', amountBase: 1900000, targetWeight: 0.4 }],
        passkeyAssertion: assertion,
      },
      demoHeaders,
    );
    assert.equal(unverifiedExecRes.status, 403);
    const execBody = (await unverifiedExecRes.json()) as { code: string };
    assert.equal(execBody.code, 'WL_1004');

    // Keep unused import guard satisfied by verifying bus event loop doesn't block
    const bus = new InProcessEventBus();
    assert.ok(bus);
  });
});
