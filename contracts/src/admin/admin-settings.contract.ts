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
  marketstack: PlatformKeyStatusDto,
});
export type PlatformKeysStatusDto = z.infer<typeof PlatformKeysStatusDto>;

export const UpdatePlatformKeysRequest = z.object({
  geminiApiKey: z.string().trim().nullable().optional(),
  openaiApiKey: z.string().trim().nullable().optional(),
  anthropicApiKey: z.string().trim().nullable().optional(),
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
