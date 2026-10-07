# Collections

- module list: each module's `infrastructure/db/schema/<module>-collections.ts`, its manifest's `collections`.
- module declaration: a `<collection>.schema.ts` beside that list, or inline in it.
- validator: only `<collection>.schema.ts` declarations carry a `$jsonSchema` validator; inline declarations carry indexes only.
- core list: `backend/src/core/db/schema/core-collections.ts`; each core collection is declared beside its mechanism.

| Collection | Owner | Holds | Non-obvious |
|---|---|---|---|
| `accounts` | finance | one cash balance per institution account and currency, per (`tenantId`, `userId`); `balance` in minor units | no unique index; (`tenantId`, `userId`, `currency`) is non-unique |
| `admin_settings` | admin | platform settings; the `key: 'platform_settings'` document holds `activeLlmProvider` | unique (`key`); writes are `$set` upserts; a missing document reads as provider `mock` |
| `api_keys` | admin | programmatic access keys per tenant: `keyPrefix`, SHA-256 `keyHash`, permissions, rate limit, monthly token quota | unique (`keyHash`); unique (`tenantId`, `keyPrefix`); revocation sets `status: 'REVOKED'`, the document stays |
| `asset_products` | wealth | investable product catalogue: symbol, asset class, currency, risk rating, costs, returns | unique (`symbol`) |
| `fx_rates` | market | one ECB reference rate per (`base`, `quote`, `date`), base EUR; append-only | unique (`base`, `quote`, `date`); appends are `$setOnInsert` upserts, so a fact is never overwritten; no weekend or TARGET-holiday dates |
| `market_snapshots` | analytics | one derived snapshot per data date `asOf`: symbols, annualized means, volatilities, covariance, window (`from`, `to`, `observations`), `computedAt` | unique (`asOf`); a recomputation replaces the document whole (`replaceOne` upsert), so it is not append-only like `prices` |
| `portfolios` | wealth | one portfolio per (`tenantId`, `userId`): holdings with current and target weights, risk scores, runway months | unique (`tenantId`, `userId`); writes replace the document whole (`replaceOne` upsert) |
| `prices` | market | one end-of-day close (and adjusted close) per (`symbol`, `date`), money in integer minor units; append-only | unique (`symbol`, `date`); appends are `$setOnInsert` upserts, so a fact is never overwritten |
| `processed_events` | core (events) | one document per (`handler`, `eventId`) an event handler has accepted | the unique (`handler`, `eventId`) index is the idempotency guard; no TTL |
| `request_budgets` | core (http-client) | one counter per provider per UTC month, `_id` = `<provider>:<YYYY-MM>` | reservations are one conditional `$inc` (`used` ≤ limit − count); old months stay as history |
| `sandbox_ledgers` | wealth | audit of simulated rebalances and carve-outs: executed trades, portfolio state hashes, passkey assertion proof, `auditDigest`, `transactionHash`; append-only | unique (`auditDigest`); unique (`transactionHash`); written only by `insertOne` |
| `sessions` | auth | one document per refresh token | TTL purges at `purgeAt` = `expiresAt` + 7 d; expiry is checked in code, never left to the TTL |
| `shared_plans` | sharing | shareable plan snapshots addressed by `shareToken`, with optional `passphraseHash` and `privacyMasked` | unique (`shareToken`); TTL deletes at `expiresAt` (`expireAfterSeconds: 0`) |
| `tenants` | admin | organisation workspaces: `slug`, plan, status, settings (baseline currency, corridors, default LLM provider, member cap, passkey requirement) | unique (`slug`) |
| `transactions` | finance | account movements per (`tenantId`, `userId`, `accountId`): category, amount and base-converted amount in minor units, optional remittance or tuition metadata | no unique index |
| `users` | auth | account root; embeds providers, roles, consents, withdrawal; optional nullable `tenantId` | provider uniqueness holds only among `status: 'ACTIVE'` users (partial unique index), not scoped by `tenantId` |

Source: `backend/src/core/db/schema/core-collections.ts`, `backend/src/core/events/processed-events.schema.ts`, `backend/src/core/http-client/request-budgets.schema.ts`, `backend/src/modules/admin/infrastructure/db/schema/`, `backend/src/modules/analytics/infrastructure/db/schema/`, `backend/src/modules/auth/infrastructure/db/schema/`, `backend/src/modules/finance/infrastructure/db/schema/`, `backend/src/modules/market/infrastructure/db/schema/`, `backend/src/modules/sharing/infrastructure/db/schema/`, `backend/src/modules/wealth/infrastructure/db/schema/`.
