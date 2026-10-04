import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';
import { InProcessEventBus } from '#core/events/event-bus.ts';
import { createErrorHandler } from '#core/http/error-handler.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import { ModuleRegistry } from '#core/module/module-registry.ts';
import { getDb } from '#core/persistence/mongo-client.ts';
import { objectIdGenerator } from '#core/persistence/object-id-generator.ts';
import { systemClock } from '#core/time/clock.ts';
import { buildModules } from '#modules/index.ts';

// Builds the HTTP app from the registered modules. Tests call this with fake dependencies.
export function createApp(context: ModuleContext): Hono {
  const registry = new ModuleRegistry();
  for (const manifest of buildModules(context)) registry.register(manifest);
  registry.subscribe(context.events);
  const errorHandler = createErrorHandler(registry.errorCatalog());

  const api = new Hono();
  api.onError(errorHandler);
  api.get('/health', (c) => c.json({ status: 'ok' }));
  // Placeholder until an AI feature exists.
  api.all('/ai', (c) => c.json({ message: 'oops no ai yet bitch' }, 501));
  registry.mount(api);
  // Unmatched /api/* gets the error contract instead of falling through to the SPA.
  api.all('*', (c) => c.json({ code: CORE_ERROR_CODES.notFound, message: 'not found' }, 404));

  const app = new Hono();
  app.use(logger());
  app.onError(errorHandler);
  app.route('/api', api);
  return app;
}

// Vercel entrypoint: Vercel imports this default export and runs it as a function.
// Local Node runs it through node-server.ts instead.
const app = createApp({ db: getDb, clock: systemClock, ids: objectIdGenerator, events: new InProcessEventBus() });

export default app;
