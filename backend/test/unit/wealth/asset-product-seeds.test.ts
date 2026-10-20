import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ASSET_PRODUCT_SEEDS,
  upsertAssetProducts,
} from '../../../src/modules/wealth/infrastructure/db/seed/asset-product-seeds.ts';

// Minimal stand-in for the Mongo collection: supports the $set + $setOnInsert shape the seeder uses.
function fakeCollection(initial: Array<Record<string, any>> = []) {
  const store = new Map<string, Record<string, any>>(initial.map((doc) => [doc.symbol, { ...doc }]));
  return {
    store,
    async updateOne(
      filter: { symbol: string },
      update: { $set: Record<string, any>; $setOnInsert: Record<string, any> },
      opts: { upsert: boolean },
    ) {
      assert.equal(opts.upsert, true);
      const existing = store.get(filter.symbol);
      if (existing) {
        store.set(filter.symbol, { ...existing, ...update.$set });
        return { upsertedCount: 0, matchedCount: 1 };
      }
      store.set(filter.symbol, { ...update.$setOnInsert, ...update.$set });
      return { upsertedCount: 1, matchedCount: 0 };
    },
  };
}

describe('asset-product seeds', () => {
  it('covers every symbol the optimizer can propose', async () => {
    const symbols = new Set(ASSET_PRODUCT_SEEDS.map((p) => p.symbol));
    for (const required of ['VWCE.DE', 'IEGA.AS', 'HDFC_TOP100', 'VWRL.AS', 'CSPX.LSE']) {
      assert.ok(symbols.has(required), `catalog missing ${required}`);
    }
    for (const product of ASSET_PRODUCT_SEEDS) {
      assert.ok(product.securityType, `${product.symbol} needs a securityType`);
    }
  });

  it('seeds twice without duplicates, backfills missing symbols, and repairs legacy rows', async () => {
    // An older database: three products predating the securityType column, one with a stale assetClass.
    const legacy = [
      { symbol: 'CSPX.LSE', name: 'iShares Core S&P 500 UCITS ETF' },
      { symbol: 'IEAC.LSE', name: 'iShares Core EUR Corp Bond UCITS ETF', assetClass: 'GOV' },
      { symbol: 'XEON.XETRA', name: 'Xtrackers EUR Overnight Rate Swap UCITS ETF' },
    ];
    const col = fakeCollection(legacy);
    const now = new Date('2026-10-20T00:00:00Z');

    const first = await upsertAssetProducts(col as any, now);
    assert.equal(first.inserted, ASSET_PRODUCT_SEEDS.length - legacy.length);
    assert.equal(col.store.size, ASSET_PRODUCT_SEEDS.length);
    // Legacy rows keep their identity but are repaired to the current catalog values.
    const repaired = col.store.get('IEAC.LSE')!;
    assert.equal(repaired.assetClass, 'FIXED_INCOME_CORP');
    assert.equal(repaired.securityType, 'MUTUAL_FUND_ETF');
    assert.equal(repaired.updatedAt, now);

    const second = await upsertAssetProducts(col as any, now);
    assert.equal(second.inserted, 0);
    assert.equal(second.kept, ASSET_PRODUCT_SEEDS.length);
    assert.equal(col.store.size, ASSET_PRODUCT_SEEDS.length);
  });
});
