import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { missingProductionEnv, type Env } from '#core/config/env.ts';
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

describe('missingProductionEnv', () => {
  it('flags missing required keys only when NODE_ENV is production', () => {
    assert.deepEqual(missingProductionEnv(config({ NODE_ENV: 'development' })), []);
    assert.deepEqual(missingProductionEnv(config({ NODE_ENV: 'production' })), [
      'MONGODB_URI',
      'AUTH_JWT_PRIVATE_KEY',
      'AUTH_JWT_PUBLIC_KEY',
    ]);
    assert.deepEqual(
      missingProductionEnv(
        config({
          NODE_ENV: 'production',
          MONGODB_URI: 'mongodb://localhost/app',
          AUTH_JWT_PRIVATE_KEY: 'priv',
          AUTH_JWT_PUBLIC_KEY: 'pub',
        }),
      ),
      [],
    );
  });
});
