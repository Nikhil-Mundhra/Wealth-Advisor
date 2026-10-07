import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { exportPKCS8, exportSPKI, generateKeyPair, SignJWT } from 'jose';
import { type TestApp, postJson, startTestApp } from '../../support/test-app.ts';

const json = async (response: Response) => (await response.json()) as Record<string, unknown>;

// Role, query and scope guards on routes outside auth, checked through the real app on the in-memory store.
describe('route guards', () => {
  let app: TestApp;
  let tokenWith: (roles: string[]) => Promise<string>;

  before(async () => {
    const { privateKey, publicKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
    app = await startTestApp({
      store: 'memory',
      env: { AUTH_JWT_PRIVATE_KEY: await exportPKCS8(privateKey), AUTH_JWT_PUBLIC_KEY: await exportSPKI(publicKey) },
    });
    tokenWith = async (roles) => {
      const issuedAt = Math.floor(app.clock.now().getTime() / 1000);
      return new SignJWT({ token_use: 'user', roles, tenant_id: null })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'wa-1', typ: 'JWT' })
        .setIssuer('wealth-advisor-auth')
        .setAudience('wealth-advisor-api')
        .setSubject('6000000000000000000000aa')
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + 600)
        .sign(privateKey);
    };
  });
  after(async () => {
    await app.stop();
  });

  it('refuses the admin console to a caller without the ADMIN role', async () => {
    const response = await app.app.request('/api/admin/tenants', {
      headers: { authorization: `Bearer ${await tokenWith(['USER'])}` },
    });
    assert.equal(response.status, 403);
    assert.equal((await json(response)).code, 'AD_1004');
  });

  it('refuses the admin console to an anonymous caller', async () => {
    const response = await app.app.request('/api/admin/tenants');
    assert.equal(response.status, 401);
    assert.equal((await json(response)).code, 'AU_1005');
  });

  it('serves the admin console to an ADMIN caller', async () => {
    const response = await app.app.request('/api/admin/tenants', {
      headers: { authorization: `Bearer ${await tokenWith(['USER', 'ADMIN'])}` },
    });
    assert.equal(response.status, 200);
  });

  it('refuses an unknown householdMode with a validation error instead of a 500', async () => {
    const response = await app.app.request('/api/finance/cashflow?householdMode=COMMUNE');
    assert.equal(response.status, 400);
    const body = await json(response);
    assert.equal(body.code, 'CORE_VALIDATION_FAILED');
    assert.deepEqual(body.issues, [{ path: ['householdMode'], code: 'household_mode.invalid' }]);
  });

  it('defaults householdMode when the query omits it', async () => {
    const response = await app.app.request('/api/finance/cashflow');
    assert.equal(response.status, 200);
  });

  it('requires a signed-in caller for every write', async () => {
    const writes: [string, unknown][] = [
      ['/api/sharing/create', {}],
      ['/api/finance/accounts', { institutionName: 'N26', accountType: 'CHECKING', currency: 'EUR', balance: 1, isPrimaryLiquidity: false }],
      ['/api/wealth/execute', { trades: [], passkeyAssertion: { credentialId: 'c', clientDataJson: 'd', authenticatorData: 'a', signature: 's' } }],
    ];
    for (const [path, body] of writes) {
      const response = await postJson(app.app, path, body);
      assert.equal(response.status, 401, path);
      assert.equal((await json(response)).code, 'AU_1005', path);
    }
  });

  it('shares only a portfolio the signed-in caller holds', async () => {
    const response = await postJson(app.app, '/api/sharing/create', {}, { authorization: `Bearer ${await tokenWith(['USER'])}` });
    assert.equal(response.status, 404);
    assert.equal((await json(response)).code, 'WL_1001');
  });
});
