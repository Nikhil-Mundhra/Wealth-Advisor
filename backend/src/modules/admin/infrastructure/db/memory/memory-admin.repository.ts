import { ObjectId } from 'mongodb';
import type { LlmProvider } from '@wealth-advisor/rules';
import type { AdminSettingsRepository, ApiKeyRepository, TenantRepository } from '../../../application/ports.ts';
import type { ApiKeyDocument } from '../documents/api-key.document.ts';
import type { TenantDocument } from '../documents/tenant.document.ts';

export class MemoryTenantRepository implements TenantRepository {
  private readonly tenants = new Map<string, TenantDocument>();

  constructor() {
    const defaultId = new ObjectId('600000000000000000000001');
    const now = new Date();
    this.tenants.set(defaultId.toHexString(), {
      _id: defaultId,
      slug: 'global-nomads',
      name: 'Global Nomads Wealth',
      plan: 'INSTITUTIONAL',
      status: 'ACTIVE',
      settings: {
        baselineCurrency: 'EUR',
        allowedCorridors: ['EUR_CNY', 'GBP_SGD', 'USD_CNY', 'EUR_SGD'],
        defaultLlmProvider: 'mock',
        maxMembers: 100,
        requirePasskeyForRebalance: true,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  async findAll(): Promise<TenantDocument[]> {
    return Array.from(this.tenants.values());
  }

  async findById(id: string): Promise<TenantDocument | null> {
    return this.tenants.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<TenantDocument | null> {
    for (const t of this.tenants.values()) {
      if (t.slug === slug) return t;
    }
    return null;
  }

  async create(tenant: Omit<TenantDocument, '_id'>): Promise<TenantDocument> {
    const id = new ObjectId();
    const doc: TenantDocument = { ...tenant, _id: id };
    this.tenants.set(id.toHexString(), doc);
    return doc;
  }
}

export class MemoryApiKeyRepository implements ApiKeyRepository {
  private readonly apiKeys = new Map<string, ApiKeyDocument>();

  async findAll(): Promise<ApiKeyDocument[]> {
    return Array.from(this.apiKeys.values());
  }

  async findByTenantId(tenantId: string): Promise<ApiKeyDocument[]> {
    return Array.from(this.apiKeys.values()).filter((k) => k.tenantId.toHexString() === tenantId);
  }

  async findById(id: string): Promise<ApiKeyDocument | null> {
    return this.apiKeys.get(id) ?? null;
  }

  async findByKeyHash(keyHash: string): Promise<ApiKeyDocument | null> {
    for (const k of this.apiKeys.values()) {
      if (k.keyHash === keyHash) return k;
    }
    return null;
  }

  async create(apiKey: Omit<ApiKeyDocument, '_id'>): Promise<ApiKeyDocument> {
    const id = new ObjectId();
    const doc: ApiKeyDocument = { ...apiKey, _id: id };
    this.apiKeys.set(id.toHexString(), doc);
    return doc;
  }

  async revoke(id: string): Promise<boolean> {
    const key = this.apiKeys.get(id);
    if (!key) return false;
    key.status = 'REVOKED';
    return true;
  }
}

export class MemoryAdminSettingsRepository implements AdminSettingsRepository {
  private activeProvider: LlmProvider = 'mock';

  async getActiveLlmProvider(): Promise<LlmProvider> {
    return this.activeProvider;
  }

  async setActiveLlmProvider(provider: LlmProvider): Promise<void> {
    this.activeProvider = provider;
  }
}
