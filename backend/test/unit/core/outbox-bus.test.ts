import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createEnvelope } from '#core/events/event-envelope.ts';
import { DurableOutboxEventBus, createMemoryOutboxStore } from '#core/events/outbox-bus.ts';

class MutableClock {
  private currentMs = new Date('2026-10-06T12:00:00Z').getTime();

  now(): Date {
    return new Date(this.currentMs);
  }

  advance(ms: number): void {
    this.currentMs += ms;
  }
}

describe('DurableOutboxEventBus', () => {
  it('retries failed deliveries with backoff and dead-letters after maxAttempts', async () => {
    const clock = new MutableClock();
    const store = createMemoryOutboxStore();
    const bus = new DurableOutboxEventBus({
      store,
      clock,
      maxAttempts: 3,
      retryBackoffMs: 1_000,
      autoDrain: false,
    });

    let calls = 0;
    bus.subscribe('test.failing', async () => {
      calls += 1;
      throw new Error(`consumer down attempt ${calls}`);
    });

    await bus.publish(
      createEnvelope({
        type: 'test.failing',
        version: 1,
        occurredAt: clock.now(),
        payload: { ok: false },
      }),
    );

    const first = await bus.drainOnce();
    assert.deepEqual(first, { delivered: 0, retried: 1, deadLettered: 0 });
    assert.equal(calls, 1);

    // Before backoff elapses, nothing is due
    const early = await bus.drainOnce();
    assert.deepEqual(early, { delivered: 0, retried: 0, deadLettered: 0 });

    clock.advance(1_000);
    const second = await bus.drainOnce();
    assert.deepEqual(second, { delivered: 0, retried: 1, deadLettered: 0 });

    clock.advance(2_000);
    const third = await bus.drainOnce();
    assert.deepEqual(third, { delivered: 0, retried: 0, deadLettered: 1 });

    const stats = await bus.stats();
    assert.deepEqual(stats, { pending: 0, delivered: 0, deadLettered: 1 });

    const dlq = await bus.deadLetters();
    assert.equal(dlq.length, 1);
    assert.equal(dlq[0]?.attempts, 3);
    assert.match(dlq[0]?.lastError ?? '', /consumer down attempt 3/);
  });

  it('auto-drains published envelopes immediately when autoDrain is enabled', async () => {
    const clock = new MutableClock();
    const bus = new DurableOutboxEventBus({ clock, autoDrain: true });
    const received: string[] = [];

    bus.subscribe('core.ping', async (event) => {
      received.push(event.id);
    });

    const env = createEnvelope({
      type: 'core.ping',
      version: 1,
      occurredAt: clock.now(),
      payload: { ok: true },
    });
    await bus.publish(env);

    assert.deepEqual(received, [env.id]);
    assert.deepEqual(await bus.stats(), { pending: 0, delivered: 1, deadLettered: 0 });
  });
});
