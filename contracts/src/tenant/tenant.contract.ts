import { z } from 'zod';
import { CURRENCIES, LLM_PROVIDERS, TENANT_PLANS, TENANT_STATUSES } from '@wealth-advisor/rules';

export const TenantSettingsDto = z.object({
  baselineCurrency: z.enum(CURRENCIES).default('EUR'),
  allowedCorridors: z.array(z.string()).default(['EUR_CNY', 'GBP_SGD']),
  defaultLlmProvider: z.enum(LLM_PROVIDERS).default('mock'),
  maxMembers: z.number().int().positive().default(50),
  requirePasskeyForRebalance: z.boolean().default(true),
});
export type TenantSettingsDto = z.infer<typeof TenantSettingsDto>;

export const TenantDto = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  plan: z.enum(TENANT_PLANS),
  status: z.enum(TENANT_STATUSES),
  settings: TenantSettingsDto,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TenantDto = z.infer<typeof TenantDto>;

export const CreateTenantRequest = z.object({
  slug: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  plan: z.enum(TENANT_PLANS).default('STARTER'),
  settings: TenantSettingsDto.optional(),
});
export type CreateTenantRequest = z.infer<typeof CreateTenantRequest>;

export const TenantListResponse = z.object({
  tenants: z.array(TenantDto),
});
export type TenantListResponse = z.infer<typeof TenantListResponse>;
