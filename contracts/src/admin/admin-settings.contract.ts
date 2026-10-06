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

export const AdminSettingsResponse = z.object({
  modelSettings: AdminModelSettingDto,
  systemHealth: z.object({
    status: z.string(),
    uptimeSeconds: z.number(),
    database: z.string(),
  }),
});
export type AdminSettingsResponse = z.infer<typeof AdminSettingsResponse>;
