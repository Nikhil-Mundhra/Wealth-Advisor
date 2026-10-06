import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import type { RequestBudget } from '#core/http-client/request-budget.ts';
import { FakeClock } from '../../support/fake-clock.ts';
import { startTestApp, type TestApp } from '../../support/test-app.ts';

type BudgetFactory = (clock: FakeClock) => Promise<RequestBudget>;

function runRequestBudgetSuite(name: string, create: BudgetFactory): void {
  describe(`request budget (${name})`, () => {
    it('grants reservations up to the monthly limit, then refuses', async () => {
      const budget = await create(new FakeClock(new Date('2026-03-10T12:00:00Z')));
      assert.equal(await budget.reserve(`${name}-limit`, 2, 5), true);
      assert.equal(await budget.reserve(`${name}-limit`, 3, 5), true);
      assert.equal(await budget.reserve(`${name}-limit`, 1, 5), false);
    });

    it('refuses a reservation larger than what is left without spending it', async () => {
      const budget = await create(new FakeClock(new Date('2026-03-10T12:00:00Z')));
      assert.equal(await budget.reserve(`${name}-partial`, 4, 5), true);
      assert.equal(await budget.reserve(`${name}-partial`, 2, 5), false);
      assert.equal(await budget.reserve(`${name}-partial`, 1, 5), true);
      assert.equal(await budget.reserve(`${name}-oversize`, 6, 5), false);
    });

    it('counts per provider and starts a new count each UTC month', async () => {
      const clock = new FakeClock(new Date('2026-03-31T23:59:00Z'));
      const budget = await create(clock);
      assert.equal(await budget.reserve(`${name}-month`, 1, 1), true);
      assert.equal(await budget.reserve(`${name}-month`, 1, 1), false);
      assert.equal(await budget.reserve(`${name}-other`, 1, 1), true);
      clock.advanceSeconds(120);
      assert.equal(await budget.reserve(`${name}-month`, 1, 1), true);
    });

    it('never grants past the limit under concurrent reservations', async () => {
      const budget = await create(new FakeClock(new Date('2026-03-10T12:00:00Z')));
      const results = await Promise.all(Array.from({ length: 25 }, () => budget.reserve(`${name}-race`, 1, 7)));
      assert.equal(results.filter(Boolean).length, 7);
    });

    it('rejects a non-positive count or a negative limit', async () => {
      const budget = await create(new FakeClock(new Date('2026-03-10T12:00:00Z')));
      await assert.rejects(budget.reserve(`${name}-args`, 0, 5));
      await assert.rejects(budget.reserve(`${name}-args`, 1.5, 5));
      await assert.rejects(budget.reserve(`${name}-args`, 1, -1));
    });
  });
}

describe('request budget', () => {
  let testApp: TestApp;
  before(async () => {
    testApp = await startTestApp();
  });
  after(async () => {
    await testApp.stop();
  });

  // The Mongo store shares one collection across cases, so each case uses its own provider name.
  runRequestBudgetSuite('mongo', async (clock) => {
    const { createRequestBudget } = await import('#core/http-client/request-budget.ts');
    const { getDb } = await import('#core/db/connection/mongo-client.ts');
    return createRequestBudget('mongo', getDb, clock);
  });

  runRequestBudgetSuite('memory', async (clock) => {
    const { createRequestBudget } = await import('#core/http-client/request-budget.ts');
    return createRequestBudget('memory', () => Promise.reject(new Error('memory store opened the database')), clock);
  });

  it('stores one counter per provider and month (mongo)', async () => {
    const { getDb } = await import('#core/db/connection/mongo-client.ts');
    const { REQUEST_BUDGETS_COLLECTION } = await import('#core/http-client/request-budgets.schema.ts');
    const counters = (await getDb()).collection<{ _id: string; used: number }>(REQUEST_BUDGETS_COLLECTION);
    const counter = await counters.findOne({ _id: 'mongo-race:2026-03' });
    assert.equal(counter?.used, 7);
  });
});
