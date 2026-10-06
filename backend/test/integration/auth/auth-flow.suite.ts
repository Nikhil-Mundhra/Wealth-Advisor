import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { type TestApp, postJson } from '../../support/test-app.ts';

const EMAIL = 'june@example.com';
const PASSWORD = 'correct-horse-battery';

// The auth flow end to end; each runner file supplies the store it boots.
export function runAuthFlowSuite(start: () => Promise<TestApp>): void {
  let t: TestApp;
  before(async () => {
    t = await start();
  });
  after(async () => {
    await t.stop();
  });

  const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
  const json = async (response: Response) => (await response.json()) as Record<string, unknown>;

  describe('signup', () => {
    it('creates an account and rejects a duplicate email', async () => {
      const created = await postJson(t.app, '/api/auth/signup', { email: EMAIL, password: PASSWORD, displayName: 'June' });
      assert.equal(created.status, 201);
      assert.match(String((await json(created)).userId), /^[0-9a-f]{24}$/);

      const duplicate = await postJson(t.app, '/api/auth/signup', { email: 'JUNE@example.com', password: PASSWORD });
      assert.equal(duplicate.status, 409);
      assert.equal((await json(duplicate)).code, 'AU_1001');
    });

    it('lets the unique index decide when two signups race', async () => {
      const body = { email: 'race@example.com', password: PASSWORD };
      const statuses = (await Promise.all([postJson(t.app, '/api/auth/signup', body), postJson(t.app, '/api/auth/signup', body)]))
        .map((response) => response.status)
        .sort();
      assert.deepEqual(statuses, [201, 409]);
    });

    it('rejects an invalid body against the contract', async () => {
      const response = await postJson(t.app, '/api/auth/signup', { email: 'nope', password: 'short' });
      assert.equal(response.status, 400);
      const body = await json(response);
      assert.equal(body.code, 'CORE_VALIDATION_FAILED');
      assert.deepEqual(body.issues, [
        { path: ['email'], code: 'email.invalid' },
        { path: ['password'], code: 'password.too_short' },
      ]);
    });
  });

  describe('login', () => {
    it('returns the same 401 for a wrong password and an unknown email', async () => {
      const wrongPassword = await postJson(t.app, '/api/auth/login', { email: EMAIL, password: 'wrong-password' });
      const unknownEmail = await postJson(t.app, '/api/auth/login', { email: 'ghost@example.com', password: PASSWORD });
      assert.equal(wrongPassword.status, 401);
      assert.equal(unknownEmail.status, 401);
      assert.deepEqual(await json(wrongPassword), await json(unknownEmail));
    });

    it('web: refresh token only in an HttpOnly cookie scoped to /api/auth', async () => {
      const response = await postJson(t.app, '/api/auth/login', { email: EMAIL, password: PASSWORD, clientType: 'WEB', rememberMe: true });
      assert.equal(response.status, 200);
      const body = await json(response);
      assert.equal(body.refreshToken, undefined);
      assert.equal(body.expiresIn, 900);
      const cookie = response.headers.get('set-cookie') ?? '';
      assert.match(cookie, /^refresh_token=/);
      assert.match(cookie, /HttpOnly/);
      assert.match(cookie, /Secure/);
      assert.match(cookie, /SameSite=Lax/);
      assert.match(cookie, /Path=\/api\/auth/);
      assert.match(cookie, /Expires=/);
    });

    it('access token has the expected claim set and opens /me', async () => {
      const login = await json(await postJson(t.app, '/api/auth/login', { email: EMAIL, password: PASSWORD, clientType: 'IOS' }));
      const [header, payload] = String(login.accessToken)
        .split('.')
        .slice(0, 2)
        .map((part) => JSON.parse(Buffer.from(part, 'base64url').toString()));
      assert.equal(header.alg, 'EdDSA');
      assert.deepEqual(Object.keys(payload).sort(), ['aud', 'exp', 'iat', 'iss', 'jti', 'roles', 'sub', 'token_use']);
      assert.equal(payload.exp - payload.iat, 900);

      const me = await t.app.request('/api/auth/me', { headers: bearer(String(login.accessToken)) });
      assert.equal(me.status, 200);
      const profile = await json(me);
      assert.equal(profile.email, EMAIL);
      assert.deepEqual(profile.roles, ['USER']);

      const anonymous = await t.app.request('/api/auth/me');
      assert.equal(anonymous.status, 401);
      assert.equal((await json(anonymous)).code, 'AU_1005');
    });
  });

  describe('refresh rotation', () => {
    it('rotates, treats an in-grace reuse as a retry, and revokes the family on a late reuse', async () => {
      const login = await json(await postJson(t.app, '/api/auth/login', { email: EMAIL, password: PASSWORD, clientType: 'ANDROID' }));
      const original = String(login.refreshToken);

      const rotated = await postJson(t.app, '/api/auth/refresh', { refreshToken: original });
      assert.equal(rotated.status, 200);
      const child = String((await json(rotated)).refreshToken);
      assert.notEqual(child, original);

      const retry = await postJson(t.app, '/api/auth/refresh', { refreshToken: original });
      assert.equal(retry.status, 409);
      assert.equal((await json(retry)).code, 'AU_1004');

      t.clock.advanceSeconds(6);
      const reuse = await postJson(t.app, '/api/auth/refresh', { refreshToken: original });
      assert.equal(reuse.status, 401);
      assert.equal((await json(reuse)).code, 'AU_1003');

      const childAfterTheft = await postJson(t.app, '/api/auth/refresh', { refreshToken: child });
      assert.equal(childAfterTheft.status, 401, 'reuse detection must revoke the whole family');
    });

    it('web: rotates through the cookie', async () => {
      const login = await postJson(t.app, '/api/auth/login', { email: EMAIL, password: PASSWORD, clientType: 'WEB' });
      const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
      const refreshed = await t.app.request('/api/auth/refresh', { method: 'POST', headers: { cookie } });
      assert.equal(refreshed.status, 200);
      assert.match(refreshed.headers.get('set-cookie') ?? '', /^refresh_token=/);
    });

    it('rejects a malformed refresh token before touching the database', async () => {
      const response = await postJson(t.app, '/api/auth/refresh', { refreshToken: 'not-a-token' });
      assert.equal(response.status, 400);
      assert.deepEqual((await json(response)).issues, [{ path: ['refreshToken'], code: 'refresh_token.invalid' }]);
    });

    it('rejects an expired refresh token', async () => {
      const login = await json(await postJson(t.app, '/api/auth/login', { email: EMAIL, password: PASSWORD, clientType: 'IOS' }));
      t.clock.advanceSeconds(14 * 24 * 60 * 60 + 1);
      const response = await postJson(t.app, '/api/auth/refresh', { refreshToken: String(login.refreshToken) });
      assert.equal(response.status, 401);
    });
  });

  describe('logout', () => {
    it('revokes one session, then logout-all revokes the rest', async () => {
      const first = await json(await postJson(t.app, '/api/auth/login', { email: EMAIL, password: PASSWORD, clientType: 'IOS' }));
      const second = await json(await postJson(t.app, '/api/auth/login', { email: EMAIL, password: PASSWORD, clientType: 'IOS' }));
      const auth = bearer(String(first.accessToken));

      const logout = await postJson(t.app, '/api/auth/logout', { refreshToken: first.refreshToken }, auth);
      assert.equal(logout.status, 204);
      assert.equal((await postJson(t.app, '/api/auth/refresh', { refreshToken: first.refreshToken })).status, 401);
      assert.equal((await postJson(t.app, '/api/auth/refresh', { refreshToken: second.refreshToken })).status, 200);

      const third = await json(await postJson(t.app, '/api/auth/login', { email: EMAIL, password: PASSWORD, clientType: 'IOS' }));
      const logoutAll = await postJson(t.app, '/api/auth/logout-all', {}, auth);
      assert.equal(logoutAll.status, 204);
      assert.equal((await postJson(t.app, '/api/auth/refresh', { refreshToken: third.refreshToken })).status, 401);
    });
  });

  describe('delete account', () => {
    it('deletes user record and sessions, clears cookie, and prevents subsequent authenticated access', async () => {
      const email = 'wipeout@example.com';
      await postJson(t.app, '/api/auth/signup', { email, password: PASSWORD, displayName: 'Wipeout' });
      const login = await postJson(t.app, '/api/auth/login', { email, password: PASSWORD, clientType: 'WEB' });
      assert.equal(login.status, 200);
      const loginBody = await json(login);
      const auth = bearer(String(loginBody.accessToken));
      const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0] ?? '';

      const deleteRes = await t.app.request('/api/auth/me', { method: 'DELETE', headers: { ...auth, cookie } });
      assert.equal(deleteRes.status, 204);
      const clearedCookie = deleteRes.headers.get('set-cookie') ?? '';
      assert.match(clearedCookie, /refresh_token=;/);

      // /me is no longer accessible
      const meAfter = await t.app.request('/api/auth/me', { headers: auth });
      assert.equal(meAfter.status, 401);

      // Session refresh fails
      const refreshAfter = await t.app.request('/api/auth/refresh', { method: 'POST', headers: { cookie } });
      assert.equal(refreshAfter.status, 401);

      // Login fails because user is deleted
      const loginAfter = await postJson(t.app, '/api/auth/login', { email, password: PASSWORD });
      assert.equal(loginAfter.status, 401);
    });
  });
}
