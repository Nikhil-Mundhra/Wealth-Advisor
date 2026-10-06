import type { CollectionDefinition } from '#core/db/schema/collection-definition.ts';
import { ASSET_PRODUCTS_COLLECTION } from '../documents/asset-product.document.ts';
import { PORTFOLIOS_COLLECTION } from '../documents/portfolio.document.ts';
import { SANDBOX_LEDGERS_COLLECTION } from '../documents/sandbox-ledger.document.ts';

export const wealthCollections: readonly CollectionDefinition[] = [
  {
    name: ASSET_PRODUCTS_COLLECTION,
    indexes: [{ key: { symbol: 1 }, name: 'uk_asset_products_symbol', unique: true }],
  },
  {
    name: PORTFOLIOS_COLLECTION,
    indexes: [{ key: { tenantId: 1, userId: 1 }, name: 'uk_portfolios_tenant_user', unique: true }],
  },
  {
    name: SANDBOX_LEDGERS_COLLECTION,
    indexes: [
      { key: { auditDigest: 1 }, name: 'uk_sandbox_ledgers_digest', unique: true },
      { key: { transactionHash: 1 }, name: 'uk_sandbox_ledgers_txhash', unique: true },
    ],
  },
];
