import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { createHttpClient, HttpClientError } from '#core/http-client/http-client.ts';

const URL_WITH_KEY = 'https://api.example.com/v2/eod?access_key=SECRET-KEY&symbols=VT';

function clientAnswering(answer: () => Promise<Response>) {
  const calls: RequestInit[] = [];
  const client = createHttpClient(async (_input, init) => {
    calls.push(init);
    return answer();
  });
  return { client, calls };
}

async function failure(promise: Promise<unknown>): Promise<HttpClientError> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof HttpClientError, `expected HttpClientError, got ${String(error)}`);
    assert.ok(!error.message.includes('SECRET-KEY'), `query string leaked: ${error.message}`);
    assert.ok(error.message.includes('https://api.example.com/v2/eod'), error.message);
    return error;
  }
  assert.fail('expected a rejection');
}

describe('http-client getJson', () => {
  it('returns the parsed body and passes a timeout signal', async () => {
    const { client, calls } = clientAnswering(async () => Response.json({ data: [1, 2] }));
    assert.deepEqual(await client.getJson(URL_WITH_KEY, { timeoutMs: 1000 }), { data: [1, 2] });
    assert.ok(calls[0]?.signal instanceof AbortSignal);
  });

  it('maps 5xx, 429 and 408 to transient with the status', async () => {
    for (const status of [500, 502, 503, 429, 408]) {
      const { client } = clientAnswering(async () => new Response('busy', { status }));
      const error = await failure(client.getJson(URL_WITH_KEY, { timeoutMs: 1000 }));
      assert.equal(error.kind, 'transient', `status ${status}`);
      assert.equal(error.status, status);
    }
  });

  it('maps other non-2xx statuses to fatal', async () => {
    for (const status of [400, 401, 403, 404, 422]) {
      const { client } = clientAnswering(async () => new Response('no', { status }));
      const error = await failure(client.getJson(URL_WITH_KEY, { timeoutMs: 1000 }));
      assert.equal(error.kind, 'fatal', `status ${status}`);
      assert.equal(error.status, status);
    }
  });

  it('maps network errors and timeouts to transient without the URL in the message', async () => {
    const network = clientAnswering(async () => {
      throw new TypeError(`fetch failed for ${URL_WITH_KEY}`, { cause: { code: 'ECONNREFUSED' } });
    });
    const networkError = await failure(network.client.getJson(URL_WITH_KEY, { timeoutMs: 1000 }));
    assert.equal(networkError.kind, 'transient');
    assert.equal(networkError.status, null);
    assert.match(networkError.message, /ECONNREFUSED/);

    const timeout = clientAnswering(async () => {
      throw new DOMException(`timed out: ${URL_WITH_KEY}`, 'TimeoutError');
    });
    const timeoutError = await failure(timeout.client.getJson(URL_WITH_KEY, { timeoutMs: 1000 }));
    assert.equal(timeoutError.kind, 'transient');
    assert.match(timeoutError.message, /timeout/);
  });

  it('maps an unparseable 2xx body to fatal', async () => {
    const { client } = clientAnswering(async () => new Response('<html>', { status: 200 }));
    const error = await failure(client.getJson(URL_WITH_KEY, { timeoutMs: 1000 }));
    assert.equal(error.kind, 'fatal');
    assert.equal(error.status, 200);
  });
});
