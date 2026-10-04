# Contracts

## Calls
- `docs/shared/apis/index.md` : which route uses which contract
- `docs/shared/errors.md` : the error envelope and the codes it carries

## Rules
- Every request and response shape is a zod schema here; the schema and its `z.infer` type share one name.
- Reusable field schemas live in `contracts/src/fields`; limits, patterns and validation keys come from `@wealth-advisor/rules`, never literals.
- A field fails with a validation key as its message, so clients map it to text.
- Consumers import only `@wealth-advisor/contracts` (the barrel `contracts/src/index.ts`); no deep imports.
- No build step and no runtime logic beyond schemas.

## Workflow
- add a contract: `contracts/src/<module>/<name>.contract.ts` built from field schemas → export from `contracts/src/index.ts` → the route doc names it → map line
- add a field: limits and validation keys in `rules/` → `contracts/src/fields/<name>.field.ts` → export from `contracts/src/index.ts` → frontend validation text
- change a contract: grep its name in `backend/` and `frontend/` → update every caller in the same change → `npm run typecheck` → route doc

## File structure

```
contracts/package.json : exports src/index.ts directly (no build step)
contracts/src/auth/login.contract.ts : login request (email, password, clientType default WEB, rememberMe)
contracts/src/auth/logout.contract.ts : logout request (body token optional; web uses the cookie)
contracts/src/auth/me.contract.ts : current-user response
contracts/src/auth/refresh.contract.ts : refresh request (body token optional; web uses the cookie)
contracts/src/auth/signup.contract.ts : signup request and response
contracts/src/auth/token-pair.contract.ts : token response (refreshToken only for mobile)
contracts/src/common/error.contract.ts : error response envelope { code, message, issues? }
contracts/src/fields/client-type.field.ts : WEB | IOS | ANDROID
contracts/src/fields/display-name.field.ts : trimmed display name with length limit
contracts/src/fields/email.field.ts : signup email (normalized, pattern-checked) and login email (presence and length only)
contracts/src/fields/password.field.ts : new password (policy length) and login password (presence and upper bound)
contracts/src/fields/refresh-token.field.ts : refresh token format
contracts/src/index.ts : public barrel; the only import path consumers use
contracts/tsconfig.json : typecheck settings
```
