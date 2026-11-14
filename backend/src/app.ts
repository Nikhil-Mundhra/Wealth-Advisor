import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { CORE_ERROR_CODES } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { resolveDataStore } from '#core/db/connection/data-store.ts';
import { checkDatabase } from '#core/db/connection/database-health.ts';
import { DurableOutboxEventBus, createMemoryOutboxStore, createMongoOutboxStore } from '#core/events/outbox-bus.ts';
import { createHttpClient } from '#core/http-client/http-client.ts';
import { createErrorHandler } from '#core/http/error-handler.ts';
import { createIdempotencyMiddleware } from '#core/http/idempotency.ts';
import type { ModuleContext } from '#core/module/module-context.ts';
import { ModuleRegistry } from '#core/module/module-registry.ts';
import { getDb } from '#core/db/connection/mongo-client.ts';
import { objectIdGenerator } from '#core/db/ids/object-id-generator.ts';
import { correlationMiddleware } from '#core/telemetry/correlation.ts';
import { telemetryLogger } from '#core/telemetry/logger.ts';
import { formatPrometheusMetrics, metricsMiddleware, normalizeRoutePath, setOutboxDepth } from '#core/telemetry/metrics.ts';
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
  api.get('/metrics', async (c) => {
    if (context.events instanceof DurableOutboxEventBus) {
      try {
        const stats = await context.events.stats();
        setOutboxDepth(stats.pending, stats.deadLettered);
      } catch {
        // Keep last observed gauge values if backing store is unreachable.
      }
    }
    return c.text(formatPrometheusMetrics(), 200, {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    });
  });
  // Forward /ai to advisory copilot chat through the gateway. The caller's token travels with it, so the copilot
  // answers for the scope the token carries rather than for the demo account.
  api.post('/ai', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const message = body.message ?? 'Analyze my portfolio and cross-border cashflow';
    const locale = body.locale ?? 'en';
    const householdMode = body.householdMode ?? 'FAMILY_HOUSEHOLD';
    const authorization = c.req.header('authorization');
    const res = await api.request('/advisory/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify({ message, locale, householdMode }),
    });
    return c.json(await res.json(), res.status as ContentfulStatusCode);
  });
  registry.mount(api);
  // Unmatched /api/* gets the error contract instead of falling through to the SPA.
  api.all('*', (c) => c.json({ code: CORE_ERROR_CODES.notFound, message: 'not found' }, 404));

  const app = new Hono();
  app.use('*', correlationMiddleware());
  app.use('*', metricsMiddleware());
  if (process.env.NODE_ENV !== 'test') {
    app.use('*', async (c, next) => {
      const start = performance.now();
      await next();
      telemetryLogger.info('http.request', {
        method: c.req.method,
        route: normalizeRoutePath(c.req.path),
        status: c.res.status,
        durationMs: Number((performance.now() - start).toFixed(2)),
      });
    });
  }
  app.use(
    '*',
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
    }),
  );
  app.use(
    '/api/*',
    cors({
      origin: (origin) => origin || '*',
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Correlation-Id'],
      exposeHeaders: ['X-Idempotent-Replay', 'X-Correlation-Id'],
      credentials: true,
    }),
  );
  app.use('/api/*', createIdempotencyMiddleware({ clock: context.clock }));
  app.onError(errorHandler);
  app.route('/api', api);
  return app;
}

// Vercel entrypoint: Vercel imports this default export and runs it as a function.
// Local Node runs it through node-server.ts instead.
const defaultOutboxStore =
  resolveDataStore(env()) === 'mongo' ? createMongoOutboxStore(getDb) : createMemoryOutboxStore();

const app = createApp({
  db: getDb,
  clock: systemClock,
  ids: objectIdGenerator,
  events: new DurableOutboxEventBus({ store: defaultOutboxStore, clock: systemClock }),
  http: createHttpClient(),
});

export default app;
