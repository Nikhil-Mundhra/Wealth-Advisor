# Module contract

A module exports one manifest, built by `defineModule` (`backend/src/core/module/define-module.ts`) from a `ModuleContext` (`db`, `clock`, `ids`, `events`, `http`: outbound `HttpClient`, a fake in tests).

## Manifest
| Field | Meaning |
|---|---|
| `name` | unique module name; registering a name twice throws |
| `basePath` | `/name` (lowercase letters, digits, hyphens), mounted under `/api`; unique across modules |
| `routes` | `RouteDefinition`s from `RouteBuilder`, mounted on the module's router |
| `collections` | collection definitions (indexes, `$jsonSchema` validator); default none |
| `subscriptions` | handlers subscribed on the in-process event bus; default none |
| `errors` | optional `{ prefix, statuses }`: the module's error codes and their HTTP statuses, all under one prefix (`rules/docs/errors.md`) |

## Mounting
- `createApp` (`backend/src/app.ts`) builds every manifest listed in `backend/src/modules/index.ts`, registers it in `ModuleRegistry`, subscribes its handlers, and builds the error handler from every manifest's `errors`.
- A module whose api other modules consume returns `{ manifest, api }` from its composition root (`createMarketModule`); `backend/src/modules/index.ts` builds it first and passes `api` along an edge in `backend/docs/module-dependencies.md`.
- Route order under `/api`: `/health`, `/ai`, every module at its `basePath`, then the `/api/*` 404 fallback.
- `make db-indexes` (`backend/src/scripts/ensure-indexes.ts`) builds the same manifests and applies the core collections (`backend/src/core/db/schema/core-collections.ts`) and every module's `collections` to `MONGODB_URI`.
