# Finance APIs

## GET /api/finance/accounts
- responsibility: return the caller's accounts; `baseBalance` is the balance for an EUR account, today's ECB spot conversion to EUR otherwise, null when no rate converts it
- contract: request none, response `AccountListResponse` 200, errors `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth optional Bearer (`backend/docs/auth-token.md` `optionalAuth`): no token → demo account; a present but invalid token → `AU_1005`

## POST /api/finance/accounts
- responsibility: create an account in the caller's scope; `baseBalance` is the balance for an EUR account, null otherwise
- contract: request `CreateAccountRequest`, response `AccountDto` 201, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1005`, `AU_1901`, `FN_1900`, `CORE_DB_UNCONFIGURED`; auth required Bearer (`backend/docs/auth-token.md` `requireAuth`): no token or an invalid token → `AU_1005`

## GET /api/finance/transactions
- responsibility: return the caller's transactions
- contract: request none, response `TransactionListResponse` 200, errors `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth optional Bearer (`backend/docs/auth-token.md` `optionalAuth`): no token → demo account; a present but invalid token → `AU_1005`

## GET /api/finance/cashflow
- responsibility: return the caller's monthly inflow, outflow, net cashflow, liquid reserves (accounts valued as in `GET /api/finance/accounts`; unvalued accounts counted in `unvaluedAccountCount`, left out of reserves), runway and the EUR_CNY and GBP_SGD remittance corridors; corridor `lastRate` is the stored ECB rate, 7.82 (EUR_CNY) and 1.71 (GBP_SGD) when none is stored; corridor targets and recipients are fixed values
- contract: request query `CashflowQuery`, response `CashflowSummaryResponse` 200, errors `CORE_VALIDATION_FAILED`, `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth optional Bearer (`backend/docs/auth-token.md` `optionalAuth`): no token → demo account; a present but invalid token → `AU_1005`
- nested route / query: `householdMode` optional, default `FAMILY_HOUSEHOLD`; a value outside `HOUSEHOLD_MODES` → `CORE_VALIDATION_FAILED` with issue `household_mode.invalid`
