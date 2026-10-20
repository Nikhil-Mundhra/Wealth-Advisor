import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { exportPKCS8, exportSPKI, generateKeyPair, SignJWT } from 'jose';
import { type TestApp, startTestApp } from '../../support/test-app.ts';

const json = async (response: Response) => (await response.json()) as Record<string, any>;

describe('admin user routes', () => {
  let app: TestApp;
  let adminToken: string;
  let userToken: string;
  const adminUserId = '6000000000000000000000aa';

  before(async () => {
    const { privateKey, publicKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519', extractable: true });
    app = await startTestApp({
      store: 'memory',
      env: { AUTH_JWT_PRIVATE_KEY: await exportPKCS8(privateKey), AUTH_JWT_PUBLIC_KEY: await exportSPKI(publicKey) },
    });

    const createToken = async (userId: string, roles: string[]) => {
      const issuedAt = Math.floor(app.clock.now().getTime() / 1000);
      return new SignJWT({ token_use: 'user', roles, tenant_id: null })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'wa-1', typ: 'JWT' })
        .setIssuer('wealth-advisor-auth')
        .setAudience('wealth-advisor-api')
        .setSubject(userId)
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + 600)
        .sign(privateKey);
    };

    adminToken = await createToken(adminUserId, ['USER', 'ADMIN']);
    userToken = await createToken('6000000000000000000000bb', ['USER']);
  });

  after(async () => {
    await app.stop();
  });

  it('rejects /api/admin/users without admin role', async () => {
    const res = await app.app.request('/api/admin/users', {
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(res.status, 403);
    assert.equal((await json(res)).code, 'AD_1004');
  });

  it('lists users and creates a user via admin API', async () => {
    // List users
    const listRes = await app.app.request('/api/admin/users', {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(listRes.status, 200);
    const listBody = await json(listRes);
    assert.ok(Array.isArray(listBody.users));

    // Create user
    const createRes = await app.app.request('/api/admin/users', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'new.member@wealth.example',
        displayName: 'New Member',
        password: 'ValidPassword123!',
        roles: ['USER'],
      }),
    });
    assert.equal(createRes.status, 201);
    const createdUser = await json(createRes);
    assert.equal(createdUser.email, 'new.member@wealth.example');
    assert.equal(createdUser.displayName, 'New Member');

    // Update user
    const updateRes = await app.app.request(`/api/admin/users/${createdUser.id}`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        displayName: 'Senior Member',
        roles: ['USER', 'ADMIN'],
      }),
    });
    assert.equal(updateRes.status, 200);
    const updatedUser = await json(updateRes);
    assert.equal(updatedUser.displayName, 'Senior Member');
    assert.ok(updatedUser.roles.includes('ADMIN'));

    // Reset password
    const resetRes = await app.app.request(`/api/admin/users/${createdUser.id}/reset-password`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        password: 'NewStrongPassword456!',
      }),
    });
    assert.equal(resetRes.status, 200);

    // Delete user
    const deleteRes = await app.app.request(`/api/admin/users/${createdUser.id}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    assert.equal(deleteRes.status, 204);

    // Verify user is gone
    const getRes = await app.app.request(`/api/admin/users/${createdUser.id}`, {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    assert.equal(getRes.status, 404);
  });

  it('forbids admin from deleting themselves', async () => {
    const deleteRes = await app.app.request(`/api/admin/users/${adminUserId}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    assert.equal(deleteRes.status, 400);
    assert.equal((await json(deleteRes)).code, 'AD_1008');
  });

  it('probes AI platform health via GET and POST /api/admin/models/health', async () => {
    const unauthRes = await app.app.request('/api/admin/models/health', {
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(unauthRes.status, 403);

    const getRes = await app.app.request('/api/admin/models/health?provider=mock', {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    const getBody = await json(getRes);
    assert.equal(getBody.providers.length, 1);
    assert.equal(getBody.providers[0].provider, 'mock');
    assert.equal(getBody.providers[0].healthy, true);

    const postRes = await app.app.request('/api/admin/models/health', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ provider: 'mock' }),
    });
    assert.equal(postRes.status, 200);
    const postBody = await json(postRes);
    assert.equal(postBody.providers[0].provider, 'mock');
    assert.equal(postBody.providers[0].healthy, true);
  });
});
