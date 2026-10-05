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
rules/src/asset-class.rule.ts : ASSET_CLASSES, AssetClass, isAssetClass
rules/src/burn-rate.rule.ts : RUNWAY_CRITICAL/HEALTHY_MONTHS, RunwayBand, runwayBand
rules/src/client-type.rule.ts : CLIENT_TYPES, ClientType, isClientType
rules/src/currency.rule.ts : CURRENCIES, Currency, isCurrency
rules/src/display-name.rule.ts : max length, normalize, isDisplayName
rules/src/email.rule.ts : max length, pattern (copied from zod), normalize, isEmail
rules/src/error-codes.ts : module prefixes, CORE and AUTH codes, ErrorCode types
rules/src/household-mode.rule.ts : HOUSEHOLD_MODES, HouseholdMode, isHouseholdMode
rules/src/index.ts : public barrel
rules/src/llm-provider.rule.ts : LLM_PROVIDERS, LlmProvider, isLlmProvider
rules/src/locale.rule.ts : LOCALES, Locale, DEFAULT_LOCALE, isLocale
rules/src/password.rule.ts : min/max length, isPasswordLength
rules/src/permission-tier.rule.ts : PERMISSION_TIERS, PermissionTier, isPermissionTier
rules/src/refresh-token.rule.ts : byte count, base64url pattern, isRefreshToken
rules/src/validation-keys.ts : VALIDATION_KEYS, ValidationKey, isValidationKey
rules/src/viewport.rule.ts : MIN_TOUCH_TARGET_PX, MOBILE_BREAKPOINT_PX
rules/tsconfig.json : typecheck settings
```
