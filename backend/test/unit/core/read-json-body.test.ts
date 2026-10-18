import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { Hono } from 'hono';
import { ErrorCatalog } from '#core/errors/error-catalog.ts';
import { createErrorHandler } from '#core/http/error-handler.ts';
import { MAX_JSON_BODY_BYTES, readJsonBody } from '#core/http/read-json-body.ts';

describe('readJsonBody', () => {
  const app = new Hono();
  app.onError(createErrorHandler(new ErrorCatalog()));
  app.post('/test', async (c) => {
    const body = await readJsonBody(c);
    return c.json({ received: body });
  });

  it('reads valid json object body', async () => {
    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hello: 'world' }),
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { received: { hello: 'world' } });
  });

  it('reads empty body as empty object', async () => {
    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '',
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { received: {} });
  });

  it('throws 400 invalidJson on malformed json', async () => {
    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ not valid json',
    });
    assert.equal(res.status, 400);
    const body = await res.json() as { code: string };
    assert.equal(body.code, 'CORE_INVALID_JSON');
  });

  it('rejects with 413 payloadTooLarge when Content-Length exceeds limit', async () => {
    const res = await app.request('/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(MAX_JSON_BODY_BYTES + 100),
      },
      body: '{"a":1}',
    });
    assert.equal(res.status, 413);
    const body = await res.json() as { code: string };
    assert.equal(body.code, 'CORE_PAYLOAD_TOO_LARGE');
  });

  it('rejects with 413 payloadTooLarge when payload body exceeds 1MB', async () => {
    const oversized = 'a'.repeat(MAX_JSON_BODY_BYTES + 10);
    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: oversized,
    });
    assert.equal(res.status, 413);
    const body = await res.json() as { code: string };
    assert.equal(body.code, 'CORE_PAYLOAD_TOO_LARGE');
  });
});
