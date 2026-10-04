# Shared packages

## Route
- request and response schemas → `agents/shared/contracts.md`
- limits, patterns, error codes, validation keys → `agents/shared/rules.md`
- API routes and the error catalogue → `docs/shared/index.md`

## Axes
- error codes → `agents/backend/errors.md`
- field validation text → `agents/frontend/forms.md`

## Rules
- dependency: `rules` (imports nothing) ← `contracts` (rules, zod) ← `backend`, `frontend`.
