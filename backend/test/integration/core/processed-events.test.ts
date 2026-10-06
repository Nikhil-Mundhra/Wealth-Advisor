import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import type { ProcessedEvents } from '#core/events/processed-events.ts';
import { startTestApp, type TestApp } from '../../support/test-app.ts';

function runProcessedEventsSuite(name: string, create: () => Promise<ProcessedEvents>): void {
  describe(`processed events (${name})`, () => {
    it('answers first once, then duplicate for the same handler and event', async () => {
      const marks = await create();
      assert.equal(await marks.markProcessed('analytics.snapshot', 'event-1'), 'first');
      assert.equal(await marks.markProcessed('analytics.snapshot', 'event-1'), 'duplicate');
    });

    it('keeps handlers and events apart', async () => {
      const marks = await create();
      assert.equal(await marks.markProcessed('handler-a', 'event-2'), 'first');
      assert.equal(await marks.markProcessed('handler-b', 'event-2'), 'first');
      assert.equal(await marks.markProcessed('handler-a', 'event-3'), 'first');
    });

    it('lets exactly one of several concurrent marks win', async () => {
      const marks = await create();
      const results = await Promise.all(Array.from({ length: 10 }, () => marks.markProcessed('racer', 'event-4')));
      assert.equal(results.filter((result) => result === 'first').length, 1);
    });
  });
}

describe('processed events', () => {
  let testApp: TestApp;
  before(async () => {
    testApp = await startTestApp();
  });
  after(async () => {
    await testApp.stop();
  });

  // The Mongo store shares one collection across cases, so each case uses its own handler and event ids.
  runProcessedEventsSuite('mongo', async () => {
    const { createProcessedEvents } = await import('#core/events/processed-events.ts');
    const { getDb } = await import('#core/db/connection/mongo-client.ts');
    return createProcessedEvents('mongo', getDb, testApp.clock);
  });

  runProcessedEventsSuite('memory', async () => {
    const { createProcessedEvents } = await import('#core/events/processed-events.ts');
    return createProcessedEvents('memory', () => Promise.reject(new Error('memory store opened the database')), testApp.clock);
  });
});
