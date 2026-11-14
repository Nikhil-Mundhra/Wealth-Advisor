import { env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { closeMongoClient, getDb } from '#core/db/connection/mongo-client.ts';
import {
  createMemoryMigrationStore,
  createMongoMigrationStore,
  runMigrations,
} from '#core/db/migrations/migration-runner.ts';
import { InProcessEventBus } from '#core/events/event-bus.ts';
import { createHttpClient } from '#core/http-client/http-client.ts';
import { ModuleRegistry } from '#core/module/module-registry.ts';
import { objectIdGenerator } from '#core/db/ids/object-id-generator.ts';
import { systemClock } from '#core/time/clock.ts';
import { buildModules } from '#modules/index.ts';

const currentEnv = env();
const storeType = resolveDataStore(currentEnv);
const registry = new ModuleRegistry();
const context = {
  db: getDb,
  clock: systemClock,
  ids: objectIdGenerator,
  events: new InProcessEventBus(),
  http: createHttpClient(),
};

for (const manifest of buildModules(context)) {
  registry.register(manifest);
}

const collections = registry.collections();

if (storeType === 'mongo') {
  const db = await getDb();
  const result = await runMigrations({
    store: createMongoMigrationStore(db),
    db,
    collections,
    clock: systemClock,
  });
  console.log(`[db:migrate] mongo applied=[${result.applied.join(', ')}] skipped=[${result.skipped.join(', ')}]`);
  await closeMongoClient();
} else {
  const result = await runMigrations({
    store: createMemoryMigrationStore(),
    db: null,
    collections,
    clock: systemClock,
  });
  console.log(`[db:migrate] memory dry-run applied=[${result.applied.join(', ')}]`);
}
