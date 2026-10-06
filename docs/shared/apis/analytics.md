# Analytics APIs

## GET /api/analytics/snapshot
- responsibility: return the stored market snapshot (annualized means, volatilities and covariance of the tracked ETFs' daily log returns) for `asOf`, or the latest one; reads stored data only. Snapshots are computed when `market.data_refreshed` arrives (`docs/backend/events.md`), from the 365 days of closes ending at the event's `asOf` (a symbol's adjusted closes when every close in the window has one, else its raw closes), on dates where every tracked symbol has a close; fewer than 30 daily returns → no snapshot for that date
- contract: request query `SnapshotQuery`, response `SnapshotResponse` 200, errors `CORE_VALIDATION_FAILED`, `AN_1001`, `AN_1900`, `CORE_DB_UNCONFIGURED`; auth none (derived from public market data)
- nested route / query: `asOf` optional `YYYY-MM-DD` (`date.invalid`), the data date of the snapshot; omitted → the latest snapshot; `AN_1001` when none is stored for it
