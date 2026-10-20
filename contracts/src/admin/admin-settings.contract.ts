import { z } from 'zod';
import { LLM_PROVIDERS } from '@wealth-advisor/rules';

export const AdminModelSettingDto = z.object({
  activeProvider: z.enum(LLM_PROVIDERS),
  availableProviders: z.array(z.enum(LLM_PROVIDERS)),
});
export type AdminModelSettingDto = z.infer<typeof AdminModelSettingDto>;

export const UpdateAdminModelRequest = z.object({
  provider: z.enum(LLM_PROVIDERS),
});
export type UpdateAdminModelRequest = z.infer<typeof UpdateAdminModelRequest>;

export const PlatformKeyStatusDto = z.object({
  configured: z.boolean(),
  source: z.enum(['db', 'env', 'none']),
  maskedKey: z.string().nullable(),
});
export type PlatformKeyStatusDto = z.infer<typeof PlatformKeyStatusDto>;

export const PlatformKeysStatusDto = z.object({
  gemini: PlatformKeyStatusDto,
  openai: PlatformKeyStatusDto,
  anthropic: PlatformKeyStatusDto,
  openrouter: PlatformKeyStatusDto,
  marketstack: PlatformKeyStatusDto,
});
export type PlatformKeysStatusDto = z.infer<typeof PlatformKeysStatusDto>;

export const UpdatePlatformKeysRequest = z.object({
  geminiApiKey: z.string().trim().nullable().optional(),
  openaiApiKey: z.string().trim().nullable().optional(),
  anthropicApiKey: z.string().trim().nullable().optional(),
  openrouterApiKey: z.string().trim().nullable().optional(),
  marketstackAccessKey: z.string().trim().nullable().optional(),
});
export type UpdatePlatformKeysRequest = z.infer<typeof UpdatePlatformKeysRequest>;

export const AdminSettingsResponse = z.object({
  modelSettings: AdminModelSettingDto,
  platformKeys: PlatformKeysStatusDto,
  systemHealth: z.object({
    status: z.string(),
    uptimeSeconds: z.number(),
    database: z.string(),
  }),
});
export type AdminSettingsResponse = z.infer<typeof AdminSettingsResponse>;

export const CheckAiHealthRequest = z.object({
  provider: z.enum(LLM_PROVIDERS).optional(),
});
export type CheckAiHealthRequest = z.infer<typeof CheckAiHealthRequest>;

export const AiProviderHealthDto = z.object({
  provider: z.enum(LLM_PROVIDERS),
  healthy: z.boolean(),
  status: z.enum(['HEALTHY', 'UNHEALTHY', 'NOT_CONFIGURED', 'TIMEOUT']),
  latencyMs: z.number().nullable(),
  source: z.enum(['db', 'env', 'none']),
  maskedKey: z.string().nullable(),
  message: z.string(),
  error: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
});
export type AiProviderHealthDto = z.infer<typeof AiProviderHealthDto>;

export const CheckAiHealthResponse = z.object({
  activeProvider: z.enum(LLM_PROVIDERS),
  checkedAt: z.string(),
  providers: z.array(AiProviderHealthDto),
});
export type CheckAiHealthResponse = z.infer<typeof CheckAiHealthResponse>;
