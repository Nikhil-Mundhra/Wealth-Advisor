import { ObjectId } from 'mongodb';
import { LLM_PROVIDERS, type LlmProvider, type Role } from '@wealth-advisor/rules';
import type {
  AdminModelSettingDto,
  AdminResetPasswordRequest,
  AdminSettingsResponse,
  AdminUserDto,
  AdminUserListResponse,
  AdminUserQueryRequest,
  AiProviderHealthDto,
  ApiKeyCreatedResponse,
  ApiKeyDto,
  ApiKeyListResponse,
  CheckAiHealthResponse,
  CreateAdminUserRequest,
  CreateApiKeyRequest,
  CreateTenantRequest,
  PlatformKeyStatusDto,
  PlatformKeysStatusDto,
  TenantDto,
  TenantListResponse,
  UpdateAdminUserRequest,
  UpdatePlatformKeysRequest,
} from '@wealth-advisor/contracts';
import { env } from '#core/config/env.ts';
import { generateOpaqueToken } from '#core/crypto/random-token.ts';
import { sha256Hex } from '#core/crypto/sha256.ts';
import type { Clock } from '#core/time/clock.ts';
import type {
  AdminSettingsRepository,
  AdminUserRecord,
  AdminUserRepository,
  ApiKeyRepository,
  TenantRepository,
} from './application/ports.ts';
import { AdminErrors } from './domain/errors/admin-errors.ts';
import type { ApiKeyDocument } from './infrastructure/db/documents/api-key.document.ts';
import type { TenantDocument } from './infrastructure/db/documents/tenant.document.ts';

export interface AdminPasswordHasher {
  hash(password: string): Promise<string>;
}

export interface AdminApiDeps {
  tenants: TenantRepository;
  apiKeys: ApiKeyRepository;
  settings: AdminSettingsRepository;
  users?: AdminUserRepository;
  hasher?: AdminPasswordHasher;
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

function toAdminUserDto(user: AdminUserRecord): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: [...user.roles],
    status: user.status,
    tenantId: user.tenantId,
    emailVerified: user.emailVerified,
    providers: user.providers.map((p) => ({
      type: p.type,
      subject: p.subject,
      email: p.email,
      linkedAt: p.linkedAt.toISOString(),
      lastLoginAt: p.lastLoginAt ? p.lastLoginAt.toISOString() : null,
    })),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function maskKey(key?: string | null): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 8) return '****';
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

function resolveKeyStatus(dbKey?: string | null, envKey?: string | null): PlatformKeyStatusDto {
  if (dbKey && dbKey.trim().length > 0) {
    return {
      configured: true,
      source: 'db',
      maskedKey: maskKey(dbKey),
    };
  }
  if (envKey && envKey.trim().length > 0) {
    return {
      configured: true,
      source: 'env',
      maskedKey: maskKey(envKey),
    };
  }
  return {
    configured: false,
    source: 'none',
    maskedKey: null,
  };
}

export function createAdminApi(deps: AdminApiDeps) {
  const { tenants, apiKeys, settings, users, hasher, clock } = deps;

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
      const dbKeys = await settings.getPlatformKeys();
      const currentEnv = env();
      return {
        modelSettings: {
          activeProvider: active,
          availableProviders: [...LLM_PROVIDERS],
        },
        platformKeys: {
          gemini: resolveKeyStatus(dbKeys.geminiApiKey, currentEnv.GEMINI_API_KEY),
          openai: resolveKeyStatus(dbKeys.openaiApiKey, currentEnv.OPENAI_API_KEY),
          anthropic: resolveKeyStatus(dbKeys.anthropicApiKey, currentEnv.ANTHROPIC_API_KEY),
          openrouter: resolveKeyStatus(dbKeys.openrouterApiKey, currentEnv.OPENROUTER_API_KEY),
          marketstack: resolveKeyStatus(dbKeys.marketstackAccessKey, currentEnv.MARKETSTACK_ACCESS_KEY),
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

    async updatePlatformKeys(input: UpdatePlatformKeysRequest): Promise<PlatformKeysStatusDto> {
      const keysToUpdate: Record<string, string | null> = {};
      if (input.geminiApiKey !== undefined) {
        keysToUpdate.geminiApiKey = input.geminiApiKey && input.geminiApiKey.trim().length > 0 ? input.geminiApiKey.trim() : null;
      }
      if (input.openaiApiKey !== undefined) {
        keysToUpdate.openaiApiKey = input.openaiApiKey && input.openaiApiKey.trim().length > 0 ? input.openaiApiKey.trim() : null;
      }
      if (input.anthropicApiKey !== undefined) {
        keysToUpdate.anthropicApiKey = input.anthropicApiKey && input.anthropicApiKey.trim().length > 0 ? input.anthropicApiKey.trim() : null;
      }
      if (input.openrouterApiKey !== undefined) {
        keysToUpdate.openrouterApiKey = input.openrouterApiKey && input.openrouterApiKey.trim().length > 0 ? input.openrouterApiKey.trim() : null;
      }
      if (input.marketstackAccessKey !== undefined) {
        keysToUpdate.marketstackAccessKey = input.marketstackAccessKey && input.marketstackAccessKey.trim().length > 0 ? input.marketstackAccessKey.trim() : null;
      }
      await settings.updatePlatformKeys(keysToUpdate);
      const updated = await settings.getPlatformKeys();
      const currentEnv = env();
      return {
        gemini: resolveKeyStatus(updated.geminiApiKey, currentEnv.GEMINI_API_KEY),
        openai: resolveKeyStatus(updated.openaiApiKey, currentEnv.OPENAI_API_KEY),
        anthropic: resolveKeyStatus(updated.anthropicApiKey, currentEnv.ANTHROPIC_API_KEY),
        openrouter: resolveKeyStatus(updated.openrouterApiKey, currentEnv.OPENROUTER_API_KEY),
        marketstack: resolveKeyStatus(updated.marketstackAccessKey, currentEnv.MARKETSTACK_ACCESS_KEY),
      };
    },

    async getPlatformKey(name: 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'marketstack'): Promise<string | undefined> {
      const dbKeys = await settings.getPlatformKeys();
      const currentEnv = env();
      if (name === 'gemini') {
        if (dbKeys.geminiApiKey && dbKeys.geminiApiKey.trim().length > 0) return dbKeys.geminiApiKey.trim();
        return currentEnv.GEMINI_API_KEY;
      }
      if (name === 'openai') {
        if (dbKeys.openaiApiKey && dbKeys.openaiApiKey.trim().length > 0) return dbKeys.openaiApiKey.trim();
        return currentEnv.OPENAI_API_KEY;
      }
      if (name === 'anthropic') {
        if (dbKeys.anthropicApiKey && dbKeys.anthropicApiKey.trim().length > 0) return dbKeys.anthropicApiKey.trim();
        return currentEnv.ANTHROPIC_API_KEY;
      }
      if (name === 'openrouter') {
        if (dbKeys.openrouterApiKey && dbKeys.openrouterApiKey.trim().length > 0) return dbKeys.openrouterApiKey.trim();
        return currentEnv.OPENROUTER_API_KEY;
      }
      if (name === 'marketstack') {
        if (dbKeys.marketstackAccessKey && dbKeys.marketstackAccessKey.trim().length > 0) return dbKeys.marketstackAccessKey.trim();
        return currentEnv.MARKETSTACK_ACCESS_KEY;
      }
      return undefined;
    },

    async getPlatformKeys(): Promise<{ gemini?: string; openai?: string; anthropic?: string; openrouter?: string; marketstack?: string }> {
      const [gemini, openai, anthropic, openrouter, marketstack] = await Promise.all([
        this.getPlatformKey('gemini'),
        this.getPlatformKey('openai'),
        this.getPlatformKey('anthropic'),
        this.getPlatformKey('openrouter'),
        this.getPlatformKey('marketstack'),
      ]);
      return { gemini, openai, anthropic, openrouter, marketstack };
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

    async checkAiHealth(targetProvider?: LlmProvider): Promise<CheckAiHealthResponse> {
      const active = await settings.getActiveLlmProvider();
      const providersToTest: readonly LlmProvider[] = targetProvider ? [targetProvider] : LLM_PROVIDERS;
      const dbKeys = await settings.getPlatformKeys();
      const currentEnv = env();

      const results = await Promise.all(
        providersToTest.map(async (provider): Promise<AiProviderHealthDto> => {
          if (provider === 'mock') {
            return {
              provider: 'mock',
              healthy: true,
              status: 'HEALTHY',
              latencyMs: 0,
              source: 'none',
              maskedKey: null,
              message: 'Deterministic mock adapter active (offline)',
              model: 'MockLlmAdapter',
            };
          }

          let key: string | undefined;
          let source: 'db' | 'env' | 'none' = 'none';

          if (provider === 'gemini') {
            if (dbKeys.geminiApiKey?.trim()) {
              key = dbKeys.geminiApiKey.trim();
              source = 'db';
            } else if (currentEnv.GEMINI_API_KEY?.trim()) {
              key = currentEnv.GEMINI_API_KEY.trim();
              source = 'env';
            }
          } else if (provider === 'openai') {
            if (dbKeys.openaiApiKey?.trim()) {
              key = dbKeys.openaiApiKey.trim();
              source = 'db';
            } else if (currentEnv.OPENAI_API_KEY?.trim()) {
              key = currentEnv.OPENAI_API_KEY.trim();
              source = 'env';
            }
          } else if (provider === 'claude') {
            if (dbKeys.anthropicApiKey?.trim()) {
              key = dbKeys.anthropicApiKey.trim();
              source = 'db';
            } else if (currentEnv.ANTHROPIC_API_KEY?.trim()) {
              key = currentEnv.ANTHROPIC_API_KEY.trim();
              source = 'env';
            }
          } else if (provider === 'openrouter') {
            if (dbKeys.openrouterApiKey?.trim()) {
              key = dbKeys.openrouterApiKey.trim();
              source = 'db';
            } else if (currentEnv.OPENROUTER_API_KEY?.trim()) {
              key = currentEnv.OPENROUTER_API_KEY.trim();
              source = 'env';
            }
          }

          const masked = maskKey(key);
          if (!key) {
            return {
              provider,
              healthy: false,
              status: 'NOT_CONFIGURED',
              latencyMs: null,
              source: 'none',
              maskedKey: null,
              message: 'API key is not configured',
              error: 'Missing API key',
            };
          }

          const start = Date.now();
          const timeoutMs = 8000;
          try {
            if (provider === 'openrouter') {
              const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
                headers: {
                  authorization: `Bearer ${key}`,
                  'http-referer': 'https://syntropy.finance',
                  'x-title': 'Syntropy Wealth Advisor',
                },
                signal: AbortSignal.timeout(timeoutMs),
              });
              const latencyMs = Date.now() - start;
              if (res.ok) {
                const data: any = await res.json().catch(() => ({}));
                const label = data?.data?.label ?? 'OpenRouter Key';
                const usage = data?.data?.usage !== undefined ? `$${Number(data.data.usage).toFixed(4)}` : 'N/A';
                const limit =
                  data?.data?.limit !== null && data?.data?.limit !== undefined
                    ? `$${data.data.limit}`
                    : 'unlimited';
                return {
                  provider,
                  healthy: true,
                  status: 'HEALTHY',
                  latencyMs,
                  source,
                  maskedKey: masked,
                  message: `Key valid (${label}, usage: ${usage}, limit: ${limit})`,
                  model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
                };
              }
              const errText = await res.text().catch(() => '');
              return {
                provider,
                healthy: false,
                status: 'UNHEALTHY',
                latencyMs,
                source,
                maskedKey: masked,
                message: `OpenRouter returned HTTP ${res.status}`,
                error: errText.slice(0, 200) || `HTTP ${res.status}`,
                model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
              };
            }

            if (provider === 'gemini') {
              const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
                {
                  signal: AbortSignal.timeout(timeoutMs),
                },
              );
              const latencyMs = Date.now() - start;
              if (res.ok) {
                return {
                  provider,
                  healthy: true,
                  status: 'HEALTHY',
                  latencyMs,
                  source,
                  maskedKey: masked,
                  message: 'Gemini API key verified successfully',
                  model: 'gemini-2.5-flash',
                };
              }
              const errText = await res.text().catch(() => '');
              return {
                provider,
                healthy: false,
                status: 'UNHEALTHY',
                latencyMs,
                source,
                maskedKey: masked,
                message: `Gemini returned HTTP ${res.status}`,
                error: errText.slice(0, 200) || `HTTP ${res.status}`,
                model: 'gemini-2.5-flash',
              };
            }

            if (provider === 'openai') {
              const res = await fetch('https://api.openai.com/v1/models', {
                headers: { authorization: `Bearer ${key}` },
                signal: AbortSignal.timeout(timeoutMs),
              });
              const latencyMs = Date.now() - start;
              if (res.ok) {
                return {
                  provider,
                  healthy: true,
                  status: 'HEALTHY',
                  latencyMs,
                  source,
                  maskedKey: masked,
                  message: 'OpenAI API key verified successfully',
                  model: 'gpt-4o-mini',
                };
              }
              const errText = await res.text().catch(() => '');
              return {
                provider,
                healthy: false,
                status: 'UNHEALTHY',
                latencyMs,
                source,
                maskedKey: masked,
                message: `OpenAI returned HTTP ${res.status}`,
                error: errText.slice(0, 200) || `HTTP ${res.status}`,
                model: 'gpt-4o-mini',
              };
            }

            if (provider === 'claude') {
              const res = await fetch('https://api.anthropic.com/v1/models', {
                headers: {
                  'x-api-key': key,
                  'anthropic-version': '2023-06-01',
                },
                signal: AbortSignal.timeout(timeoutMs),
              });
              const latencyMs = Date.now() - start;
              if (res.ok) {
                return {
                  provider,
                  healthy: true,
                  status: 'HEALTHY',
                  latencyMs,
                  source,
                  maskedKey: masked,
                  message: 'Anthropic API key verified successfully',
                  model: 'claude-3-5-sonnet-20241022',
                };
              }
              const errText = await res.text().catch(() => '');
              return {
                provider,
                healthy: false,
                status: 'UNHEALTHY',
                latencyMs,
                source,
                maskedKey: masked,
                message: `Anthropic returned HTTP ${res.status}`,
                error: errText.slice(0, 200) || `HTTP ${res.status}`,
                model: 'claude-3-5-sonnet-20241022',
              };
            }

            return {
              provider,
              healthy: false,
              status: 'UNHEALTHY',
              latencyMs: null,
              source,
              maskedKey: masked,
              message: 'Unsupported provider',
            };
          } catch (err: unknown) {
            const latencyMs = Date.now() - start;
            const isTimeout =
              err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
            return {
              provider,
              healthy: false,
              status: isTimeout ? 'TIMEOUT' : 'UNHEALTHY',
              latencyMs,
              source,
              maskedKey: masked,
              message: isTimeout ? 'Request timed out after 8s' : 'Connection failed',
              error: err instanceof Error ? err.message : String(err),
            };
          }
        }),
      );

      return {
        activeProvider: active,
        checkedAt: clock.now().toISOString(),
        providers: results,
      };
    },

    async listUsers(query?: AdminUserQueryRequest): Promise<AdminUserListResponse> {
      if (!users) return { users: [], total: 0 };
      const all = await users.findAll({
        query: query?.q,
        role: query?.role,
        status: query?.status,
        tenantId: query?.tenantId,
      });
      return {
        users: all.map(toAdminUserDto),
        total: all.length,
      };
    },

    async getUser(id: string): Promise<AdminUserDto> {
      if (!users) throw AdminErrors.userNotFound(id);
      const user = await users.findById(id);
      if (!user) throw AdminErrors.userNotFound(id);
      return toAdminUserDto(user);
    },

    async createUser(input: CreateAdminUserRequest): Promise<AdminUserDto> {
      if (!users) throw AdminErrors.invariantViolated('user repository unconfigured');
      const existing = await users.findByEmail(input.email);
      if (existing) throw AdminErrors.emailTaken(input.email);

      if (input.tenantId) {
        const tenant = await tenants.findById(input.tenantId);
        if (!tenant) throw AdminErrors.tenantNotFound(input.tenantId);
      }

      const passwordHash = hasher
        ? await hasher.hash(input.password)
        : sha256Hex(input.password);

      const created = await users.create({
        email: input.email,
        displayName: input.displayName ?? null,
        passwordHash,
        roles: (input.roles as Role[]) ?? ['USER'],
        tenantId: input.tenantId ?? null,
      });

      return toAdminUserDto(created);
    },

    async updateUser(id: string, input: UpdateAdminUserRequest): Promise<AdminUserDto> {
      if (!users) throw AdminErrors.userNotFound(id);
      const existing = await users.findById(id);
      if (!existing) throw AdminErrors.userNotFound(id);

      if (input.tenantId) {
        const tenant = await tenants.findById(input.tenantId);
        if (!tenant) throw AdminErrors.tenantNotFound(input.tenantId);
      }

      const updated = await users.update(id, {
        displayName: input.displayName,
        roles: input.roles as Role[],
        status: input.status,
        tenantId: input.tenantId,
        emailVerified: input.emailVerified,
      });

      if (!updated) throw AdminErrors.userNotFound(id);
      return toAdminUserDto(updated);
    },

    async deleteUser(id: string, currentAdminUserId?: string): Promise<void> {
      if (!users) throw AdminErrors.userNotFound(id);
      if (currentAdminUserId && currentAdminUserId === id) {
        throw AdminErrors.cannotDeleteSelf();
      }
      const existing = await users.findById(id);
      if (!existing) throw AdminErrors.userNotFound(id);
      const ok = await users.delete(id);
      if (!ok) throw AdminErrors.userNotFound(id);
    },

    async resetUserPassword(id: string, input: AdminResetPasswordRequest): Promise<AdminUserDto> {
      if (!users) throw AdminErrors.userNotFound(id);
      const existing = await users.findById(id);
      if (!existing) throw AdminErrors.userNotFound(id);

      const passwordHash = hasher
        ? await hasher.hash(input.password)
        : sha256Hex(input.password);

      await users.updatePassword(id, passwordHash);
      const refreshed = await users.findById(id);
      if (!refreshed) throw AdminErrors.userNotFound(id);
      return toAdminUserDto(refreshed);
    },
  };
}

export type AdminApi = ReturnType<typeof createAdminApi>;
