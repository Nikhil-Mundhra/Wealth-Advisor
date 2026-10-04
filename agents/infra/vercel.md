# Infra: Vercel

## Calls
- `docs/infra/routing.md` : the request mapping `vercel.json` implements
- `docs/infra/env.md` : variables to set in the Vercel project

## Rules
- Check routing changes locally with `make vercel-dev` before deploying.
- Run `make db-indexes` against the production `MONGODB_URI` whenever a deploy adds or changes collections or indexes.

## Workflow
- change routing: `vercel.json` → the other implementers in `docs/infra/routing.md` → `docs/infra/routing.md` → `make vercel-dev`
- deploy: Vercel CLI → `make db-indexes` if collections changed

## File structure

```
vercel.json : Vercel Services: frontend and backend service definitions and top-level rewrites
```
