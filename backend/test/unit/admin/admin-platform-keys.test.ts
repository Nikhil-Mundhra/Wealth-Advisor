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
});
