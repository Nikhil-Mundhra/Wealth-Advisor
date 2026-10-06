import { type Collection, ObjectId } from 'mongodb';
import type { LlmProvider } from '@wealth-advisor/rules';
import type { AdminSettingsRepository, ApiKeyRepository, TenantRepository } from '../../../application/ports.ts';
import { type AdminSettingsDocument, ADMIN_SETTINGS_COLLECTION } from '../documents/admin-settings.document.ts';
import { type ApiKeyDocument, API_KEYS_COLLECTION } from '../documents/api-key.document.ts';
import { type TenantDocument, TENANTS_COLLECTION } from '../documents/tenant.document.ts';

export class MongoTenantRepository implements TenantRepository {
  private readonly col: () => Promise<Collection<TenantDocument>>;

  constructor(col: () => Promise<Collection<TenantDocument>>) {
    this.col = col;
  }

  async findAll(): Promise<TenantDocument[]> {
    return (await this.col()).find({}).toArray();
  }

  async findById(id: string): Promise<TenantDocument | null> {
    try {
      return (await this.col()).findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  async findBySlug(slug: string): Promise<TenantDocument | null> {
    return (await this.col()).findOne({ slug });
  }

  async create(tenant: Omit<TenantDocument, '_id'>): Promise<TenantDocument> {
    const id = new ObjectId();
    const doc: TenantDocument = { ...tenant, _id: id };
    await (await this.col()).insertOne(doc as any);
    return doc;
  }
}

export class MongoApiKeyRepository implements ApiKeyRepository {
  private readonly col: () => Promise<Collection<ApiKeyDocument>>;

  constructor(col: () => Promise<Collection<ApiKeyDocument>>) {
    this.col = col;
  }

  async findAll(): Promise<ApiKeyDocument[]> {
    return (await this.col()).find({}).toArray();
  }

  async findByTenantId(tenantId: string): Promise<ApiKeyDocument[]> {
    try {
      return (await this.col()).find({ tenantId: new ObjectId(tenantId) }).toArray();
    } catch {
      return [];
    }
  }

  async findById(id: string): Promise<ApiKeyDocument | null> {
    try {
      return (await this.col()).findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  async findByKeyHash(keyHash: string): Promise<ApiKeyDocument | null> {
    return (await this.col()).findOne({ keyHash });
  }

  async create(apiKey: Omit<ApiKeyDocument, '_id'>): Promise<ApiKeyDocument> {
    const id = new ObjectId();
    const doc: ApiKeyDocument = { ...apiKey, _id: id };
    await (await this.col()).insertOne(doc as any);
    return doc;
  }

  async revoke(id: string): Promise<boolean> {
    try {
      const res = await (await this.col()).updateOne({ _id: new ObjectId(id) }, { $set: { status: 'REVOKED' } });
      return res.modifiedCount > 0;
    } catch {
      return false;
    }
  }
}

export class MongoAdminSettingsRepository implements AdminSettingsRepository {
  private readonly col: () => Promise<Collection<AdminSettingsDocument>>;

  constructor(col: () => Promise<Collection<AdminSettingsDocument>>) {
    this.col = col;
  }

  async getActiveLlmProvider(): Promise<LlmProvider> {
    const doc = await (await this.col()).findOne({ key: 'platform_settings' });
    return doc?.activeLlmProvider ?? 'mock';
  }

  async setActiveLlmProvider(provider: LlmProvider): Promise<void> {
    await (await this.col()).updateOne(
      { key: 'platform_settings' },
      { $set: { activeLlmProvider: provider, updatedAt: new Date() } },
      { upsert: true },
    );
  }
}
