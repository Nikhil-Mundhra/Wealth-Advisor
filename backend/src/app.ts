import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { checkDatabase } from '#core/db/connection/database-health.ts';
import { InProcessEventBus } from '#core/events/event-bus.ts';
import { createHttpClient } from '#core/http-client/http-client.ts';
import { createErrorHandler } from '#core/http/error-handler.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import { ModuleRegistry } from '#core/module/module-registry.ts';
import { getDb } from '#core/db/connection/mongo-client.ts';
import { objectIdGenerator } from '#core/db/ids/object-id-generator.ts';
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
  api.get('/health', async (c) => c.json({ status: 'ok', database: await checkDatabase(env()) }));
  // Forward /ai to advisory copilot chat through the gateway
  api.post('/ai', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const message = body.message ?? 'Analyze my portfolio and cross-border cashflow';
    const locale = body.locale ?? 'en';
    const householdMode = body.householdMode ?? 'FAMILY_HOUSEHOLD';
    const res = await api.request('/advisory/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, locale, householdMode }),
    });
    return c.json(await res.json(), res.status as any);
  });
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
const app = createApp({
  db: getDb,
  clock: systemClock,
  ids: objectIdGenerator,
  events: new InProcessEventBus(),
  http: createHttpClient(),
});

export default app;
