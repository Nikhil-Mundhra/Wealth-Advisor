// LLM providers the admin console can switch between; mock is the offline fallback.
export const LLM_PROVIDERS = ['gemini', 'claude', 'openai', 'mock'] as const;
export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export function isLlmProvider(value: string): value is LlmProvider {
  return (LLM_PROVIDERS as readonly string[]).includes(value);
}
