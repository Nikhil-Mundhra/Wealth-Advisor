import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { fixtureHttp, marketFixture, syntheticEodPage, weekdays } from '../../support/market-fixtures.ts';
import { type TestApp, startTestApp } from '../../support/test-app.ts';

const CRON_SECRET = 'cron-secret-for-tests';
const TRACKED = ['VT', 'VOO', 'IEF', 'SHY', 'SHV', 'UUP'];

// Refresh → market.data_refreshed → analytics snapshot, through the real bus and routes. Frankfurter answers from
// its recorded fixture; Marketstack from generated pages, since a snapshot needs a year of closes per symbol.
export function runAnalyticsSnapshotSuite(store: 'mongo' | 'memory'): void {
  let t: TestApp;
  before(async () => {
    t = await startTestApp({
      store,
      http: fixtureHttp((url) => (url.hostname === 'api.frankfurter.dev' ? marketFixture('frankfurter-range.json') : syntheticEodPage(url))),
      start: new Date('2025-01-07T23:30:00Z'),
      env: { CRON_SECRET, MARKETSTACK_ACCESS_KEY: 'test-access-key' },
    });
  });
  after(async () => {
    await t.stop();
  });

  const get = (path: string, headers: Record<string, string> = {}) => t.app.request(path, { headers });
  const json = async (response: Response) => (await response.json()) as Record<string, unknown>;
  const refresh = () => get('/api/market/refresh', { authorization: `Bearer ${CRON_SECRET}` });

  it('GET /api/analytics/snapshot answers AN_1001 before any refresh', async () => {
    const response = await get('/api/analytics/snapshot');
    assert.equal(response.status, 404);
    assert.equal((await json(response)).code, 'AN_1001');
  });

  it('after a refresh, returns the snapshot computed from the year of stored closes', async () => {
    assert.equal((await json(await refresh())).asOf, '2025-01-07');
    const response = await get('/api/analytics/snapshot');
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      asOf: string;
      symbols: string[];
      means: number[];
      volatilities: number[];
      covariance: number[][];
      window: { from: string; to: string; observations: number };
      computedAt: string;
    };
    assert.equal(body.asOf, '2025-01-07');
    assert.deepEqual(body.symbols, TRACKED);
    assert.deepEqual(body.window, { from: '2024-01-08', to: '2025-01-07', observations: weekdays('2024-01-08', '2025-01-07').length - 1 });
    assert.equal(body.computedAt, '2025-01-07T23:30:00.000Z');
    assert.equal(body.means.length, TRACKED.length);
    assert.equal(body.covariance.length, TRACKED.length);
    body.covariance.forEach((row, i) => {
      assert.equal(row.length, TRACKED.length);
      row.forEach((value, j) => assert.equal(value, body.covariance[j][i]));
      assert.ok(body.volatilities[i] > 0);
      assert.ok(Math.abs(body.volatilities[i] ** 2 - row[i]) < 1e-12);
    });
  });

  it('a re-run publishes a new event and converges on the same single snapshot', async () => {
    const before = await json(await get('/api/analytics/snapshot'));
    await refresh();
    const again = await json(await get('/api/analytics/snapshot'));
    assert.deepEqual(again, before);
    assert.deepEqual(await json(await get('/api/analytics/snapshot?asOf=2025-01-07')), before);
  });

  it('asOf selects a data date: unknown → AN_1001, malformed → CORE_VALIDATION_FAILED', async () => {
    const missing = await get('/api/analytics/snapshot?asOf=2025-01-06');
    assert.equal(missing.status, 404);
    assert.equal((await json(missing)).code, 'AN_1001');
    const malformed = await get('/api/analytics/snapshot?asOf=2025-13-01');
    assert.equal(malformed.status, 400);
    assert.deepEqual((await json(malformed)).issues, [{ path: ['asOf'], code: 'date.invalid' }]);
  });
}
