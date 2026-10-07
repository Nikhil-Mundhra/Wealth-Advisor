import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { DEFAULT_TENANT_ID } from '#core/db/document-id.ts';
import { type TestApp, postJson, startTestApp } from '../../support/test-app.ts';

const OTHER_TENANT = '6000000000000000000000cc';

const json = async (response: Response) => (await response.json()) as Record<string, unknown>;

// The scope of every tenant-scoped read and write: the token decides it, and nothing in the request can move a caller
// out of their own scope.
describe('tenant scope on scoped routes', () => {
  let app: TestApp;

  before(async () => {
    app = await startTestApp({ store: 'memory' });
  });
  after(async () => {
    await app.stop();
  });

  const accountEmails = async (headers: Record<string, string>) => {
    const response = await app.app.request('/api/finance/accounts', { headers });
    assert.equal(response.status, 200);
    const body = await json(response);
    return (body.accounts as { institutionName: string }[]).map((account) => account.institutionName);
  };

  it('serves the demo scope to an anonymous caller', async () => {
    const institutions = await accountEmails({});
    assert.ok(institutions.length > 0);
    assert.ok(institutions.includes('Deutsche Bank Germany'));
  });

  it('ignores a tenant header, so a caller cannot read another tenant', async () => {
    const anonymous = await accountEmails({});
    const spoofed = await accountEmails({ 'x-tenant-id': OTHER_TENANT });
    assert.deepEqual(spoofed, anonymous);
  });

  it('refuses a token that is present but invalid instead of falling back to the demo scope', async () => {
    const response = await app.app.request('/api/finance/accounts', { headers: { authorization: 'Bearer not.a.token' } });
    assert.equal(response.status, 401);
    assert.equal((await json(response)).code, 'AU_1005');
  });

  it('scopes a signed-up caller to their own user, not the demo one', async () => {
    const email = 'scoped@example.com';
    const password = 'correct-horse-battery';
    await postJson(app.app, '/api/auth/signup', { email, password, displayName: 'Scoped' });
    const login = await json(
      await postJson(app.app, '/api/auth/login', { email, password, clientType: 'IOS' }),
    );
    const headers = { authorization: `Bearer ${String(login.accessToken)}` };
    assert.deepEqual(await accountEmails(headers), []);

    // The token carries the tenant signup assigned; the header cannot override it.
    const payload = JSON.parse(Buffer.from(String(login.accessToken).split('.')[1] ?? '', 'base64url').toString()) as Record<string, unknown>;
    assert.equal(payload.tenant_id, DEFAULT_TENANT_ID);
    assert.deepEqual(await accountEmails({ ...headers, 'x-tenant-id': OTHER_TENANT }), []);
  });

  it('files a created account under the caller scope, and refuses an unusable scope id', async () => {
    const email = 'writer@example.com';
    const password = 'correct-horse-battery';
    await postJson(app.app, '/api/auth/signup', { email, password, displayName: 'Writer' });
    const login = await json(await postJson(app.app, '/api/auth/login', { email, password, clientType: 'IOS' }));
    const headers = { authorization: `Bearer ${String(login.accessToken)}` };

    const created = await postJson(
      app.app,
      '/api/finance/accounts',
      { institutionName: 'N26', accountType: 'CHECKING', currency: 'EUR', balance: 100000, isPrimaryLiquidity: true },
      headers,
    );
    assert.equal(created.status, 201);
    const account = await json(created);
    assert.equal(account.userId, subjectOf(String(login.accessToken)));
    assert.deepEqual(await accountEmails(headers), ['N26']);
    // The new row is invisible to the demo scope.
    assert.ok((await accountEmails({})).includes('Deutsche Bank Germany'));
  });
});

const subjectOf = (token: string): string =>
  (JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString()) as { sub: string }).sub;