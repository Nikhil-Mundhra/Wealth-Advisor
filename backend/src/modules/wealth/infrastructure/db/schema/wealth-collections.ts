import { DEFAULT_ENGINE_MODEL_VERSION, DEFAULT_SANDBOX_RULES_EVALUATED } from '@wealth-advisor/rules';
import type { MigrationDefinition } from '#core/db/migrations/migration-runner.ts';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { ASSET_PRODUCTS_COLLECTION } from '../documents/asset-product.document.ts';
import { PORTFOLIOS_COLLECTION } from '../documents/portfolio.document.ts';
import { RISK_PROFILES_COLLECTION } from '../documents/risk-profile.document.ts';
import { SANDBOX_LEDGERS_COLLECTION } from '../documents/sandbox-ledger.document.ts';

export const wealthCollections: readonly CollectionDefinition[] = [
  {
    name: ASSET_PRODUCTS_COLLECTION,
    indexes: [{ key: { symbol: 1 }, name: 'uk_asset_products_symbol', unique: true }],
  },
  {
    name: PORTFOLIOS_COLLECTION,
    indexes: [{ key: { tenantId: 1, userId: 1 }, name: 'uk_portfolios_tenant_user', unique: true }],
  },
  {
    name: RISK_PROFILES_COLLECTION,
    indexes: [{ key: { tenantId: 1, userId: 1 }, name: 'uk_risk_profiles_tenant_user', unique: true }],
  },
  {
    name: SANDBOX_LEDGERS_COLLECTION,
    indexes: [
      { key: { tenantId: 1, userId: 1, timestamp: -1 }, name: 'idx_sandbox_ledgers_scope_time' },
      { key: { auditDigest: 1 }, name: 'uk_sandbox_ledgers_digest', unique: true },
      { key: { transactionHash: 1 }, name: 'uk_sandbox_ledgers_txhash', unique: true },
    ],
  },
];

export const wealthMigrations: readonly MigrationDefinition[] = [
  {
    version: '003_sandbox_ledger_audit_metadata',
    description: 'Backfill decision, modelVersion, and rulesEvaluated audit defaults on legacy sandbox_ledgers rows',
    async up(ctx) {
      if (ctx.db) {
        await ctx.db.collection(SANDBOX_LEDGERS_COLLECTION).updateMany(
          { modelVersion: { $exists: false } },
          {
            $set: {
              modelVersion: DEFAULT_ENGINE_MODEL_VERSION,
              rulesEvaluated: [...DEFAULT_SANDBOX_RULES_EVALUATED],
              decision: 'APPROVED',
            },
          },
        );
      }
    },
  },
];
