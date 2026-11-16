import { z } from 'zod';
import {
  CURRENCIES,
  DEFAULT_ALLOWED_CORRIDORS,
  LLM_PROVIDERS,
  TENANT_DEFAULT_MAX_MEMBERS,
  TENANT_NAME_MAX_LENGTH,
  TENANT_NAME_MIN_LENGTH,
  TENANT_PLANS,
  TENANT_SLUG_MAX_LENGTH,
  TENANT_SLUG_MIN_LENGTH,
  TENANT_STATUSES,
} from '@wealth-advisor/rules';

export const TenantSettingsDto = z.object({
  baselineCurrency: z.enum(CURRENCIES).default('EUR'),
  allowedCorridors: z.array(z.string()).default([...DEFAULT_ALLOWED_CORRIDORS]),
  defaultLlmProvider: z.enum(LLM_PROVIDERS).default('mock'),
  maxMembers: z.number().int().positive().default(TENANT_DEFAULT_MAX_MEMBERS),
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
  slug: z.string().min(TENANT_SLUG_MIN_LENGTH).max(TENANT_SLUG_MAX_LENGTH),
  name: z.string().min(TENANT_NAME_MIN_LENGTH).max(TENANT_NAME_MAX_LENGTH),
  plan: z.enum(TENANT_PLANS).default('STARTER'),
  settings: TenantSettingsDto.optional(),
});
export type CreateTenantRequest = z.infer<typeof CreateTenantRequest>;

export const TenantListResponse = z.object({
  tenants: z.array(TenantDto),
});
export type TenantListResponse = z.infer<typeof TenantListResponse>;
