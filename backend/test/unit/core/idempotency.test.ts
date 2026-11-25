import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import type { Db } from 'mongodb';
import {
  createIdempotencyMiddleware,
  createMemoryIdempotencyStore,
  createMongoIdempotencyStore,
} from '#core/http/idempotency.ts';
import type { IdempotencyKeyDocument } from '#core/http/idempotency-keys.schema.ts';

describe('Idempotency-Key middleware', () => {
  it('replays identical POST requests and rejects key reuse with a mutated payload', async () => {
    const app = new Hono();
    let invocations = 0;
    const store = createMemoryIdempotencyStore();
    const clock = { now: () => new Date('2026-10-06T12:00:00Z') };

    app.use('/api/*', createIdempotencyMiddleware({ store, clock }));
    app.post('/api/items', async (c) => {
      invocations += 1;
      const body = await c.req.json();
      return c.json({ count: invocations, echo: body.value }, 201);
    });

    const first = await app.request('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'idem-key-001',
      },
      body: JSON.stringify({ value: 'alpha' }),
    });
    assert.equal(first.status, 201);
    assert.equal(first.headers.get('X-Idempotent-Replay'), 'false');
    assert.deepEqual(await first.json(), { count: 1, echo: 'alpha' });

    const replay = await app.request('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'idem-key-001',
      },
      body: JSON.stringify({ value: 'alpha' }),
    });
    assert.equal(replay.status, 201);
    assert.equal(replay.headers.get('X-Idempotent-Replay'), 'true');
    assert.deepEqual(await replay.json(), { count: 1, echo: 'alpha' });
    assert.equal(invocations, 1);

    const conflict = await app.request('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'idem-key-001',
      },
      body: JSON.stringify({ value: 'beta' }),
    });
    assert.equal(conflict.status, 409);
    const conflictBody = (await conflict.json()) as { code: string };
    assert.equal(conflictBody.code, 'CORE_IDEMPOTENCY_CONFLICT');
    assert.equal(invocations, 1);
  });

  it('persists, expires, and survives duplicate races via MongoDB idempotency store', async () => {
    const docs = new Map<string, IdempotencyKeyDocument>();
    let simulateRace = false;

    const fakeCollection = {
      async findOne(query: {
        key: string;
        callerHash: string;
        method: string;
        path: string;
        expiresAt: { $gt: Date };
      }): Promise<IdempotencyKeyDocument | null> {
        const scope = `${query.callerHash}:${query.method}:${query.path}:${query.key}`;
        const existing = docs.get(scope);
        if (!existing) return null;
        if (existing.expiresAt.getTime() <= query.expiresAt.$gt.getTime()) return null;
        return existing;
      },
      async updateOne(
        filter: { key: string; callerHash: string; method: string; path: string },
        update: { $set: Omit<IdempotencyKeyDocument, '_id'> },
      ) {
        if (simulateRace) {
          throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
        }
        const scope = `${filter.callerHash}:${filter.method}:${filter.path}:${filter.key}`;
        docs.set(scope, update.$set);
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: null };
      },
    };

    const fakeDb = {
      collection: () => fakeCollection,
    } as unknown as Db;

    let currentMs = Date.parse('2026-10-06T12:00:00Z');
    const clock = { now: () => new Date(currentMs) };
    const store = createMongoIdempotencyStore(async () => fakeDb);
    const app = new Hono();
    let invocations = 0;

    app.use('/api/*', createIdempotencyMiddleware({ store, clock, ttlMs: 60_000 }));
    app.post('/api/orders', async (c) => {
      invocations += 1;
      return c.json({ seq: invocations }, 201);
    });

    const first = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'mongo-key-1' },
      body: JSON.stringify({ amount: 100 }),
    });
    assert.equal(first.status, 201);
    assert.equal(first.headers.get('X-Idempotent-Replay'), 'false');
    assert.equal(docs.size, 1);

    const replay = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'mongo-key-1' },
      body: JSON.stringify({ amount: 100 }),
    });
    assert.equal(replay.status, 201);
    assert.equal(replay.headers.get('X-Idempotent-Replay'), 'true');
    assert.deepEqual(await replay.json(), { seq: 1 });
    assert.equal(invocations, 1);

    // Advance past TTL: expired document should be ignored even before Mongo TTL background sweep runs.
    currentMs += 61_000;
    const afterExpiry = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'mongo-key-1' },
      body: JSON.stringify({ amount: 100 }),
    });
    assert.equal(afterExpiry.status, 201);
    assert.equal(afterExpiry.headers.get('X-Idempotent-Replay'), 'false');
    assert.deepEqual(await afterExpiry.json(), { seq: 2 });

    // Concurrent upsert duplicate-key race (E11000) should not fail the response.
    simulateRace = true;
    const raced = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'mongo-key-race' },
      body: JSON.stringify({ amount: 250 }),
    });
    assert.equal(raced.status, 201);
    assert.deepEqual(await raced.json(), { seq: 3 });
  });
});
