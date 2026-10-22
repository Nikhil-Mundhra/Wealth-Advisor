import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSharingApi } from '../../../src/modules/sharing/sharing.api.ts';
import { MemorySharedPlanRepository } from '../../../src/modules/sharing/infrastructure/db/memory/memory-sharing.repository.ts';
import { unregisteredPasskeyVerifier } from '../../../src/modules/wealth/infrastructure/crypto/unregistered-passkey-verifier.ts';
import {
  MemoryAssetProductRepository,
  MemoryPortfolioRepository,
  MemorySandboxLedgerRepository,
} from '../../../src/modules/wealth/infrastructure/db/memory/memory-wealth.repository.ts';
import { createWealthApi } from '../../../src/modules/wealth/wealth.api.ts';

function setup() {
  const plans = new MemorySharedPlanRepository();
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const wealth = createWealthApi({
    products: new MemoryAssetProductRepository(),
    portfolios: new MemoryPortfolioRepository(),
    ledger: new MemorySandboxLedgerRepository(),
    passkeys: unregisteredPasskeyVerifier,
    clock,
  });
  const api = createSharingApi({ plans, wealth, clock });
  return { api, wealth };
}

describe('SharingApi', () => {
  it('creates unguessable share link with TTL and privacy masking', async () => {
    const { api } = setup();
    const res = await api.createShareLink('default', 'default', {
      privacyMasked: true,
      ttlHours: 48,
    });

    assert.ok(res.shareToken.startsWith('dewa_sec_'));
    // 16 random bytes base64url-encode to 22 characters; 6 bytes gave only 48 bits.
    assert.ok(res.shareToken.length >= 'dewa_sec_'.length + 22);
    assert.equal(res.url, `/share/${res.shareToken}`);

    const retrieved = await api.getSharedPlan(res.shareToken);
    assert.equal(retrieved.shareToken, res.shareToken);
    assert.equal(retrieved.privacyMasked, true);
    assert.ok(retrieved.planSnapshot.threePillarRationale);
  });

  it('resolves seeded demo share link', async () => {
    const { api } = setup();
    const res = await api.getSharedPlan('dewa_sec_789f');
    assert.equal(res.shareToken, 'dewa_sec_789f');
    assert.equal(res.ownerDisplayName, 'Elena');
  });

  it('rejects nonexistent share token', async () => {
    const { api } = setup();
    await assert.rejects(() => api.getSharedPlan('nonexistent_token'), /shared plan nonexistent_token not found/);
  });

  it("snapshots the caller's own rebalance proposal, with no stress scenario until an engine exists", async () => {
    const { api, wealth } = setup();
    const proposal = await wealth.optimizePortfolio('default', 'default');
    const res = await api.createShareLink('default', 'default', { privacyMasked: false, ttlHours: 24, ownerDisplayName: 'Mina' });

    const plan = await api.getSharedPlan(res.shareToken);
    assert.equal(plan.ownerDisplayName, 'Mina');
    assert.deepEqual(plan.planSnapshot.currentWeights, proposal.currentWeights);
    assert.deepEqual(plan.planSnapshot.recommendedWeights, proposal.targetWeights);
    assert.deepEqual(plan.planSnapshot.threePillarRationale, proposal.rationale);
    assert.equal(plan.planSnapshot.stressTestScenario, null);
  });

  it('redacts holdings and currency amounts when privacyMasked is true', async () => {
    const { api, wealth } = setup();
    const proposal = await wealth.optimizePortfolio('default', 'default');
    const res = await api.createShareLink('default', 'default', { privacyMasked: true, ttlHours: 24, ownerDisplayName: 'Mina' });

    const plan = await api.getSharedPlan(res.shareToken);
    assert.equal(plan.ownerDisplayName, 'Mina');
    assert.equal(plan.privacyMasked, true);
    const keys = Object.keys(plan.planSnapshot.currentWeights);
    assert.ok(keys.length > 0);
    assert.ok(keys.every((k) => k.startsWith('Holding ')));
    assert.ok(!keys.some((k) => Object.keys(proposal.currentWeights).includes(k)));
    assert.ok(!plan.planSnapshot.threePillarRationale.personalFinance.match(/€\d+/));
    // The rationale names the rebalanced ticker, so masking the weight map alone would leak it.
    const rationale = plan.planSnapshot.threePillarRationale.wealthStrategy;
    for (const symbol of Object.keys(proposal.currentWeights)) {
      assert.ok(!rationale.includes(symbol), `${symbol} leaked through the rationale`);
    }
    assert.match(rationale, /Holding \d+/);
  });

  it('refuses to share for a caller with no portfolio', async () => {
    const { api } = setup();
    await assert.rejects(
      () => api.createShareLink('6000000000000000000000bb', '6000000000000000000000aa', { privacyMasked: true, ttlHours: 24 }),
      (error: { code?: string }) => error.code === 'WL_1001',
    );
  });
});
