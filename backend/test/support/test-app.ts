import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Hono } from 'hono';
import { FakeClock } from './fake-clock.ts';

export interface TestApp {
  readonly app: Hono;
  readonly clock: FakeClock;
  stop(): Promise<void>;
}

// Boots the real app with a fake clock, on a throwaway mongod (collections and indexes applied) or on the
// in-memory store. Env is set before the app modules are imported because env() is read once.
export async function startTestApp(options: { store?: 'mongo' | 'memory' } = {}): Promise<TestApp> {
  const memory = options.store === 'memory';
  const mongo = memory ? null : await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  if (mongo) process.env.MONGODB_URI = mongo.getUri();
  else process.env.DATA_STORE = 'memory';
  process.env.MONGODB_DB_NAME = 'wealth_advisor_test';

  const { createApp } = await import('../../src/app.ts');
  const { InProcessEventBus } = await import('#core/events/event-bus.ts');
  const { ModuleRegistry } = await import('#core/module/module-registry.ts');
  const { applyCollectionDefinitions } = await import('#core/db/schema/apply-collection-definitions.ts');
  const { closeMongoClient, getDb } = await import('#core/db/connection/mongo-client.ts');
  const { objectIdGenerator } = await import('#core/db/ids/object-id-generator.ts');
  const { buildModules } = await import('#modules/index.ts');

  const clock = new FakeClock(new Date());
  const context = { db: getDb, clock, ids: objectIdGenerator, events: new InProcessEventBus() };
  const registry = new ModuleRegistry();
  for (const manifest of buildModules(context)) registry.register(manifest);
  if (mongo) await applyCollectionDefinitions(await getDb(), registry.collections());

  return {
    app: createApp(context),
    clock,
    async stop() {
      if (!mongo) return;
      await closeMongoClient();
      await mongo.stop();
    },
  };
}

export async function postJson(app: Hono, path: string, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return app.request(path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
