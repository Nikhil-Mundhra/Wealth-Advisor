import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { createHttpClient } from '#core/http-client/http-client.ts';
import { MemoryRequestBudget } from '#core/http-client/memory-request-budget.ts';
import type { RequestBudget } from '#core/http-client/request-budget.ts';
import { createFrankfurterFxSource } from '../../../src/modules/market/infrastructure/providers/frankfurter-fx-source.ts';
import { createMarketstackPriceSource } from '../../../src/modules/market/infrastructure/providers/marketstack-price-source.ts';
import { FakeClock } from '../../support/fake-clock.ts';
import { marketFixture } from '../../support/market-fixtures.ts';

const KEY = 'secret-test-key';

// A fetch that answers from fixtures and records every URL; nothing leaves the process.
function fakeFetch(answer: (url: URL) => { status: number; body: unknown }) {
  const urls: URL[] = [];
  const fetchImpl = async (input: string) => {
    const url = new URL(input);
    urls.push(url);
    const { status, body } = answer(url);
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };
  return { http: createHttpClient(fetchImpl), urls };
}

const pages = (url: URL) => {
  const offset = url.searchParams.get('offset');
  return { status: 200, body: marketFixture(offset === '0' ? 'marketstack-eod-page-1.json' : 'marketstack-eod-page-2.json') };
};

function countingBudget(limit = 100): RequestBudget & { reserved: number } {
  const inner = new MemoryRequestBudget(new FakeClock(new Date('2025-01-07T00:00:00Z')));
  const budget = {
    reserved: 0,
    async reserve(provider: string, count: number, monthlyLimit: number) {
      const ok = await inner.reserve(provider, count, Math.min(monthlyLimit, limit));
      if (ok) budget.reserved += count;
      return ok;
    },
  };
  return budget;
}

describe('Marketstack price source', () => {
  it('follows pagination, reserving one budget unit per page, and reads closes to cents', async () => {
    const { http, urls } = fakeFetch(pages);
    const budget = countingBudget();
    const source = createMarketstackPriceSource({ accessKey: KEY, http, budget });
    const prices = await source.fetchEndOfDay(['VT', 'VOO', 'IEF'], '2025-01-03', '2025-01-06');

    assert.equal(budget.reserved, 2);
    assert.deepEqual(urls.map((url) => url.searchParams.get('offset')), ['0', '3']);
    const first = urls[0];
    assert.equal(`${first.origin}${first.pathname}`, 'https://api.marketstack.com/v2/eod');
    assert.deepEqual(Object.fromEntries(first.searchParams), {
      access_key: KEY, symbols: 'VT,VOO,IEF', date_from: '2025-01-03', date_to: '2025-01-06', sort: 'ASC', limit: '1000', offset: '0',
    });
    assert.deepEqual(
      prices.map((p) => [p.symbol, p.date, p.close.amount, p.close.currency, p.adjClose?.amount ?? null]),
      [
        ['VT', '2025-01-03', 11_836, 'USD', 11_790],
        ['VOO', '2025-01-03', 54_380, 'USD', 54_091], // 543.795 → 54379.5 → 54380 (half to even)
        ['VT', '2025-01-06', 11_895, 'USD', 11_849],
        ['VOO', '2025-01-06', 54_653, 'USD', 54_363],
        ['IEF', '2025-01-06', 9_220, 'USD', null], // 92.205 → 9220.5 → 9220 (half to even); no adj_close
      ],
    );
  });

  it('refuses with MK_1903 and spends no budget when the access key is missing', async () => {
    const { http, urls } = fakeFetch(pages);
    const budget = countingBudget();
    const source = createMarketstackPriceSource({ accessKey: '', http, budget });
    await assert.rejects(source.fetchEndOfDay(['VT'], '2025-01-03', '2025-01-06'), { code: 'MK_1903' });
    assert.equal(budget.reserved, 0);
    assert.equal(urls.length, 0);
  });

  it('refuses with MK_1902 before the request the budget cannot cover, even mid-pagination', async () => {
    const { http, urls } = fakeFetch(pages);
    const source = createMarketstackPriceSource({ accessKey: KEY, http, budget: countingBudget(1) });
    await assert.rejects(source.fetchEndOfDay(['VT'], '2025-01-03', '2025-01-06'), { code: 'MK_1902' });
    assert.equal(urls.length, 1);
  });

  const failures: [string, { status: number; body: unknown }][] = [
    ['401 invalid_access_key', { status: 401, body: marketFixture('marketstack-error-invalid-key.json') }],
    ['429 rate limit', { status: 429, body: marketFixture('marketstack-error-usage-limit.json') }],
    ['500', { status: 500, body: {} }],
    ['200 with an error body', { status: 200, body: marketFixture('marketstack-error-usage-limit.json') }],
    ['200 with an unexpected shape', { status: 200, body: { data: 'nope' } }],
    ['200 with a zero close', { status: 200, body: { pagination: { total: 1 }, data: [{ symbol: 'VT', date: '2025-01-03', close: 0 }] } }],
  ];
  for (const [name, answer] of failures) {
    it(`maps ${name} to MK_1901 without the key in the message, and keeps the reservation`, async () => {
      const { http } = fakeFetch(() => answer);
      const budget = countingBudget();
      const source = createMarketstackPriceSource({ accessKey: KEY, http, budget });
      const error = await source.fetchEndOfDay(['VT'], '2025-01-03', '2025-01-06').catch((caught: unknown) => caught);
      assert.equal((error as { code?: string }).code, 'MK_1901');
      assert.ok(!(error as Error).message.includes(KEY));
      assert.equal(budget.reserved, 1);
    });
  }
});

describe('Frankfurter FX source', () => {
  it('reads the recorded ECB range into EUR-based rates, one per published day and quote', async () => {
    const { http, urls } = fakeFetch(() => ({ status: 200, body: marketFixture('frankfurter-range.json') }));
    const source = createFrankfurterFxSource({ http });
    const rates = await source.fetchRange('EUR', ['GBP', 'USD', 'SGD', 'CNY', 'JPY', 'HKD'], '2025-01-03', '2025-01-07');

    assert.equal(urls[0].href, 'https://api.frankfurter.dev/v1/2025-01-03..2025-01-07?base=EUR&symbols=GBP%2CUSD%2CSGD%2CCNY%2CJPY%2CHKD');
    assert.equal(rates.length, 18);
    assert.deepEqual([...new Set(rates.map((rate) => rate.date))], ['2025-01-03', '2025-01-06', '2025-01-07']);
    const usd = rates.find((rate) => rate.quote === 'USD' && rate.date === '2025-01-06');
    assert.deepEqual(usd?.value, { base: 'EUR', quote: 'USD', date: '2025-01-06', rate: 1.0426, source: 'frankfurter:ecb' });
  });

  it('maps a 404 and a network failure to MK_1901', async () => {
    const notFound = createFrankfurterFxSource({ http: fakeFetch(() => ({ status: 404, body: marketFixture('frankfurter-not-found.json') })).http });
    await assert.rejects(notFound.fetchRange('EUR', ['USD'], '2025-01-03', '2025-01-07'), { code: 'MK_1901' });
    const offline = createFrankfurterFxSource({
      http: createHttpClient(async () => {
        throw new TypeError('fetch failed');
      }),
    });
    await assert.rejects(offline.fetchRange('EUR', ['USD'], '2025-01-03', '2025-01-07'), { code: 'MK_1901' });
  });
});
