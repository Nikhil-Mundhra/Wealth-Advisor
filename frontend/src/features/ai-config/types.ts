export type AiProvider = 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'system_default';

export interface AiModelSpec {
  id: string;
  name: string;
  provider: AiProvider;
  financeBenchScore: number; // Factual Correctness % on FinanceBench benchmark
  isFree: boolean;
  isDefault: boolean;
  contextWindow: string;
  latency: string;
  description: string;
  tags: string[];
  pricing: string;
}

export interface AiConfiguration {
  apiKey: string;
  maskedKey: string;
  provider: AiProvider;
  selectedModelId: string;
  isCustom: boolean;
  configuredAt: string | null;
}
