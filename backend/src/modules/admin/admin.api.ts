import { ObjectId } from 'mongodb';
import { LLM_PROVIDERS, type LlmProvider } from '@wealth-advisor/rules';
import type {
  AdminSettingsResponse,
  ApiKeyCreatedResponse,
  ApiKeyDto,
  ApiKeyListResponse,
  CreateApiKeyRequest,
  CreateTenantRequest,
  TenantDto,
  TenantListResponse,
} from '@wealth-advisor/contracts';
import { generateOpaqueToken } from '#core/crypto/random-token.ts';
import { sha256Hex } from '#core/crypto/sha256.ts';
import type { Clock } from '#core/time/clock.ts';
import type { AdminSettingsRepository, ApiKeyRepository, TenantRepository } from './application/ports.ts';
import { AdminErrors } from './domain/errors/admin-errors.ts';
import type { ApiKeyDocument } from './infrastructure/db/documents/api-key.document.ts';
import type { TenantDocument } from './infrastructure/db/documents/tenant.document.ts';

export interface AdminApiDeps {
  tenants: TenantRepository;
  apiKeys: ApiKeyRepository;
  settings: AdminSettingsRepository;
  clock: Clock;
}

function toTenantDto(doc: TenantDocument): TenantDto {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    name: doc.name,
    plan: doc.plan,
    status: doc.status,
    settings: {
      baselineCurrency: doc.settings.baselineCurrency as any,
      allowedCorridors: doc.settings.allowedCorridors,
      defaultLlmProvider: doc.settings.defaultLlmProvider,
      maxMembers: doc.settings.maxMembers,
      requirePasskeyForRebalance: doc.settings.requirePasskeyForRebalance,
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toApiKeyDto(doc: ApiKeyDocument): ApiKeyDto {
  return {
    id: doc._id.toHexString(),
    tenantId: doc.tenantId.toHexString(),
    name: doc.name,
    keyPrefix: doc.keyPrefix,
    permissions: doc.permissions,
    rateLimitPerMinute: doc.rateLimitPerMinute,
    monthlyTokenQuota: doc.monthlyTokenQuota,
    usedTokensThisMonth: doc.usedTokensThisMonth,
    status: doc.status,
    lastUsedAt: doc.lastUsedAt ? doc.lastUsedAt.toISOString() : null,
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function createAdminApi(deps: AdminApiDeps) {
  const { tenants, apiKeys, settings, clock } = deps;

  return {
    async listTenants(): Promise<TenantListResponse> {
      const all = await tenants.findAll();
      return { tenants: all.map(toTenantDto) };
    },

    async createTenant(input: CreateTenantRequest): Promise<TenantDto> {
      const existing = await tenants.findBySlug(input.slug);
      if (existing) throw AdminErrors.slugTaken(input.slug);
      const now = clock.now();
      const created = await tenants.create({
        slug: input.slug,
        name: input.name,
        plan: input.plan ?? 'STARTER',
        status: 'ACTIVE',
        settings: {
          baselineCurrency: input.settings?.baselineCurrency ?? 'EUR',
          allowedCorridors: input.settings?.allowedCorridors ?? ['EUR_CNY', 'GBP_SGD'],
          defaultLlmProvider: input.settings?.defaultLlmProvider ?? 'mock',
          maxMembers: input.settings?.maxMembers ?? 50,
          requirePasskeyForRebalance: input.settings?.requirePasskeyForRebalance ?? true,
        },
        createdAt: now,
        updatedAt: now,
      });
      return toTenantDto(created);
    },

    async listApiKeys(): Promise<ApiKeyListResponse> {
      const all = await apiKeys.findAll();
      return { apiKeys: all.map(toApiKeyDto) };
    },

    async createApiKey(input: CreateApiKeyRequest): Promise<ApiKeyCreatedResponse> {
      const tenant = await tenants.findById(input.tenantId);
      if (!tenant) throw AdminErrors.tenantNotFound(input.tenantId);

      const prefix = `dewa_live_${generateOpaqueToken(4)}`;
      const secretBody = generateOpaqueToken(24);
      const fullSecret = `${prefix}_${secretBody}`;
      const keyHash = sha256Hex(fullSecret);

      const now = clock.now();
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      const created = await apiKeys.create({
        tenantId: new ObjectId(input.tenantId),
        name: input.name,
        keyPrefix: prefix,
        keyHash,
        permissions: input.permissions,
        rateLimitPerMinute: input.rateLimitPerMinute ?? 60,
        monthlyTokenQuota: input.monthlyTokenQuota ?? 100000,
        usedTokensThisMonth: 0,
        status: 'ACTIVE',
        lastUsedAt: null,
        expiresAt,
        createdAt: now,
      });

      return {
        apiKey: toApiKeyDto(created),
        secretKey: fullSecret,
      };
    },

    async revokeApiKey(id: string): Promise<boolean> {
      const ok = await apiKeys.revoke(id);
      if (!ok) throw AdminErrors.apiKeyNotFound(id);
      return true;
    },

    async getSettings(): Promise<AdminSettingsResponse> {
      const active = await settings.getActiveLlmProvider();
      return {
        modelSettings: {
          activeProvider: active,
          availableProviders: [...LLM_PROVIDERS],
        },
        systemHealth: {
          status: 'ok',
          uptimeSeconds: Math.floor(process.uptime()),
          database: 'connected',
        },
      };
    },

    async updateModelProvider(provider: LlmProvider) {
      if (!LLM_PROVIDERS.includes(provider)) throw AdminErrors.invalidProvider(provider);
      await settings.setActiveLlmProvider(provider);
      return {
        activeProvider: provider,
        availableProviders: [...LLM_PROVIDERS],
      };
    },

    async findTenantById(id: string) {
      return tenants.findById(id);
    },

    async findTenantBySlug(slug: string) {
      return tenants.findBySlug(slug);
    },

    async verifyApiKey(secret: string) {
      const hash = sha256Hex(secret);
      const key = await apiKeys.findByKeyHash(hash);
      if (!key || key.status !== 'ACTIVE') return null;
      if (key.expiresAt && key.expiresAt < clock.now()) return null;
      return key;
    },

    async getActiveProvider(): Promise<LlmProvider> {
      return settings.getActiveLlmProvider();
    },
  };
}

export type AdminApi = ReturnType<typeof createAdminApi>;
