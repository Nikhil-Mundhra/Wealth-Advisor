# Shared: rules

## Calls
- `agents/backend/errors.md` : adding an error code

## Rules
- Imports nothing (no zod, no node, no workspace); exports constants, pure `is*`/`normalize*` functions and their types; `is*` expects normalized input.
- Error codes and validation keys are wire-visible: never reuse, rename or renumber; keys are `<field>.<reason>`.
- `EMAIL_PATTERN` copies zod's `z.email()`; re-check it on zod upgrades.

## Workflow
- new validation key: `rules/src/validation-keys.ts` → contract field → text in `frontend/src/lib/validation/validation-messages.ts`

## File structure

```
rules/package.json : exports src/index.ts directly; no dependencies
rules/src/client-type.rule.ts : CLIENT_TYPES, ClientType, isClientType
rules/src/display-name.rule.ts : max length, normalize, isDisplayName
rules/src/email.rule.ts : max length, pattern (copied from zod), normalize, isEmail
rules/src/error-codes.ts : module prefixes, CORE and AUTH codes, ErrorCode types
rules/src/index.ts : public barrel
rules/src/password.rule.ts : min/max length, isPasswordLength
rules/src/refresh-token.rule.ts : byte count, base64url pattern, isRefreshToken
rules/src/validation-keys.ts : VALIDATION_KEYS, ValidationKey, isValidationKey
rules/tsconfig.json : typecheck settings
```
