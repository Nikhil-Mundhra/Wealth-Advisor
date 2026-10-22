import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { Hono, type MiddlewareHandler } from 'hono';
import { ERROR_CODE_PREFIXES } from '@wealth-advisor/rules';
import { ErrorCatalog } from '#core/errors/error-catalog.ts';
import { createErrorHandler } from '#core/http/error-handler.ts';
import { mountRoutes } from '#core/http/route-builder.ts';
import { SHARING_ERROR_STATUSES } from '../../../src/modules/sharing/presentation/sharing-error-statuses.ts';
import { sharingRoutes } from '../../../src/modules/sharing/presentation/routes/sharing.routes.ts';
import type { SharingApi } from '../../../src/modules/sharing/sharing.api.ts';

const CALLER = { tenantId: '6000000000000000000000bb', userId: '6000000000000000000000aa', roles: ['USER'] };
const CLIENT_ID = '600000000000000000000099';

function buildApp(api: SharingApi, principal = CALLER) {
  const auth: MiddlewareHandler = async (c, next) => {
    c.set('principal', principal);
    await next();
  };
  const app = new Hono();
  app.onError(createErrorHandler(new ErrorCatalog().register(ERROR_CODE_PREFIXES.sharing, SHARING_ERROR_STATUSES)));
  mountRoutes(app, sharingRoutes(api, auth));
  return app;
}

function recordingApi(calls: [string, string, unknown][]) {
  return {
    async createShareLink(tenantId: string, userId: string, body: unknown) {
      calls.push([tenantId, userId, body]);
      return { shareToken: 'dewa_sec_x', url: '/share/dewa_sec_x', expiresAt: '2026-10-10T00:00:00.000Z' };
    },
  } as unknown as SharingApi;
}

const create = (clientId?: string) =>
  ({
    method: 'POST',
    body: JSON.stringify(clientId ? { clientId } : {}),
    headers: { 'content-type': 'application/json' },
  }) as const;

describe('sharing routes', () => {
  it('files a share link under the caller the auth guard resolved', async () => {
    const calls: [string, string, unknown][] = [];
    const response = await buildApp(recordingApi(calls)).request('/create', create());

    assert.equal(response.status, 201);
    assert.deepEqual(calls.map(([tenantId, userId]) => [tenantId, userId]), [[CALLER.tenantId, CALLER.userId]]);
  });

  it('lets an advisor share an assigned client plan', async () => {
    const calls: [string, string, unknown][] = [];
    const advisor = { ...CALLER, roles: ['USER', 'ADVISOR'] };
    const response = await buildApp(recordingApi(calls), advisor).request('/create', create(CLIENT_ID));

    assert.equal(response.status, 201);
    assert.deepEqual(calls.map(([tenantId, userId]) => [tenantId, userId]), [[CALLER.tenantId, CLIENT_ID]]);
  });

  it('refuses a caller without the advisor role sharing another plan', async () => {
    const calls: [string, string, unknown][] = [];
    const response = await buildApp(recordingApi(calls)).request('/create', create(CLIENT_ID));

    assert.equal(response.status, 403);
    assert.equal(((await response.json()) as { code: string }).code, 'SH_1003');
    assert.equal(calls.length, 0);
  });

  it('refuses an unusable client id', async () => {
    const calls: [string, string, unknown][] = [];
    const advisor = { ...CALLER, roles: ['USER', 'ADVISOR'] };
    const response = await buildApp(recordingApi(calls), advisor).request('/create', create('not-an-object-id'));

    assert.equal(response.status, 403);
    assert.equal(calls.length, 0);
  });
});
