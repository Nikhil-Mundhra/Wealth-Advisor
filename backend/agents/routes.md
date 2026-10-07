# Backend: routes and use cases

## Calls
- `contracts/docs/apis/index.md` : route docs

## Rules
- Handlers only map contract → command → use case → result → contract; `RouteBuilder` validates query, body and response.
- auth: user routes take the module's token middleware as a required argument and scope the query by the principal the middleware set (tenant from the token, never a request header); machine callers (cron) use `requireBearerSecret` from `core/http`, never a user-token middleware; proxies (`infra/nginx`, `vercel.json`) only route, never authenticate.

## Workflow
- add a route: contract first → route → use case → integration test → route doc (error ids only) in the same change

## File structure

```
backend/src/modules/admin/presentation/routes/admin.routes.ts : tenants, api-keys, and model management routes
backend/src/modules/advisory/presentation/routes/advisory.routes.ts : copilot chat advisory routes
backend/src/modules/analytics/presentation/mappers/result-to-contract.mapper.ts : MarketSnapshot → snapshot contract
backend/src/modules/analytics/presentation/routes/analytics.routes.ts : GET snapshot (optional asOf)
backend/src/modules/auth/application/dto/delete-account.command.ts : account deletion command
backend/src/modules/auth/application/dto/get-me.query.ts : current user id
backend/src/modules/auth/application/dto/login.command.ts : login input
backend/src/modules/auth/application/dto/logout.command.ts : one session or all sessions
backend/src/modules/auth/application/dto/refresh.command.ts : raw refresh token
backend/src/modules/auth/application/dto/signup.command.ts : signup input
backend/src/modules/auth/application/dto/signup.result.ts : signup output
backend/src/modules/auth/application/dto/token-pair.result.ts : access + refresh token, delivery hints
backend/src/modules/auth/application/dto/user-profile.result.ts : public user view
backend/src/modules/auth/application/use-cases/delete-account.use-case.ts : delete user record and drop all user sessions
backend/src/modules/auth/application/use-cases/get-me.use-case.ts : current user profile
backend/src/modules/auth/application/use-cases/signup.use-case.ts : create an email account; duplicate email is rejected
backend/src/modules/auth/domain/entities/user.entity.ts : User with embedded providers/roles; invariants in postInit
backend/src/modules/auth/domain/events/user-signed-up.event.ts : emitted after signup
backend/src/modules/auth/domain/policies/password.policy.ts : password rule for every writer, not only HTTP signup
backend/src/modules/auth/domain/value-objects/email.vo.ts : normalized, validated email
backend/src/modules/auth/domain/value-objects/role.vo.ts : USER | ADMIN
backend/src/modules/auth/presentation/mappers/contract-to-command.mapper.ts : request contract → command DTO
backend/src/modules/auth/presentation/mappers/result-to-contract.mapper.ts : result DTO → response contract
backend/src/modules/auth/presentation/routes/auth.routes.ts : signup, login, refresh, logout, logout-all
backend/src/modules/auth/presentation/routes/me.routes.ts : GET /me, DELETE /me
backend/src/modules/finance/presentation/routes/finance.routes.ts : accounts, transactions, and cashflow summary routes
backend/src/modules/market/presentation/mappers/result-to-contract.mapper.ts : market api results → quotes, fx-rates and refresh contracts
backend/src/modules/market/presentation/routes/market.routes.ts : GET quotes, fx (query base, date), refresh (cron bearer)
backend/src/modules/sharing/presentation/routes/sharing.routes.ts : create share token and fetch public shared plan routes
backend/src/modules/wealth/presentation/routes/wealth.routes.ts : products, portfolio, optimize, sandbox trade execution, and ledger routes
```
