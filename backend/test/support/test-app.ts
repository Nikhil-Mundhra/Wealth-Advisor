import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Hono } from 'hono';
import { FakeClock } from './fake-clock.ts';

export interface TestApp {
  readonly app: Hono;
  readonly clock: FakeClock;
  stop(): Promise<void>;
}

// Boots the real app against a throwaway mongod with collections and indexes applied, and a fake clock.
// Env is set before the app modules are imported because env() is read once.
export async function startTestApp(): Promise<TestApp> {
  const mongo = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB_NAME = 'wealth_advisor_test';

  const { createApp } = await import('../../src/app.ts');
  const { InProcessEventBus } = await import('#core/events/event-bus.ts');
  const { ModuleRegistry } = await import('#core/module/module-registry.ts');
  const { applyCollectionDefinitions } = await import('#core/persistence/apply-collection-definitions.ts');
  const { closeMongoClient, getDb } = await import('#core/persistence/mongo-client.ts');
  const { objectIdGenerator } = await import('#core/persistence/object-id-generator.ts');
  const { buildModules } = await import('#modules/index.ts');

  const clock = new FakeClock(new Date());
  const context = { db: getDb, clock, ids: objectIdGenerator, events: new InProcessEventBus() };
  const registry = new ModuleRegistry();
  for (const manifest of buildModules(context)) registry.register(manifest);
  await applyCollectionDefinitions(await getDb(), registry.collections());

  return {
    app: createApp(context),
    clock,
    async stop() {
      await closeMongoClient();
      await mongo.stop();
    },
  };
}

export async function postJson(app: Hono, path: string, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return app.request(path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
