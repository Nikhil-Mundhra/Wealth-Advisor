import type { ObjectId } from 'mongodb';
import type { ApiKeyPermission, ApiKeyStatus } from '@wealth-advisor/rules';

export const API_KEYS_COLLECTION = 'api_keys';

export interface ApiKeyDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  name: string;
  keyPrefix: string;
  keyHash: string;
  permissions: ApiKeyPermission[];
  rateLimitPerMinute: number;
  monthlyTokenQuota: number;
  usedTokensThisMonth: number;
  status: ApiKeyStatus;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}
