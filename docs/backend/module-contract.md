# Module contract

A module exports one manifest, built by `defineModule` (`backend/src/core/module/define-module.ts`) from a `ModuleContext` (`db`, `clock`, `ids`, `events`).

## Manifest
| Field | Meaning |
|---|---|
| `name` | unique module name; registering a name twice throws |
| `basePath` | `/name` (lowercase letters, digits, hyphens), mounted under `/api`; unique across modules |
| `routes` | `RouteDefinition`s from `RouteBuilder`, mounted on the module's router |
| `collections` | collection definitions (indexes, `$jsonSchema` validator); default none |
| `subscriptions` | handlers subscribed on the in-process event bus; default none |
| `errors` | optional `{ prefix, statuses }`: the module's error codes and their HTTP statuses, all under one prefix (`docs/shared/errors.md`) |

## Mounting
- `createApp` (`backend/src/app.ts`) builds every manifest listed in `backend/src/modules/index.ts`, registers it in `ModuleRegistry`, subscribes its handlers, and builds the error handler from every manifest's `errors`.
- Route order under `/api`: `/health`, `/ai`, every module at its `basePath`, then the `/api/*` 404 fallback.
- `make db-indexes` (`backend/src/scripts/ensure-indexes.ts`) builds the same manifests and applies every module's `collections` to `MONGODB_URI`.
