import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpClientError } from '#core/http-client/http-client.ts';
import {
  CircuitBreaker,
  CircuitOpenError,
  createResilientCachedCaller,
  retryWithBackoffAndJitter,
} from '#core/http-client/resilient-caller.ts';

class MutableClock {
  private currentMs: number;

  constructor(iso = '2026-10-06T12:00:00Z') {
    this.currentMs = new Date(iso).getTime();
  }

  now(): Date {
    return new Date(this.currentMs);
  }

  advance(ms: number): void {
    this.currentMs += ms;
  }
}

describe('CircuitBreaker', () => {
  it('opens after threshold failures and transitions through HALF_OPEN to CLOSED', async () => {
    const clock = new MutableClock();
    const breaker = new CircuitBreaker('fx-provider', { failureThreshold: 2, cooldownMs: 5_000, clock });

    assert.equal(breaker.getState(), 'CLOSED');
    await assert.rejects(() => breaker.execute(async () => { throw new Error('boom-1'); }), /boom-1/);
    assert.equal(breaker.getState(), 'CLOSED');
    await assert.rejects(() => breaker.execute(async () => { throw new Error('boom-2'); }), /boom-2/);
    assert.equal(breaker.getState(), 'OPEN');

    await assert.rejects(() => breaker.execute(async () => 'never-called'), CircuitOpenError);

    clock.advance(5_000);
    assert.equal(breaker.getState(), 'HALF_OPEN');

    const recovered = await breaker.execute(async () => 'ok');
    assert.equal(recovered, 'ok');
    assert.equal(breaker.getState(), 'CLOSED');
  });
});

describe('retryWithBackoffAndJitter', () => {
  it('retries transient HttpClientError and stops immediately on fatal errors', async () => {
    const delays: number[] = [];
    let transientAttempts = 0;

    const ok = await retryWithBackoffAndJitter(
      async () => {
        transientAttempts += 1;
        if (transientAttempts < 3) {
          throw new HttpClientError('transient', '503 upstream', 503);
        }
        return 'recovered';
      },
      {
        maxRetries: 2,
        baseDelayMs: 100,
        maxDelayMs: 500,
        random: () => 0.5,
        sleep: async (ms) => {
          delays.push(ms);
        },
      },
    );

    assert.equal(ok, 'recovered');
    assert.equal(transientAttempts, 3);
    assert.deepEqual(delays, [50, 100]);

    let fatalAttempts = 0;
    await assert.rejects(
      () =>
        retryWithBackoffAndJitter(
          async () => {
            fatalAttempts += 1;
            throw new HttpClientError('fatal', 'HTTP 400 bad request', 400);
          },
          { maxRetries: 3, sleep: async () => {} },
        ),
      /HTTP 400/,
    );
    assert.equal(fatalAttempts, 1);
  });
});

describe('createResilientCachedCaller', () => {
  it('serves fresh TTL cache hits, degrades to stale cache when upstream fails, and falls back to mock when cold', async () => {
    const clock = new MutableClock();
    let shouldFail = false;
    let fetches = 0;

    const caller = createResilientCachedCaller<string, { rate: number }>({
      name: 'fx',
      ttlMs: 10_000,
      clock,
      circuitBreaker: new CircuitBreaker('fx', { failureThreshold: 2, cooldownMs: 30_000, clock }),
      retry: { maxRetries: 0 },
      fetcher: async () => {
        fetches += 1;
        if (shouldFail) throw new HttpClientError('transient', 'timeout', null);
        return { rate: 1.08 };
      },
      mockFallback: () => ({ rate: 1.0 }),
    });

    const first = await caller.call('EUR:USD');
    assert.equal(first.source, 'live');
    assert.equal(first.stale, false);
    assert.equal(first.value.rate, 1.08);
    assert.equal(fetches, 1);

    clock.advance(4_000);
    const hit = await caller.call('EUR:USD');
    assert.equal(hit.source, 'cache');
    assert.equal(hit.stale, false);
    assert.equal(fetches, 1);

    // Expire TTL and fail live fetch -> stale_cache preserves last good value cleanly
    clock.advance(7_000);
    shouldFail = true;
    const staleHit = await caller.call('EUR:USD');
    assert.equal(staleHit.source, 'stale_cache');
    assert.equal(staleHit.stale, true);
    assert.equal(staleHit.value.rate, 1.08);
    assert.ok(staleHit.reason);

    // Second failure opens circuit; cold key drops to deterministic mock fallback
    const coldMock = await caller.call('EUR:GBP');
    assert.equal(coldMock.source, 'mock_fallback');
    assert.equal(coldMock.stale, true);
    assert.equal(coldMock.value.rate, 1.0);
    assert.equal(caller.getCircuitState(), 'OPEN');
  });
});
