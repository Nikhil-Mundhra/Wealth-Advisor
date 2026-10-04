# Frontend: forms, validation and error messages

## Calls
- `agents/frontend/ui.md` : `FormField` and controls
- `agents/frontend/data.md` : the mutation hook a form submits through
- `docs/shared/apis/index.md` : error ids each route returns
- `docs/shared/errors.md` : what each error code means

## Rules
- Forms use `useContractForm` with the contract schema; no hand-written field validation and no direct `useForm`.
- Every control sits in a `FormField`; its error text comes from `fieldError`.
- Field validation text lives only in `lib/validation/validation-messages.ts`, keyed by validation key.
- Error text for a feature's codes lives only in `features/<name>/errors/<name>-error-messages.ts`, with the field it belongs under; codes any feature can hit live in `lib/errors/shared-error-messages.ts`.

## Workflow
- add a form: contract schema → `features/<name>/components/<name>-form.tsx` with `useContractForm(schema, { defaultValues, messages })` → submit through the feature's mutation hook → test (validation, success, mapped error) → map line
- new user-facing error code: entry in the feature's error-messages map, or in the shared map if any feature can hit it
- new validation key: text in `lib/validation/validation-messages.ts` (typecheck fails until it exists)

## File structure

```
frontend/src/features/auth/components/login-form.tsx : login form validated by LoginRequest
frontend/src/features/auth/components/signup-form.test.tsx : contract messages, shared-rule checks, signup then login, server field issues
frontend/src/features/auth/components/signup-form.tsx : signup form validated by SignupRequest
frontend/src/features/auth/errors/auth-error-messages.ts : text and target field for auth error codes
frontend/src/lib/errors/resolve-error.test.ts : lookup order and text for every code and validation key
frontend/src/lib/errors/resolve-error.ts : error → message: feature map, then shared map, then fallback
frontend/src/lib/errors/shared-error-messages.ts : text for core and client error codes; generic fallback
frontend/src/lib/forms/apply-server-error.ts : places a failed submit: field issues under fields, else field or form message
frontend/src/lib/forms/use-contract-form.ts : react-hook-form validated by a contract, with server-error placement
frontend/src/lib/validation/validation-messages.ts : text for every validation key
```
