import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSharingApi } from '../../../src/modules/sharing/sharing.api.ts';
import { MemorySharedPlanRepository } from '../../../src/modules/sharing/infrastructure/db/memory/memory-sharing.repository.ts';

function setup() {
  const plans = new MemorySharedPlanRepository();
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const api = createSharingApi({ plans, clock });
  return { api };
}

describe('SharingApi', () => {
  it('creates unguessable share link with TTL and privacy masking', async () => {
    const { api } = setup();
    const res = await api.createShareLink('default', 'default', {
      privacyMasked: true,
      ttlHours: 48,
    });

    assert.ok(res.shareToken.startsWith('dewa_sec_'));
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
});
