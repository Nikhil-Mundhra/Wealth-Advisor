import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAdminApi } from '../../../src/modules/admin/admin.api.ts';
import {
  MemoryAdminSettingsRepository,
  MemoryApiKeyRepository,
  MemoryTenantRepository,
} from '../../../src/modules/admin/infrastructure/db/memory/memory-admin.repository.ts';
import { MemoryAdminUserRepository } from '../../../src/modules/admin/infrastructure/db/memory/memory-admin-user.repository.ts';

function setup() {
  const tenants = new MemoryTenantRepository();
  const apiKeys = new MemoryApiKeyRepository();
  const settings = new MemoryAdminSettingsRepository();
  const users = new MemoryAdminUserRepository();
  const hasher = {
    hash: async (pw: string) => `hashed_${pw}`,
  };
  const clock = { now: () => new Date('2026-10-06T12:00:00Z') };
  const api = createAdminApi({ tenants, apiKeys, settings, users, hasher, clock });
  return { api, tenants, apiKeys, settings, users };
}

describe('Admin Users API', () => {
  it('lists seeded demo user by default', async () => {
    const { api } = setup();
    const res = await api.listUsers();
    assert.ok(res.total >= 1);
    const demo = res.users.find((u) => u.email === 'testing@example.com');
    assert.ok(demo);
    assert.equal(demo?.displayName, 'Demo Advisor');
    assert.ok(demo?.roles.includes('ADMIN'));
  });

  it('creates new user and enforces unique email', async () => {
    const { api } = setup();
    const created = await api.createUser({
      email: 'sarah.advisor@example.com',
      displayName: 'Sarah Chen',
      password: 'SecurePassword123!',
      roles: ['USER'],
    });

    assert.equal(created.email, 'sarah.advisor@example.com');
    assert.equal(created.displayName, 'Sarah Chen');
    assert.deepEqual(created.roles, ['USER']);
    assert.equal(created.status, 'ACTIVE');

    // Duplicate email must be rejected
    await assert.rejects(
      () =>
        api.createUser({
          email: 'sarah.advisor@example.com',
          displayName: 'Sarah Duplicate',
          password: 'AnotherPassword123!',
          roles: ['USER'],
        }),
      /already in use/,
    );
  });

  it('creates user with specific tenant and rejects nonexistent tenant', async () => {
    const { api } = setup();
    const tenants = await api.listTenants();
    const validTenantId = tenants.tenants[0].id;

    const created = await api.createUser({
      email: 'corporate.user@example.com',
      displayName: 'Corporate User',
      password: 'SecurePassword123!',
      roles: ['USER'],
      tenantId: validTenantId,
    });
    assert.equal(created.tenantId, validTenantId);

    await assert.rejects(
      () =>
        api.createUser({
          email: 'bad.tenant@example.com',
          displayName: 'Bad Tenant',
          password: 'SecurePassword123!',
          roles: ['USER'],
          tenantId: '607f1f77bcf86cd799439999',
        }),
      /not found/,
    );
  });

  it('filters users by query, role, and status', async () => {
    const { api } = setup();
    await api.createUser({
      email: 'alex.trader@example.com',
      displayName: 'Alex Trader',
      password: 'Password123!',
      roles: ['ADMIN'],
    });
    await api.createUser({
      email: 'bob.client@example.com',
      displayName: 'Bob Client',
      password: 'Password123!',
      roles: ['USER'],
    });

    const searchRes = await api.listUsers({ q: 'alex' });
    assert.equal(searchRes.users.length, 1);
    assert.equal(searchRes.users[0].email, 'alex.trader@example.com');

    const adminRes = await api.listUsers({ role: 'ADMIN' });
    assert.ok(adminRes.users.every((u) => u.roles.includes('ADMIN')));

    const userRes = await api.listUsers({ role: 'USER' });
    assert.ok(userRes.users.some((u) => u.email === 'bob.client@example.com'));
  });

  it('retrieves user by id and rejects unknown id', async () => {
    const { api } = setup();
    const created = await api.createUser({
      email: 'fetch.test@example.com',
      displayName: 'Fetch Test',
      password: 'Password123!',
      roles: ['USER'],
    });

    const fetched = await api.getUser(created.id);
    assert.equal(fetched.id, created.id);
    assert.equal(fetched.email, 'fetch.test@example.com');

    await assert.rejects(() => api.getUser('nonexistent-id'), /not found/);
  });

  it('updates user display name, roles, and status', async () => {
    const { api } = setup();
    const created = await api.createUser({
      email: 'update.me@example.com',
      displayName: 'Original Name',
      password: 'Password123!',
      roles: ['USER'],
    });

    const updated = await api.updateUser(created.id, {
      displayName: 'Updated Name',
      roles: ['USER', 'ADMIN'],
      status: 'WITHDRAWN',
    });

    assert.equal(updated.displayName, 'Updated Name');
    assert.ok(updated.roles.includes('ADMIN'));
    assert.equal(updated.status, 'WITHDRAWN');
  });

  it('resets user password', async () => {
    const { api, users } = setup();
    const created = await api.createUser({
      email: 'pw.reset@example.com',
      displayName: 'Password Reset User',
      password: 'OldPassword123!',
      roles: ['USER'],
    });

    await api.resetUserPassword(created.id, {
      password: 'NewSuperPassword456!',
    });

    const record = await users.findById(created.id);
    assert.equal(record?.email, 'pw.reset@example.com');
  });

  it('deletes user and forbids self-deletion', async () => {
    const { api } = setup();
    const created = await api.createUser({
      email: 'to.delete@example.com',
      displayName: 'To Delete',
      password: 'Password123!',
      roles: ['USER'],
    });

    // Cannot delete self
    await assert.rejects(
      () => api.deleteUser(created.id, created.id),
      /cannot delete or withdraw the currently logged-in admin user/,
    );

    // Can delete other user
    await api.deleteUser(created.id, 'another-admin-id');

    await assert.rejects(() => api.getUser(created.id), /not found/);
  });
});
