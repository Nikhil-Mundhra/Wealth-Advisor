# Collections

Declared in each module's `infrastructure/db/schema/<collection>.schema.ts` and listed in its manifest's `collections`; core mechanisms declare theirs beside the mechanism, listed in `backend/src/core/db/schema/core-collections.ts`.

| Collection | Owner | Holds | Non-obvious |
|---|---|---|---|
| `users` | auth | account root; embeds providers, roles, consents, withdrawal | provider uniqueness holds only among `status: 'ACTIVE'` users (partial unique index) |
| `fx_rates` | market | one ECB reference rate per (`base`, `quote`, `date`), base EUR; append-only | unique (`base`, `quote`, `date`); appends are `$setOnInsert` upserts, so a fact is never overwritten; no weekend or TARGET-holiday dates |
| `market_snapshots` | analytics | one derived snapshot per data date `asOf`: symbols, annualized means, volatilities, covariance, window (`from`, `to`, `observations`), `computedAt` | unique (`asOf`); a recomputation replaces the document whole (`replaceOne` upsert), so it is not append-only like `prices` |
| `prices` | market | one end-of-day close (and adjusted close) per (`symbol`, `date`), money in integer minor units; append-only | unique (`symbol`, `date`); appends are `$setOnInsert` upserts, so a fact is never overwritten |
| `processed_events` | core (events) | one document per (`handler`, `eventId`) an event handler has accepted | the unique (`handler`, `eventId`) index is the idempotency guard; no TTL |
| `request_budgets` | core (http-client) | one counter per provider per UTC month, `_id` = `<provider>:<YYYY-MM>` | reservations are one conditional `$inc` (`used` ≤ limit − count); old months stay as history |
| `sessions` | auth | one document per refresh token | TTL purges at `purgeAt` = `expiresAt` + 7 d; the TTL monitor runs about once a minute, so expiry is checked in code |

Source: `backend/src/modules/analytics/infrastructure/db/schema/`, `backend/src/modules/auth/infrastructure/db/schema/`, `backend/src/modules/market/infrastructure/db/schema/`, `backend/src/core/events/processed-events.schema.ts`, `backend/src/core/http-client/request-budgets.schema.ts`.
