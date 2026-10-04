# Frontend: forms, validation and error text

## Calls
- `docs/shared/apis/index.md` : error ids each route returns
- `docs/shared/errors.md` : what each code means

## Rules
- Forms use `useContractForm` with the contract schema; never `useForm` directly or hand-written field validation.
- Every control sits in a `FormField`.
- Validation text lives only in `lib/validation/validation-messages.ts`.
- Error text: a feature's own codes in `features/<name>/errors/<name>-error-messages.ts`; codes any feature can hit in `lib/errors/shared-error-messages.ts`.

## Workflow
- new user-facing error code → the feature's error-messages map, or the shared map

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
