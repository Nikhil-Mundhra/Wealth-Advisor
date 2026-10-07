import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import type { Db } from 'mongodb';
import { type TestApp, startTestApp } from '../../support/test-app.ts';

const user = (email: string, subject: string, status = 'ACTIVE') => ({
  email,
  emailVerifiedAt: null,
  passwordHash: null,
  displayName: null,
  status,
  roles: ['USER'],
  providers: [{ type: 'EMAIL', subject, email, linkedAt: new Date(), lastLoginAt: null }],
  consents: [],
  withdrawal: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// The email is the login name; Mongo itself refuses a second ACTIVE account for it, whatever its provider links say.
describe('users email uniqueness on Mongo', () => {
  let app: TestApp;
  let db: Db;

  before(async () => {
    app = await startTestApp();
    const { getDb } = await import('#core/db/connection/mongo-client.ts');
    db = await getDb();
  });
  after(async () => {
    await app.stop();
  });

  it('refuses a second ACTIVE user with the same email, even through a different provider link', async () => {
    const users = db.collection('users');
    await users.insertOne(user('same@example.com', 'subject-a'));
    await assert.rejects(() => users.insertOne(user('same@example.com', 'subject-b')), { code: 11000 });
  });

  it('frees the email once the holder is no longer ACTIVE', async () => {
    const users = db.collection('users');
    await users.insertOne(user('freed@example.com', 'subject-c', 'WITHDRAWN'));
    await users.insertOne(user('freed@example.com', 'subject-d'));
    assert.equal(await users.countDocuments({ email: 'freed@example.com' }), 2);
  });
});
