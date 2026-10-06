import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { fixtureHttp, marketFixture } from '../../support/market-fixtures.ts';
import { type TestApp, startTestApp } from '../../support/test-app.ts';

const CRON_SECRET = 'cron-secret-for-tests';

// Providers answer from recorded fixtures through the app's http client; no request leaves the process.
function providers() {
  return fixtureHttp((url) => {
    if (url.hostname === 'api.frankfurter.dev') return marketFixture('frankfurter-range.json');
    return marketFixture(url.searchParams.get('offset') === '0' ? 'marketstack-eod-page-1.json' : 'marketstack-eod-page-2.json');
  });
}

// quotes, fx and the cron-guarded refresh end to end; each runner file supplies the store.
export function runMarketRoutesSuite(store: 'mongo' | 'memory'): void {
  let t: TestApp;
  const http = providers();
  before(async () => {
    t = await startTestApp({
      store,
      http,
      start: new Date('2025-01-07T22:00:00Z'),
      env: { CRON_SECRET, MARKETSTACK_ACCESS_KEY: 'test-access-key' },
    });
  });
  after(async () => {
    await t.stop();
  });

  const get = (path: string, headers: Record<string, string> = {}) => t.app.request(path, { headers });
  const json = async (response: Response) => (await response.json()) as Record<string, unknown>;
  const cron = { authorization: `Bearer ${CRON_SECRET}` };

  describe('before any refresh', () => {
    it('quotes and fx answer with asOf null and no data', async () => {
      assert.deepEqual(await json(await get('/api/market/quotes')), { asOf: null, quotes: [] });
      assert.deepEqual(await json(await get('/api/market/fx?base=EUR')), { asOf: null, base: 'EUR', rates: [] });
    });
  });

  describe('GET /api/market/refresh', () => {
    it('rejects a missing, malformed or wrong bearer with MK_1001 and calls no provider', async () => {
      const attempts: Record<string, string>[] = [{}, { authorization: CRON_SECRET }, { authorization: 'Bearer wrong' }, { authorization: `Bearer ${CRON_SECRET}x` }];
      for (const headers of attempts) {
        const response = await get('/api/market/refresh', headers);
        assert.equal(response.status, 401);
        assert.equal((await json(response)).code, 'MK_1001');
      }
      assert.equal(http.urls.length, 0);
    });

    it('with the cron secret, backfills a year and reports what it stored', async () => {
      const response = await get('/api/market/refresh', cron);
      assert.equal(response.status, 200);
      assert.deepEqual(await json(response), { asOf: '2025-01-06', pricesStored: 5, ratesStored: 18, from: '2024-01-08', to: '2025-01-07' });
      assert.deepEqual(http.urls.map((url) => url.hostname), ['api.frankfurter.dev', 'api.marketstack.com', 'api.marketstack.com']);
    });

    // The fixture has no SHY, SHV or UUP rows, so the range restarts at the one-year mark; the unit suite covers
    // the incremental range when every symbol is stored.
    it('a re-run stores nothing new', async () => {
      const body = await json(await get('/api/market/refresh', cron));
      assert.deepEqual({ prices: body.pricesStored, rates: body.ratesStored, asOf: body.asOf }, { prices: 0, rates: 0, asOf: '2025-01-06' });
    });
  });

  describe('GET /api/market/quotes', () => {
    it('returns the latest close per tracked symbol with its asset class, in cents', async () => {
      const body = await json(await get('/api/market/quotes'));
      assert.equal(body.asOf, '2025-01-06');
      assert.deepEqual(body.quotes, [
        { symbol: 'VT', assetClass: 'EQUITY_GLOBAL', date: '2025-01-06', close: { amount: 11_895, currency: 'USD' }, source: 'marketstack' },
        { symbol: 'VOO', assetClass: 'EQUITY_US', date: '2025-01-06', close: { amount: 54_653, currency: 'USD' }, source: 'marketstack' },
        { symbol: 'IEF', assetClass: 'FIXED_INCOME_GOV', date: '2025-01-06', close: { amount: 9_220, currency: 'USD' }, source: 'marketstack' },
      ]);
    });
  });

  describe('GET /api/market/fx', () => {
    it('quotes every other currency against the asked base, crossed through EUR', async () => {
      const body = await json(await get('/api/market/fx?base=USD'));
      assert.equal(body.asOf, '2025-01-07');
      const rates = body.rates as { quote: string; rate: number; date: string; source: string }[];
      assert.deepEqual(rates.map((rate) => rate.quote), ['EUR', 'GBP', 'SGD', 'CNY', 'JPY', 'HKD']);
      assert.deepEqual(rates[0], { quote: 'EUR', rate: 10_000 / 10_393, date: '2025-01-07', source: 'frankfurter:ecb' });
    });

    it('takes the last published rate on or before the asked date (Sunday → Friday)', async () => {
      const body = await json(await get('/api/market/fx?base=EUR&date=2025-01-05'));
      assert.equal(body.asOf, '2025-01-03');
      assert.deepEqual((body.rates as { quote: string; rate: number }[]).find((rate) => rate.quote === 'USD')?.rate, 1.0299);
    });

    it('rejects a missing or unknown base and a malformed date against the query contract', async () => {
      const cases: [string, unknown[]][] = [
        ['/api/market/fx', [{ path: ['base'], code: 'currency.invalid' }]],
        ['/api/market/fx?base=XXX', [{ path: ['base'], code: 'currency.invalid' }]],
        ['/api/market/fx?base=EUR&date=2025-13-01', [{ path: ['date'], code: 'date.invalid' }]],
      ];
      for (const [path, issues] of cases) {
        const response = await get(path);
        assert.equal(response.status, 400);
        const body = await json(response);
        assert.equal(body.code, 'CORE_VALIDATION_FAILED');
        assert.deepEqual(body.issues, issues);
      }
    });
  });
}
