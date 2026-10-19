import { beforeEach, describe, expect, it } from 'vitest';
import {
  detectProvider,
  getActiveModelSpec,
  getAiConfig,
  maskApiKey,
  resetToDefault,
  saveAiConfig,
  updateSelectedModel,
} from './ai-settings-store.ts';
import { SYSTEM_DEFAULT_MODEL_ID, TOP_FREE_MODEL_ID } from './models-data.ts';

describe('ai-settings-store', () => {
  beforeEach(() => {
    resetToDefault();
    window.localStorage.clear();
  });

  it('detects providers based on key prefixes', () => {
    expect(detectProvider('sk-or-v1-abc123456')).toBe('openrouter');
    expect(detectProvider('sk-ant-api03-xyz987')).toBe('anthropic');
    expect(detectProvider('sk-proj-openai999')).toBe('openai');
    expect(detectProvider('AIzaSyD-geminikey')).toBe('gemini');
    expect(detectProvider('unknown-token-123')).toBe('openrouter');
  });

  it('masks API keys safely preserving identifiable prefixes and last 4 characters', () => {
    expect(maskApiKey('')).toBe('');
    expect(maskApiKey('12345')).toBe('••••••••');
    expect(maskApiKey('sk-or-v1-abcdef0123456789xyz')).toBe('sk-or-v1-••••••••9xyz');
    expect(maskApiKey('sk-ant-api03-key1234567890')).toBe('sk-ant-••••••••7890');
    expect(maskApiKey('sk-abcdefghijklmnopqrstuvwxyz')).toBe('sk-••••••••wxyz');
  });

  it('saves custom configuration, defaults OpenRouter to TOP_FREE_MODEL_ID, and stores in localStorage', () => {
    const config = saveAiConfig({
      apiKey: 'sk-or-v1-livekey99998888',
    });

    expect(config.isCustom).toBe(true);
    expect(config.provider).toBe('openrouter');
    expect(config.selectedModelId).toBe(TOP_FREE_MODEL_ID);
    expect(config.maskedKey).toBe('sk-or-v1-••••••••8888');

    // Verify persistence
    expect(window.localStorage.getItem('wealth_advisor_ai_key')).toBe('sk-or-v1-livekey99998888');
    expect(window.localStorage.getItem('wealth_advisor_ai_model')).toBe(TOP_FREE_MODEL_ID);

    // Verify getAiConfig
    expect(getAiConfig().isCustom).toBe(true);
  });

  it('updates selected model ID', () => {
    saveAiConfig({ apiKey: 'sk-or-v1-livekey99998888' });
    updateSelectedModel('anthropic/claude-3.5-sonnet');

    expect(getAiConfig().selectedModelId).toBe('anthropic/claude-3.5-sonnet');
    expect(window.localStorage.getItem('wealth_advisor_ai_model')).toBe('anthropic/claude-3.5-sonnet');
  });

  it('resets to platform default gateway', () => {
    saveAiConfig({ apiKey: 'sk-or-v1-livekey99998888' });
    const reset = resetToDefault();

    expect(reset.isCustom).toBe(false);
    expect(reset.selectedModelId).toBe(SYSTEM_DEFAULT_MODEL_ID);
    expect(reset.apiKey).toBe('');
    expect(window.localStorage.getItem('wealth_advisor_ai_key')).toBeNull();
  });

  it('retrieves active model specifications with fallback', () => {
    const nemotron = getActiveModelSpec(TOP_FREE_MODEL_ID);
    expect(nemotron.name).toBe('NVIDIA Nemotron 3 Ultra 550B');
    expect(nemotron.financeBenchScore).toBe(88.5);
    expect(nemotron.isFree).toBe(true);

    const fallback = getActiveModelSpec('non-existent-model');
    expect(fallback.id).toBe(SYSTEM_DEFAULT_MODEL_ID);
  });
});
