import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { z } from 'zod';
import { errorHandler } from '#core/http/error-handler.ts';
import { RouteBuilder, mountRoutes } from '#core/http/route-builder.ts';

function appWith(handler: () => Promise<unknown>) {
  const app = new Hono();
  app.onError(errorHandler);
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
