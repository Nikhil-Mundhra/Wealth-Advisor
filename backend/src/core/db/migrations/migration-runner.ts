import type { Db } from 'mongodb';
import { sha256Hex } from '#core/crypto/sha256.ts';
import { applyCollectionDefinitions } from '#core/db/schema/apply-collection-definitions.ts';
import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import type { Clock } from '#core/time/clock.ts';
import { systemClock } from '#core/time/clock.ts';
import {
  SCHEMA_MIGRATIONS_COLLECTION,
  type SchemaMigrationDocument,
} from '#core/db/migrations/schema-migrations.schema.ts';

export interface MigrationContext {
  readonly db: Db | null;
  readonly collections: readonly CollectionDefinition[];
  readonly clock: Clock;
}

export interface MigrationDefinition {
  readonly version: string;
  readonly description: string;
  readonly up: (ctx: MigrationContext) => Promise<void>;
}

export interface AppliedMigrationRecord {
  readonly version: string;
  readonly description: string;
  readonly checksum: string;
  readonly appliedAt: Date;
}

export interface MigrationHistoryStore {
  hasVersion(version: string): Promise<boolean>;
  recordApplied(record: AppliedMigrationRecord): Promise<void>;
  listApplied(): Promise<AppliedMigrationRecord[]>;
}

export interface MigrationRunResult {
  readonly applied: string[];
  readonly skipped: string[];
  readonly totalAppliedCount: number;
}

export function createMemoryMigrationStore(): MigrationHistoryStore {
  const records = new Map<string, AppliedMigrationRecord>();
  return {
    async hasVersion(version) {
      return records.has(version);
    },
    async recordApplied(record) {
      records.set(record.version, record);
    },
    async listApplied() {
      return Array.from(records.values()).sort((a, b) => a.version.localeCompare(b.version));
    },
  };
}

export function createMongoMigrationStore(db: Db): MigrationHistoryStore {
  const col = () => db.collection<SchemaMigrationDocument>(SCHEMA_MIGRATIONS_COLLECTION);
  return {
    async hasVersion(version) {
      const found = await col().findOne({ version });
      return Boolean(found);
    },
    async recordApplied(record) {
      await col().updateOne(
        { version: record.version },
        { $setOnInsert: record },
        { upsert: true },
      );
    },
    async listApplied() {
      const docs = await col().find().sort({ version: 1 }).toArray();
      return docs.map((d) => ({
        version: d.version,
        description: d.description,
        checksum: d.checksum,
        appliedAt: d.appliedAt,
      }));
    },
  };
}

export const BUILTIN_MIGRATIONS: readonly MigrationDefinition[] = [
  {
    version: '001_core_and_module_collections',
    description: 'Ensure all core and module collections, JSON schema validators, and indexes exist',
    async up(ctx) {
      if (ctx.db) {
        await applyCollectionDefinitions(ctx.db, ctx.collections);
      }
    },
  },
  {
    version: '002_idempotency_and_external_tx_indexes',
    description: 'Ensure idempotency_keys TTL/scope index and transactions externalId deduplication index',
    async up(ctx) {
      if (ctx.db) {
        const targetCols = ctx.collections.filter(
          (c) => c.name === 'idempotency_keys' || c.name === 'transactions',
        );
        await applyCollectionDefinitions(ctx.db, targetCols);
      }
    },
  },
  {
    version: '003_sandbox_ledger_audit_metadata',
    description: 'Backfill decision, modelVersion, and rulesEvaluated audit defaults on legacy sandbox_ledgers rows',
    async up(ctx) {
      if (ctx.db) {
        await ctx.db.collection('sandbox_ledgers').updateMany(
          { modelVersion: { $exists: false } },
          {
            $set: {
              modelVersion: 'deterministic-engine-v1',
              rulesEvaluated: ['TIER_3_PASSKEY_ASSERTION', 'PERMITTED_REBALANCE_TARGETS'],
              decision: 'APPROVED',
            },
          },
        );
      }
    },
  },
];

export async function runMigrations(options: {
  readonly store: MigrationHistoryStore;
  readonly db: Db | null;
  readonly collections: readonly CollectionDefinition[];
  readonly migrations?: readonly MigrationDefinition[];
  readonly clock?: Clock;
}): Promise<MigrationRunResult> {
  const migrations = options.migrations ?? BUILTIN_MIGRATIONS;
  const clock = options.clock ?? systemClock;
  const ctx: MigrationContext = { db: options.db, collections: options.collections, clock };

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const migration of migrations) {
    if (await options.store.hasVersion(migration.version)) {
      skipped.push(migration.version);
      continue;
    }

    await migration.up(ctx);
    await options.store.recordApplied({
      version: migration.version,
      description: migration.description,
      checksum: sha256Hex(`${migration.version}:${migration.description}`),
      appliedAt: clock.now(),
    });
    applied.push(migration.version);
  }

  const all = await options.store.listApplied();
  return {
    applied,
    skipped,
    totalAppliedCount: all.length,
  };
}
