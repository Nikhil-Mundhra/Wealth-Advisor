import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { Hono, type MiddlewareHandler } from 'hono';
import { ErrorCatalog } from '#core/errors/error-catalog.ts';
import { createErrorHandler } from '#core/http/error-handler.ts';
import { mountRoutes } from '#core/http/route-builder.ts';
import { sharingRoutes } from '../../../src/modules/sharing/presentation/routes/sharing.routes.ts';
import type { SharingApi } from '../../../src/modules/sharing/sharing.api.ts';

const CALLER = { tenantId: '6000000000000000000000bb', userId: '6000000000000000000000aa', roles: ['USER'] };

describe('sharing routes', () => {
  it('files a share link under the caller the auth guard resolved', async () => {
    const calls: [string, string][] = [];
    const api = {
      async createShareLink(tenantId: string, userId: string) {
        calls.push([tenantId, userId]);
        return { shareToken: 'dewa_sec_x', url: '/share/dewa_sec_x', expiresAt: '2026-10-10T00:00:00.000Z' };
      },
    } as unknown as SharingApi;
    const auth: MiddlewareHandler = async (c, next) => {
      c.set('principal', CALLER);
      await next();
    };
    const app = new Hono();
    app.onError(createErrorHandler(new ErrorCatalog()));
    mountRoutes(app, sharingRoutes(api, auth));

    const response = await app.request('/create', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } });

    assert.equal(response.status, 201);
    assert.deepEqual(calls, [[CALLER.tenantId, CALLER.userId]]);
  });
});
