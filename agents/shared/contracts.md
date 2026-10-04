# Shared: contracts

## Calls
- `docs/shared/apis/index.md` : which route uses which contract

## Rules
- A schema and its `z.infer` type share one name.
- Fields take limits, patterns and validation keys from `@wealth-advisor/rules`, and fail with a validation key as the message.
- No runtime logic beyond schemas.

## Workflow
- contract change → `npm run typecheck` → route doc in the same change

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
