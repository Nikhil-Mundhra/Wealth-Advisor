import { InProcessEventBus } from '#core/events/event-bus.ts';
import { ModuleRegistry } from '#core/module/module-registry.ts';
import { applyCollectionDefinitions } from '#core/persistence/apply-collection-definitions.ts';
import { closeMongoClient, getDb } from '#core/persistence/mongo-client.ts';
import { objectIdGenerator } from '#core/persistence/object-id-generator.ts';
import { systemClock } from '#core/time/clock.ts';
import { buildModules } from '#modules/index.ts';

// Deploy step: creates collections, validators and indexes declared by every registered module.
const registry = new ModuleRegistry();
for (const manifest of buildModules({ db: getDb, clock: systemClock, ids: objectIdGenerator, events: new InProcessEventBus() })) {
  registry.register(manifest);
}
const definitions = registry.collections();
await applyCollectionDefinitions(await getDb(), definitions);
console.log(`applied ${definitions.length} collection definitions: ${definitions.map((d) => d.name).join(', ')}`);
await closeMongoClient();
