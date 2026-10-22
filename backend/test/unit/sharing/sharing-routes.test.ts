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

import { InMemoryRateLimiter } from '../../../src/modules/sharing/presentation/sharing-rate-limiter.ts';

const CALLER = { tenantId: '6000000000000000000000bb', userId: '6000000000000000000000aa', roles: ['USER'] };
const CLIENT_ID = '600000000000000000000099';

function buildApp(api: SharingApi, principal = CALLER, rateLimiter = new InMemoryRateLimiter()) {
  const auth: MiddlewareHandler = async (c, next) => {
    c.set('principal', principal);
    await next();
  };
  const app = new Hono();
  app.onError(createErrorHandler(new ErrorCatalog().register(ERROR_CODE_PREFIXES.sharing, SHARING_ERROR_STATUSES)));
  mountRoutes(app, sharingRoutes(api, auth, rateLimiter));
  return app;
}

function recordingApi(calls: [string, string, unknown][]) {
  return {
    async createShareLink(tenantId: string, userId: string, body: unknown) {
      calls.push([tenantId, userId, body]);
      return { shareToken: 'dewa_sec_x', url: '/share/dewa_sec_x', expiresAt: '2026-10-10T00:00:00.000Z' };
    },
    async listSharedPlans(tenantId: string, userId: string, options?: { clientId?: string; isAdvisorOrAdmin?: boolean }) {
      calls.push([tenantId, userId, options]);
      return {
        plans: [
          {
            shareToken: 'dewa_sec_x',
            ownerDisplayName: 'Elena',
            privacyMasked: true,
            expiresAt: '2026-10-10T00:00:00.000Z',
            createdAt: '2026-10-07T00:00:00.000Z',
            revokedAt: null,
          },
        ],
      };
    },
    async revokeShareLink(tenantId: string, userId: string, shareToken: string, options?: { isAdvisorOrAdmin?: boolean }) {
      calls.push([tenantId, userId, { shareToken, ...options }]);
      return { revoked: true, shareToken };
    },
    async getSharedPlan(token: string) {
      return {
        shareToken: token,
        ownerDisplayName: 'Elena',
        privacyMasked: true,
        planSnapshot: {
          recommendedWeights: {},
          currentWeights: {},
          threePillarRationale: { personalFinance: '', crossBorder: '', wealthStrategy: '' },
          stressTestScenario: null,
        },
        expiresAt: '2026-10-10T00:00:00.000Z',
        createdAt: '2026-10-07T00:00:00.000Z',
      };
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

  it('lists shared links for the caller', async () => {
    const calls: [string, string, unknown][] = [];
    const response = await buildApp(recordingApi(calls)).request('/links');

    assert.equal(response.status, 200);
    const body = (await response.json()) as { plans: unknown[] };
    assert.equal(body.plans.length, 1);
    assert.equal(calls.length, 1);
  });

  it('revokes a shared link via DELETE /:token', async () => {
    const calls: [string, string, unknown][] = [];
    const response = await buildApp(recordingApi(calls)).request('/dewa_sec_test', { method: 'DELETE' });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { revoked: boolean; shareToken: string };
    assert.equal(body.revoked, true);
    assert.equal(body.shareToken, 'dewa_sec_test');
    assert.equal(calls.length, 1);
  });

  it('applies rate limiting on public GET /:token and answers 429 when threshold exceeded', async () => {
    const calls: [string, string, unknown][] = [];
    // Rate limiter configured with limit of 2 requests
    const limiter = new InMemoryRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const app = buildApp(recordingApi(calls), CALLER, limiter);

    const res1 = await app.request('/dewa_sec_test', { headers: { 'x-forwarded-for': '198.51.100.1' } });
    assert.equal(res1.status, 200);

    const res2 = await app.request('/dewa_sec_test', { headers: { 'x-forwarded-for': '198.51.100.1' } });
    assert.equal(res2.status, 200);

    // 3rd request from same IP is rate limited
    const res3 = await app.request('/dewa_sec_test', { headers: { 'x-forwarded-for': '198.51.100.1' } });
    assert.equal(res3.status, 429);
    assert.ok(res3.headers.get('Retry-After'));
    const body = (await res3.json()) as { code: string };
    assert.equal(body.code, 'SH_1004');

    // Request from different IP succeeds
    const resOther = await app.request('/dewa_sec_test', { headers: { 'x-forwarded-for': '198.51.100.2' } });
    assert.equal(resOther.status, 200);
  });
});
