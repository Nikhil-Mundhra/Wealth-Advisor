import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { z } from 'zod';
import { ErrorCatalog } from '#core/errors/error-catalog.ts';
import { createErrorHandler } from '#core/http/error-handler.ts';
import { RouteBuilder, mountRoutes } from '#core/http/route-builder.ts';

function appWith(handler: () => Promise<unknown>) {
  const app = new Hono();
  app.onError(createErrorHandler(new ErrorCatalog()));
  mountRoutes(app, [RouteBuilder.get('/x').responds(z.object({ ok: z.boolean() })).handle(handler as () => Promise<{ ok: boolean }>)]);
  return app;
}

describe('RouteBuilder responses', () => {
  it('sends a response that matches its contract', async () => {
    const response = await appWith(async () => ({ ok: true })).request('/x');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });

  it('turns a response that breaks its contract into a 500, not a client error', async () => {
    const response = await appWith(async () => ({ ok: 'yes' })).request('/x');
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { code: 'CORE_INTERNAL', message: 'internal error' });
  });
});

describe('RouteBuilder query', () => {
  const Query = z.object({ base: z.enum(['EUR', 'USD'], { error: 'currency.invalid' }), limit: z.coerce.number().int().optional() });
  const app = new Hono();
  app.onError(createErrorHandler(new ErrorCatalog()));
  mountRoutes(app, [
    RouteBuilder.get('/q')
      .query(Query)
      .responds(z.object({ base: z.string(), limit: z.number().nullable() }))
      .handle(async ({ query }) => ({ base: query.base, limit: query.limit ?? null })),
  ]);

  it('hands the handler the parsed query', async () => {
    const response = await app.request('/q?base=USD&limit=3');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { base: 'USD', limit: 3 });
  });

  it('rejects a missing or invalid parameter with the same 400 as a body, naming each field', async () => {
    for (const path of ['/q', '/q?base=XXX']) {
      const response = await app.request(path);
      assert.equal(response.status, 400);
      const body = (await response.json()) as { code: string; issues: unknown };
      assert.equal(body.code, 'CORE_VALIDATION_FAILED');
      assert.deepEqual(body.issues, [{ path: ['base'], code: 'currency.invalid' }]);
    }
  });
});
