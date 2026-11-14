import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { createIdempotencyMiddleware, createMemoryIdempotencyStore } from '#core/http/idempotency.ts';

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
});
