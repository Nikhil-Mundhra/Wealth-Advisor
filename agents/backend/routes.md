# Backend: routes and use cases

## Calls
- `agents/shared/contracts.md` : adding or changing a contract
- `docs/shared/apis/index.md` : route docs; update the route's doc in the same change
- `agents/backend/errors.md` : when a route needs a new error code
- `agents/backend/testing.md` : integration tests

## Rules
- Declare routes with `RouteBuilder` only; it validates the body and the response against their contracts.
- A handler only maps contract → command → use case → result → contract.
- One use case per class, one `execute(command)`; ports for any new I/O.

## Workflow
- add a route: contract in `contracts/src` → `RouteBuilder` route in `presentation/routes` → use case → port + adapter if new I/O → integration test → route doc in `docs/shared/apis` (error ids only) → map line
- add a use case: command/result DTOs → `use-cases/<name>.use-case.ts` → wire in `<module>.module.ts` → test → map line

## File structure

```
backend/src/modules/auth/application/dto/get-me.query.ts : current user id
backend/src/modules/auth/application/dto/login.command.ts : login input
backend/src/modules/auth/application/dto/logout.command.ts : one session or all sessions
backend/src/modules/auth/application/dto/refresh.command.ts : raw refresh token
backend/src/modules/auth/application/dto/signup.command.ts : signup input
backend/src/modules/auth/application/dto/signup.result.ts : signup output
backend/src/modules/auth/application/dto/token-pair.result.ts : access + refresh token, delivery hints
backend/src/modules/auth/application/dto/user-profile.result.ts : public user view
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
backend/src/modules/auth/presentation/routes/me.routes.ts : GET /me
```
