import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { Env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { checkDatabase } from '#core/db/connection/database-health.ts';

const config = (overrides: Partial<Env>) => ({ NODE_ENV: 'development', ...overrides }) as Env;

describe('resolveDataStore', () => {
  it('explicit DATA_STORE wins, then the URI, then memory for local runs', () => {
    assert.equal(resolveDataStore(config({ DATA_STORE: 'mongo' })), 'mongo');
    assert.equal(resolveDataStore(config({ MONGODB_URI: 'mongodb://x' })), 'mongo');
    assert.equal(resolveDataStore(config({})), 'memory');
  });

  it('never chooses memory in production', () => {
    assert.equal(resolveDataStore(config({ NODE_ENV: 'production' })), 'mongo');
    assert.throws(() => resolveDataStore(config({ NODE_ENV: 'production', DATA_STORE: 'memory' })), /not allowed in production/);
  });
});

describe('checkDatabase', () => {
  it('reports memory and unconfigured without touching a database', async () => {
    assert.equal(await checkDatabase(config({})), 'memory');
    assert.equal(await checkDatabase(config({ NODE_ENV: 'production' })), 'unconfigured');
  });
});
