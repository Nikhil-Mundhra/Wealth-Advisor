import type { LlmProvider, Role, UserStatus } from '@wealth-advisor/rules';
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

export interface PlatformKeysRecord {
  geminiApiKey?: string | null;
  openaiApiKey?: string | null;
  anthropicApiKey?: string | null;
  marketstackAccessKey?: string | null;
}

export interface AdminSettingsRepository {
  getActiveLlmProvider(): Promise<LlmProvider>;
  setActiveLlmProvider(provider: LlmProvider): Promise<void>;
  getPlatformKeys(): Promise<PlatformKeysRecord>;
  updatePlatformKeys(keys: PlatformKeysRecord): Promise<void>;
}

export interface AdminUserRecord {
  id: string;
  tenantId: string | null;
  email: string;
  displayName: string | null;
  status: UserStatus;
  roles: Role[];
  emailVerified: boolean;
  providers: {
    type: string;
    subject: string;
    email: string | null;
    linkedAt: Date;
    lastLoginAt: Date | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminUserInput {
  email: string;
  displayName: string | null;
  passwordHash: string;
  roles: Role[];
  tenantId: string | null;
}

export interface UpdateAdminUserInput {
  displayName?: string | null;
  roles?: Role[];
  status?: UserStatus;
  tenantId?: string | null;
  emailVerified?: boolean;
}

export interface AdminUserFilters {
  query?: string;
  role?: string;
  status?: string;
  tenantId?: string;
}

export interface AdminUserRepository {
  findAll(filters?: AdminUserFilters): Promise<AdminUserRecord[]>;
  findById(id: string): Promise<AdminUserRecord | null>;
  findByEmail(email: string): Promise<AdminUserRecord | null>;
  create(input: CreateAdminUserInput): Promise<AdminUserRecord>;
  update(id: string, input: UpdateAdminUserInput): Promise<AdminUserRecord | null>;
  updatePassword(id: string, passwordHash: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
