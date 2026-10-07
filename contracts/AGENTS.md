# Contracts

## Route
- API routes: which route uses which contract → `contracts/docs/index.md`

## Rules
- A schema and its `z.infer` type share one name.
- Fields take limits, patterns and validation keys from `@wealth-advisor/rules`, and fail with a validation key as the message.
- No runtime logic beyond schemas; an event contract also exports its `{ type, version }` constant.

## Workflow
- contract change → `npm run typecheck` → route doc in the same change

## File structure

```
contracts/package.json : exports src/index.ts directly (no build step)
contracts/src/admin/admin-settings.contract.ts : admin settings and model provider contracts
contracts/src/advisory/advisory-chat.contract.ts : advisory copilot chat request and response contracts
contracts/src/analytics/snapshot.contract.ts : market snapshot query (optional asOf) and response (asOf, symbols, annualized means, volatilities, covariance, window)
contracts/src/auth/login.contract.ts : login request (email, password, clientType default WEB, rememberMe)
contracts/src/auth/logout.contract.ts : logout request (body token optional; web uses the cookie)
contracts/src/auth/me.contract.ts : current-user response
contracts/src/auth/passkey.contract.ts : FIDO2 passkey registration, challenge, and verification contracts
contracts/src/auth/refresh.contract.ts : refresh request (body token optional; web uses the cookie)
contracts/src/auth/signup.contract.ts : signup request and response
contracts/src/auth/token-pair.contract.ts : token response (refreshToken only for mobile)
contracts/src/common/error.contract.ts : error response envelope { code, message, issues? }
contracts/src/events/market-data-refreshed.event.ts : MARKET_DATA_REFRESHED type and version; v1 payload (asOf, symbols, fxBase)
contracts/src/fields/client-type.field.ts : WEB | IOS | ANDROID
contracts/src/fields/currency.field.ts : ISO currency from CURRENCIES; fails with currency.invalid
contracts/src/fields/display-name.field.ts : trimmed display name with length limit
contracts/src/fields/email.field.ts : signup email (normalized, pattern-checked) and login email (presence and length only)
contracts/src/fields/iso-date.field.ts : calendar date YYYY-MM-DD; fails with date.invalid
contracts/src/fields/money.field.ts : integer amount in minor units with its currency
contracts/src/fields/password.field.ts : new password (policy length) and login password (presence and upper bound)
contracts/src/fields/refresh-token.field.ts : refresh token format
contracts/src/finance/account.contract.ts : bank accounts and balances list/create contracts
contracts/src/finance/cashflow.contract.ts : cashflow summary and household runway contracts
contracts/src/finance/transaction.contract.ts : cross-border transactions and remittance metadata contracts
contracts/src/index.ts : public barrel; the only import path consumers use
contracts/src/market/fx-rates.contract.ts : FX rates query (base, optional date) and response (asOf, base, rates per quote currency)
contracts/src/market/quotes.contract.ts : latest quotes response (asOf, symbol, asset class, close as money, source)
contracts/src/market/refresh.contract.ts : refresh response (asOf, prices and rates stored, requested from..to)
contracts/src/profiling/fundamental-ratios.contract.ts : AssetFundamentalMetricsSchema and FundamentalEvaluationSchema
contracts/src/profiling/profile-answers.contract.ts : ProfilingAnswersSchema (7 questions) and ProfileSummarySchema
contracts/src/sharing/sharing.contract.ts : shareable plan creation, snapshot, and token contracts
contracts/src/tenant/api-key.contract.ts : tenant API keys list, create, and revoke contracts
contracts/src/tenant/tenant.contract.ts : tenant settings and onboarding contracts
contracts/src/wealth/asset-product.contract.ts : asset products catalog and UCITS ETF metadata contracts
contracts/src/wealth/optimizer.contract.ts : portfolio optimization and rebalancing proposal contracts
contracts/src/wealth/portfolio.contract.ts : portfolio holdings and target weight contracts
contracts/src/wealth/sandbox-ledger.contract.ts : sandbox trade execution and cryptographic ledger contracts
contracts/tsconfig.json : typecheck settings
```
