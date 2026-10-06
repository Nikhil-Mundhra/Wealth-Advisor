import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAdminApi } from '../../../src/modules/admin/admin.api.ts';
import {
  MemoryAdminSettingsRepository,
  MemoryApiKeyRepository,
  MemoryTenantRepository,
} from '../../../src/modules/admin/infrastructure/db/memory/memory-admin.repository.ts';

function setup() {
  const tenants = new MemoryTenantRepository();
  const apiKeys = new MemoryApiKeyRepository();
  const settings = new MemoryAdminSettingsRepository();
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const api = createAdminApi({ tenants, apiKeys, settings, clock });
  return { api, tenants, apiKeys, settings };
}

describe('AdminApi', () => {
  it('lists default tenant on creation', async () => {
    const { api } = setup();
    const res = await api.listTenants();
    assert.equal(res.tenants.length, 1);
    assert.equal(res.tenants[0].slug, 'global-nomads');
  });

  it('creates new tenant and prevents duplicate slug', async () => {
    const { api } = setup();
    const created = await api.createTenant({
      slug: 'acme-corp',
      name: 'Acme Wealth Management',
      plan: 'INSTITUTIONAL',
    });
    assert.equal(created.slug, 'acme-corp');

    await assert.rejects(
      () =>
        api.createTenant({
          slug: 'acme-corp',
          name: 'Acme Duplicate',
          plan: 'STARTER',
        }),
      /slug acme-corp is already taken/,
    );
  });

  it('issues and revokes API keys', async () => {
    const { api } = setup();
    const tenants = await api.listTenants();
    const tenantId = tenants.tenants[0].id;

    const res = await api.createApiKey({
      tenantId,
      name: 'Integration Test Key',
      permissions: ['read:analytics', 'advisory:recommend'],
      rateLimitPerMinute: 60,
      monthlyTokenQuota: 100000,
    });

    assert.ok(res.secretKey.startsWith('dewa_live_'));
    assert.equal(res.apiKey.status, 'ACTIVE');

    const verified = await api.verifyApiKey(res.secretKey);
    assert.ok(verified);
    assert.equal(verified?.name, 'Integration Test Key');

    await api.revokeApiKey(res.apiKey.id);
    const afterRevoke = await api.verifyApiKey(res.secretKey);
    assert.equal(afterRevoke, null);
  });

  it('gets and updates model provider settings', async () => {
    const { api } = setup();
    const initial = await api.getSettings();
    assert.equal(initial.modelSettings.activeProvider, 'mock');

    const updated = await api.updateModelProvider('gemini');
    assert.equal(updated.activeProvider, 'gemini');

    const current = await api.getActiveProvider();
    assert.equal(current, 'gemini');
  });
});
