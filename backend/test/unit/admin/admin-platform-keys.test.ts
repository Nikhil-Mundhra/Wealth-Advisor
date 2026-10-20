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
  return { api, settings };
}

describe('Admin Platform Managed Keys', () => {
  it('reads key status with ENV fallback when DB key is not set', async () => {
    const { api } = setup();
    const settings = await api.getSettings();

    assert.ok(settings.platformKeys);
    assert.ok(settings.platformKeys.gemini);
    assert.ok(settings.platformKeys.openai);
    assert.ok(settings.platformKeys.anthropic);
    assert.ok(settings.platformKeys.openrouter);
    assert.ok(settings.platformKeys.marketstack);

    // Initial state: depending on process.env, source is 'env' or 'none'
    const initialSource = settings.platformKeys.gemini.source;
    assert.ok(['env', 'none'].includes(initialSource));
  });

  it('configures DB platform key, overrides ENV, masks value, and persists', async () => {
    const { api } = setup();

    const updated = await api.updatePlatformKeys({
      geminiApiKey: 'AIzaSyTestGeminiKey123456789',
      openaiApiKey: 'sk-proj-test-openai-key-abc123xyz',
      openrouterApiKey: 'sk-or-v1-test-openrouter-key-987654321',
    });

    assert.equal(updated.gemini.configured, true);
    assert.equal(updated.gemini.source, 'db');
    assert.equal(updated.gemini.maskedKey, 'AIza...6789');

    assert.equal(updated.openai.configured, true);
    assert.equal(updated.openai.source, 'db');
    assert.equal(updated.openai.maskedKey, 'sk-p...3xyz');

    assert.equal(updated.openrouter.configured, true);
    assert.equal(updated.openrouter.source, 'db');
    assert.equal(updated.openrouter.maskedKey, 'sk-o...4321');

    // Effective key resolution
    const effectiveGemini = await api.getPlatformKey('gemini');
    assert.equal(effectiveGemini, 'AIzaSyTestGeminiKey123456789');

    const effectiveOpenAi = await api.getPlatformKey('openai');
    assert.equal(effectiveOpenAi, 'sk-proj-test-openai-key-abc123xyz');

    const effectiveOpenRouter = await api.getPlatformKey('openrouter');
    assert.equal(effectiveOpenRouter, 'sk-or-v1-test-openrouter-key-987654321');

    // Verify getSettings reflects updated DB keys
    const settings = await api.getSettings();
    assert.equal(settings.platformKeys.gemini.source, 'db');
    assert.equal(settings.platformKeys.gemini.maskedKey, 'AIza...6789');
  });

  it('clearing DB platform key falls back to ENV or none', async () => {
    const { api } = setup();

    // Set key in DB
    await api.updatePlatformKeys({
      marketstackAccessKey: 'marketstack-custom-db-key',
    });
    assert.equal(await api.getPlatformKey('marketstack'), 'marketstack-custom-db-key');

    // Clear key in DB by sending empty string
    const cleared = await api.updatePlatformKeys({
      marketstackAccessKey: '',
    });

    const currentKey = await api.getPlatformKey('marketstack');
    // If process.env.MARKETSTACK_ACCESS_KEY exists, it falls back to it; otherwise undefined
    assert.notEqual(currentKey, 'marketstack-custom-db-key');
    assert.ok(cleared.marketstack.source === 'env' || cleared.marketstack.source === 'none');
  });

  it('checks AI platform health for mock and unconfigured providers', async () => {
    const { api } = setup();

    const health = await api.checkAiHealth('mock');
    assert.equal(health.providers.length, 1);
    assert.equal(health.providers[0].provider, 'mock');
    assert.equal(health.providers[0].healthy, true);
    assert.equal(health.providers[0].status, 'HEALTHY');

    // With no DB keys set, an unconfigured provider returns NOT_CONFIGURED (assuming no env keys)
    const allHealth = await api.checkAiHealth();
    assert.ok(allHealth.providers.length >= 5);
    const mockCheck = allHealth.providers.find((p) => p.provider === 'mock');
    assert.ok(mockCheck?.healthy);
  });

  it('checks AI health for openrouter with live or mock probe', async () => {
    const { api } = setup();
    await api.updatePlatformKeys({
      openrouterApiKey: 'sk-or-v1-test-probe-key',
    });

    const realFetch = globalThis.fetch;
    try {
      // Mock successful OpenRouter key check
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            data: { label: 'Test Key', usage: 0.05, limit: 10 },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );

      const health = await api.checkAiHealth('openrouter');
      assert.equal(health.providers.length, 1);
      const or = health.providers[0];
      assert.equal(or.provider, 'openrouter');
      assert.equal(or.healthy, true);
      assert.equal(or.status, 'HEALTHY');
      assert.ok(or.message.includes('Key valid'));
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
