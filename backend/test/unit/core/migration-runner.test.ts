import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BUILTIN_MIGRATIONS,
  createMemoryMigrationStore,
  runMigrations,
} from '#core/db/migrations/migration-runner.ts';

describe('Database migration runner', () => {
  it('applies pending migrations once and skips previously applied versions idempotently', async () => {
    const store = createMemoryMigrationStore();
    const clock = { now: () => new Date('2026-10-06T12:00:00Z') };

    const first = await runMigrations({
      store,
      db: null,
      collections: [],
      clock,
    });
    assert.equal(first.applied.length, BUILTIN_MIGRATIONS.length);
    assert.equal(first.skipped.length, 0);
    assert.equal(first.totalAppliedCount, BUILTIN_MIGRATIONS.length);

    const second = await runMigrations({
      store,
      db: null,
      collections: [],
      clock,
    });
    assert.equal(second.applied.length, 0);
    assert.equal(second.skipped.length, BUILTIN_MIGRATIONS.length);
    assert.equal(second.totalAppliedCount, BUILTIN_MIGRATIONS.length);
  });
});
