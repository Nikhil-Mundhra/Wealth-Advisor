import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { type TestApp, postJson, startTestApp } from '../../support/test-app.ts';

const json = async (response: Response) => (await response.json()) as Record<string, unknown>;
const PASSWORD = 'correct-horse-battery';
const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

// GET /portfolio?clientId= must not leak another user's holdings: only the owner or an
// advisor/admin role reads across user IDs; everyone else (including anonymous callers on the
// demo scope) gets 404 so user IDs are not enumerable.
describe('wealth portfolio access', () => {
  let app: TestApp;
  let aliceToken = '';
  let bobUserId = '';

  before(async () => {
    app = await startTestApp({ store: 'memory' });
    await postJson(app.app, '/api/auth/signup', { email: 'alice@example.com', password: PASSWORD });
    bobUserId = String((await json(await postJson(app.app, '/api/auth/signup', { email: 'bob@example.com', password: PASSWORD }))).userId);
    const login = await json(await postJson(app.app, '/api/auth/login', { email: 'alice@example.com', password: PASSWORD, clientType: 'IOS' }));
    aliceToken = String(login.accessToken);
  });
  after(async () => {
    await app.stop();
  });

  it('serves the demo portfolio to an anonymous caller without a clientId', async () => {
    const response = await app.app.request('/api/wealth/portfolio');
    assert.equal(response.status, 200);
  });

  it('returns 404 when a client reads another portfolio', async () => {
    const response = await app.app.request(`/api/wealth/portfolio?clientId=${bobUserId}`, { headers: bearer(aliceToken) });
    assert.equal(response.status, 404);
    assert.equal((await json(response)).code, 'WL_1001');
  });

  it('returns 404 for an anonymous cross-user read on the demo scope', async () => {
    const response = await app.app.request(`/api/wealth/portfolio?clientId=${bobUserId}`);
    assert.equal(response.status, 404);
    assert.equal((await json(response)).code, 'WL_1001');
  });

  it('returns 404 when a client optimizes another portfolio', async () => {
    const response = await postJson(app.app, `/api/wealth/optimize?clientId=${bobUserId}`, {}, bearer(aliceToken));
    assert.equal(response.status, 404);
    assert.equal((await json(response)).code, 'WL_1001');
  });
});
