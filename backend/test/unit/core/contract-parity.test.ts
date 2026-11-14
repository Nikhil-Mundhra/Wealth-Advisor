import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  ClientTypeField,
  CurrencyField,
  HouseholdModeField,
  IsoDateField,
  TenantDto,
  ApiKeyDto,
} from '@wealth-advisor/contracts';
import {
  ADMIN_ERROR_CODES,
  ADVISORY_ERROR_CODES,
  ANALYTICS_ERROR_CODES,
  API_KEY_PERMISSIONS,
  AUTH_ERROR_CODES,
  CLIENT_TYPES,
  CURRENCIES,
  ERROR_CODE_PREFIXES,
  FINANCE_ERROR_CODES,
  HOUSEHOLD_MODES,
  MARKET_ERROR_CODES,
  SHARING_ERROR_CODES,
  TENANT_PLANS,
  TENANT_STATUSES,
  VALIDATION_KEYS,
  WEALTH_ERROR_CODES,
} from '@wealth-advisor/rules';
import { InProcessEventBus } from '#core/events/event-bus.ts';
import { createHttpClient } from '#core/http-client/http-client.ts';
import { ModuleRegistry } from '#core/module/module-registry.ts';
import { buildModules } from '#modules/index.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../');

describe('L2 Cross-Workspace Schema & Contract Parity', () => {
  it('every module error code in rules maps to a valid HTTP status in the built ModuleRegistry catalog', () => {
    process.env.DATA_STORE = 'memory';
    const registry = new ModuleRegistry();
    const context = {
      db: async () => {
        throw new Error('memory store only');
      },
      clock: { now: () => new Date('2026-10-06T12:00:00Z') },
      ids: { next: () => '507f1f77bcf86cd799439011' },
      events: new InProcessEventBus(),
      http: createHttpClient(),
    };
    const manifests = buildModules(context);
    for (const manifest of manifests) registry.register(manifest);
    const catalog = registry.errorCatalog();

    const groups: ReadonlyArray<{ prefix: string; codes: Record<string, string> }> = [
      { prefix: ERROR_CODE_PREFIXES.auth, codes: AUTH_ERROR_CODES },
      { prefix: ERROR_CODE_PREFIXES.market, codes: MARKET_ERROR_CODES },
      { prefix: ERROR_CODE_PREFIXES.analytics, codes: ANALYTICS_ERROR_CODES },
      { prefix: ERROR_CODE_PREFIXES.admin, codes: ADMIN_ERROR_CODES },
      { prefix: ERROR_CODE_PREFIXES.finance, codes: FINANCE_ERROR_CODES },
      { prefix: ERROR_CODE_PREFIXES.wealth, codes: WEALTH_ERROR_CODES },
      { prefix: ERROR_CODE_PREFIXES.advisory, codes: ADVISORY_ERROR_CODES },
      { prefix: ERROR_CODE_PREFIXES.sharing, codes: SHARING_ERROR_CODES },
    ];

    for (const { prefix, codes } of groups) {
      for (const code of Object.values(codes)) {
        assert.ok(code.startsWith(`${prefix}_`), `code ${code} lacks prefix ${prefix}_`);
        const status = catalog.statusOf(code);
        assert.ok(status >= 400 && status <= 599, `code ${code} mapped to non-error status ${status}`);
      }
    }
  });

  it('every validation key in @wealth-advisor/rules has a corresponding message in frontend validation-messages.ts', () => {
    const messagesSource = readFileSync(
      resolve(ROOT, 'frontend/src/lib/validation/validation-messages.ts'),
      'utf8',
    );
    for (const key of Object.values(VALIDATION_KEYS)) {
      assert.ok(
        messagesSource.includes(`'${key}':`),
        `validation key "${key}" missing from frontend/src/lib/validation/validation-messages.ts`,
      );
    }
  });

  it('Zod field contracts in @wealth-advisor/contracts accept every rule enum member and reject invalid inputs with rule validation keys', () => {
    for (const currency of CURRENCIES) {
      assert.equal(CurrencyField.safeParse(currency).success, true, `CurrencyField rejected ${currency}`);
    }
    const badCurrency = CurrencyField.safeParse('XXX');
    assert.equal(badCurrency.success, false);
    if (!badCurrency.success) {
      assert.equal(badCurrency.error.issues[0]?.message, VALIDATION_KEYS.currencyInvalid);
    }

    for (const mode of HOUSEHOLD_MODES) {
      assert.equal(HouseholdModeField.safeParse(mode).success, true, `HouseholdModeField rejected ${mode}`);
    }
    const badMode = HouseholdModeField.safeParse('INVALID_MODE');
    assert.equal(badMode.success, false);
    if (!badMode.success) {
      assert.equal(badMode.error.issues[0]?.message, VALIDATION_KEYS.householdModeInvalid);
    }

    for (const clientType of CLIENT_TYPES) {
      assert.equal(ClientTypeField.safeParse(clientType).success, true, `ClientTypeField rejected ${clientType}`);
    }

    assert.equal(IsoDateField.safeParse('2026-10-06').success, true);
    const badDate = IsoDateField.safeParse('2026-02-31');
    assert.equal(badDate.success, false);
    if (!badDate.success) {
      assert.equal(badDate.error.issues[0]?.message, VALIDATION_KEYS.dateInvalid);
    }

    for (const plan of TENANT_PLANS) {
      for (const status of TENANT_STATUSES) {
        const parsed = TenantDto.safeParse({
          id: 't1',
          slug: 'demo',
          name: 'Demo',
          plan,
          status,
          settings: {},
          createdAt: '2026-10-06T00:00:00.000Z',
          updatedAt: '2026-10-06T00:00:00.000Z',
        });
        assert.equal(parsed.success, true, `TenantDto rejected (${plan}, ${status})`);
      }
    }

    const keyParsed = ApiKeyDto.safeParse({
      id: 'k1',
      tenantId: 't1',
      name: 'CI Parity Key',
      keyPrefix: 'dewa_live_abcd',
      permissions: [...API_KEY_PERMISSIONS],
      rateLimitPerMinute: 60,
      monthlyTokenQuota: 100000,
      usedTokensThisMonth: 0,
      status: 'ACTIVE',
      lastUsedAt: null,
      expiresAt: null,
      createdAt: '2026-10-06T00:00:00.000Z',
    });
    assert.equal(keyParsed.success, true, 'ApiKeyDto rejected full API_KEY_PERMISSIONS list');
  });

  it('every registered MongoDB collection declares a valid name and at least one index or JSON schema validator', () => {
    process.env.DATA_STORE = 'memory';
    const registry = new ModuleRegistry();
    const context = {
      db: async () => {
        throw new Error('memory store only');
      },
      clock: { now: () => new Date('2026-10-06T12:00:00Z') },
      ids: { next: () => '507f1f77bcf86cd799439011' },
      events: new InProcessEventBus(),
      http: createHttpClient(),
    };
    for (const manifest of buildModules(context)) registry.register(manifest);
    const collections = registry.collections();
    assert.ok(collections.length >= 15, `expected >= 15 collections, got ${collections.length}`);

    for (const col of collections) {
      assert.ok(col.name.length > 0, 'collection missing name');
      const hasIndexes = Array.isArray(col.indexes) && col.indexes.length > 0;
      const hasValidator = Boolean(col.validator);
      assert.ok(hasIndexes || hasValidator, `collection "${col.name}" has neither indexes nor validator`);
    }
  });
});
