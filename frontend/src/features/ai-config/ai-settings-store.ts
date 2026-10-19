import { useSyncExternalStore } from 'react';
import { FINANCE_BENCH_MODELS, SYSTEM_DEFAULT_MODEL_ID, TOP_FREE_MODEL_ID } from './models-data.ts';
import type { AiConfiguration, AiProvider } from './types.ts';

const STORAGE_KEY_API_KEY = 'wealth_advisor_ai_key';
const STORAGE_KEY_PROVIDER = 'wealth_advisor_ai_provider';
const STORAGE_KEY_MODEL = 'wealth_advisor_ai_model';
const STORAGE_KEY_CONFIGURED_AT = 'wealth_advisor_ai_configured_at';

export function maskApiKey(key: string): string {
  const clean = key.trim();
  if (!clean) return '';
  if (clean.length <= 8) return '••••••••';
  if (clean.startsWith('sk-or-v1-')) {
    return `sk-or-v1-••••••••${clean.slice(-4)}`;
  }
  if (clean.startsWith('sk-ant-')) {
    return `sk-ant-••••••••${clean.slice(-4)}`;
  }
  if (clean.startsWith('sk-')) {
    return `sk-••••••••${clean.slice(-4)}`;
  }
  const prefix = clean.slice(0, Math.min(8, Math.floor(clean.length / 3)));
  const suffix = clean.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

export function detectProvider(key: string): AiProvider {
  const clean = key.trim().toLowerCase();
  if (clean.startsWith('sk-or-')) return 'openrouter';
  if (clean.startsWith('sk-ant-')) return 'anthropic';
  if (clean.startsWith('sk-')) return 'openai';
  if (clean.startsWith('aiza')) return 'gemini';
  return 'openrouter'; // default fallback for universal aggregator keys
}

function getDefaultModelForProvider(provider: AiProvider): string {
  switch (provider) {
    case 'openrouter':
      return TOP_FREE_MODEL_ID;
    case 'anthropic':
      return 'anthropic/claude-3.5-sonnet';
    case 'openai':
      return 'openai/gpt-4o';
    case 'gemini':
      return SYSTEM_DEFAULT_MODEL_ID;
    default:
      return SYSTEM_DEFAULT_MODEL_ID;
  }
}

function loadInitialConfig(): AiConfiguration {
  if (typeof window === 'undefined') {
    return {
      apiKey: '',
      maskedKey: '',
      provider: 'system_default',
      selectedModelId: SYSTEM_DEFAULT_MODEL_ID,
      isCustom: false,
      configuredAt: null,
    };
  }

  const storedKey = window.localStorage.getItem(STORAGE_KEY_API_KEY) ?? '';
  const storedProvider = (window.localStorage.getItem(STORAGE_KEY_PROVIDER) as AiProvider) ?? null;
  const storedModel = window.localStorage.getItem(STORAGE_KEY_MODEL) ?? '';
  const storedConfiguredAt = window.localStorage.getItem(STORAGE_KEY_CONFIGURED_AT) ?? null;

  if (storedKey) {
    const provider = storedProvider || detectProvider(storedKey);
    const selectedModelId = storedModel || getDefaultModelForProvider(provider);
    return {
      apiKey: storedKey,
      maskedKey: maskApiKey(storedKey),
      provider,
      selectedModelId,
      isCustom: true,
      configuredAt: storedConfiguredAt || new Date().toISOString(),
    };
  }

  return {
    apiKey: '',
    maskedKey: '',
    provider: 'system_default',
    selectedModelId: SYSTEM_DEFAULT_MODEL_ID,
    isCustom: false,
    configuredAt: null,
  };
}

let currentConfig: AiConfiguration = loadInitialConfig();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function getAiConfig(): AiConfiguration {
  return currentConfig;
}

export function saveAiConfig(params: {
  apiKey: string;
  selectedModelId?: string;
  provider?: AiProvider;
}): AiConfiguration {
  const cleanKey = params.apiKey.trim();

  if (!cleanKey) {
    return resetToDefault();
  }

  const provider = params.provider || detectProvider(cleanKey);
  const selectedModelId = params.selectedModelId || getDefaultModelForProvider(provider);
  const configuredAt = new Date().toISOString();

  currentConfig = {
    apiKey: cleanKey,
    maskedKey: maskApiKey(cleanKey),
    provider,
    selectedModelId,
    isCustom: true,
    configuredAt,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY_API_KEY, cleanKey);
    window.localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
    window.localStorage.setItem(STORAGE_KEY_MODEL, selectedModelId);
    window.localStorage.setItem(STORAGE_KEY_CONFIGURED_AT, configuredAt);
  }

  notify();
  return currentConfig;
}

export function updateSelectedModel(modelId: string): AiConfiguration {
  currentConfig = {
    ...currentConfig,
    selectedModelId: modelId,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY_MODEL, modelId);
  }

  notify();
  return currentConfig;
}

export function resetToDefault(): AiConfiguration {
  currentConfig = {
    apiKey: '',
    maskedKey: '',
    provider: 'system_default',
    selectedModelId: SYSTEM_DEFAULT_MODEL_ID,
    isCustom: false,
    configuredAt: null,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY_API_KEY);
    window.localStorage.removeItem(STORAGE_KEY_PROVIDER);
    window.localStorage.removeItem(STORAGE_KEY_MODEL);
    window.localStorage.removeItem(STORAGE_KEY_CONFIGURED_AT);
  }

  notify();
  return currentConfig;
}

export function subscribeToAiConfig(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useAiConfig(): AiConfiguration {
  return useSyncExternalStore(subscribeToAiConfig, getAiConfig, () => ({
    apiKey: '',
    maskedKey: '',
    provider: 'system_default',
    selectedModelId: SYSTEM_DEFAULT_MODEL_ID,
    isCustom: false,
    configuredAt: null,
  }));
}

export function getActiveModelSpec(selectedModelId: string) {
  return (
    FINANCE_BENCH_MODELS.find((m) => m.id === selectedModelId) ||
    FINANCE_BENCH_MODELS.find((m) => m.id === SYSTEM_DEFAULT_MODEL_ID) ||
    FINANCE_BENCH_MODELS[0]
  );
}
