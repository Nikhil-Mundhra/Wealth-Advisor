import { z } from 'zod';
import {
  API_KEY_DEFAULT_MONTHLY_TOKEN_QUOTA,
  API_KEY_DEFAULT_RATE_LIMIT_PER_MINUTE,
  API_KEY_NAME_MAX_LENGTH,
  API_KEY_NAME_MIN_LENGTH,
  API_KEY_PERMISSIONS,
  API_KEY_STATUSES,
} from '@wealth-advisor/rules';

export const ApiKeyDto = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  keyPrefix: z.string(),
  permissions: z.array(z.enum(API_KEY_PERMISSIONS)),
  rateLimitPerMinute: z.number().int().positive(),
  monthlyTokenQuota: z.number().int().positive(),
  usedTokensThisMonth: z.number().int().nonnegative(),
  status: z.enum(API_KEY_STATUSES),
  lastUsedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});
export type ApiKeyDto = z.infer<typeof ApiKeyDto>;

export const CreateApiKeyRequest = z.object({
  tenantId: z.string(),
  name: z.string().min(API_KEY_NAME_MIN_LENGTH).max(API_KEY_NAME_MAX_LENGTH),
  permissions: z.array(z.enum(API_KEY_PERMISSIONS)).min(1),
  rateLimitPerMinute: z.number().int().positive().default(API_KEY_DEFAULT_RATE_LIMIT_PER_MINUTE),
  monthlyTokenQuota: z.number().int().positive().default(API_KEY_DEFAULT_MONTHLY_TOKEN_QUOTA),
  expiresAt: z.string().nullable().optional(),
});
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequest>;

export const ApiKeyCreatedResponse = z.object({
  apiKey: ApiKeyDto,
  secretKey: z.string(),
});
export type ApiKeyCreatedResponse = z.infer<typeof ApiKeyCreatedResponse>;

export const ApiKeyListResponse = z.object({
  apiKeys: z.array(ApiKeyDto),
});
export type ApiKeyListResponse = z.infer<typeof ApiKeyListResponse>;
