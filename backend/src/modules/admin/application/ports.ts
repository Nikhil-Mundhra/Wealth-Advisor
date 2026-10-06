import type { LlmProvider } from '@wealth-advisor/rules';
import type { ApiKeyDocument } from '../infrastructure/db/documents/api-key.document.ts';
import type { TenantDocument } from '../infrastructure/db/documents/tenant.document.ts';

export interface TenantRepository {
  findAll(): Promise<TenantDocument[]>;
  findById(id: string): Promise<TenantDocument | null>;
  findBySlug(slug: string): Promise<TenantDocument | null>;
  create(tenant: Omit<TenantDocument, '_id'>): Promise<TenantDocument>;
}

export interface ApiKeyRepository {
  findAll(): Promise<ApiKeyDocument[]>;
  findByTenantId(tenantId: string): Promise<ApiKeyDocument[]>;
  findById(id: string): Promise<ApiKeyDocument | null>;
  findByKeyHash(keyHash: string): Promise<ApiKeyDocument | null>;
  create(apiKey: Omit<ApiKeyDocument, '_id'>): Promise<ApiKeyDocument>;
  revoke(id: string): Promise<boolean>;
}

export interface AdminSettingsRepository {
  getActiveLlmProvider(): Promise<LlmProvider>;
  setActiveLlmProvider(provider: LlmProvider): Promise<void>;
}
