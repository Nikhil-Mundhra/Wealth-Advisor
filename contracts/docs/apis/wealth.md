# Wealth APIs

## GET /api/wealth/products
- responsibility: return every stored asset product; not scoped to the caller
- contract: request none, response `AssetProductListResponse` 200, errors `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth optional Bearer (`backend/docs/auth-token.md` `optionalAuth`): no token → demo account; a present but invalid token → `AU_1005`

## GET /api/wealth/portfolio
- responsibility: return the caller's portfolio with its holdings
- contract: request none, response `PortfolioResponse` 200, errors `AU_1005`, `AU_1901`, `WL_1001`, `CORE_DB_UNCONFIGURED`; auth optional Bearer (`backend/docs/auth-token.md` `optionalAuth`): no token → demo account; a present but invalid token → `AU_1005`

## POST /api/wealth/optimize
- responsibility: propose a rebalance of the caller's portfolio from each holding's stored current and target weights; sells every holding at least 0.001 above target, buys holdings at least 0.001 below target in holding order up to the sell proceeds, and leaves surplus proceeds in cash; reads the latest market snapshot only for the rationale text; writes nothing
- contract: request none, response `RebalanceProposalResponse` 200, errors `AU_1005`, `AU_1901`, `WL_1001`, `CORE_DB_UNCONFIGURED`; auth optional Bearer (`backend/docs/auth-token.md` `optionalAuth`): no token → demo account; a present but invalid token → `AU_1005`

## POST /api/wealth/execute
- responsibility: execute a sandbox rebalance of the caller's portfolio; each trade's holding moves to its stored target weight; appends a `COMMITTED` ledger entry with state hashes, the passkey assertion and a SHA-256 audit digest, then saves the portfolio; no passkey registration exists, so every assertion that passes the presence check is refused with `WL_1004` before any read or write
- contract: request `ExecuteTradeRequest`, response `ExecuteTradeResponse` 200, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1005`, `AU_1901`, `WL_1003`, `WL_1004`, `WL_1001`, `WL_1005`, `WL_1900`, `CORE_DB_UNCONFIGURED`; auth required Bearer (`backend/docs/auth-token.md` `requireAuth`): no token or an invalid token → `AU_1005`

## GET /api/wealth/ledger
- responsibility: return the caller's sandbox ledger entries
- contract: request none, response `SandboxLedgerResponse` 200, errors `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth optional Bearer (`backend/docs/auth-token.md` `optionalAuth`): no token → demo account; a present but invalid token → `AU_1005`
