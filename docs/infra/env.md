# Environment

Backend variables are validated once, on first use, by `backend/src/core/config/env.ts`. Local runs (`make backend`, `make prod`, `make db-indexes`, `make seed-demo`) load `.env.local` then `.env` at the repo root when present — the later file wins, so **`.env` overrides `.env.local`**. Vercel takes them from the project settings and reads neither file.

Local convention: `.env` points at the local Mongo (`mongodb://127.0.0.1:27017`); Atlas stays out of local files entirely.

Production (deployer checklist): set these in the Vercel project settings, environments Production and Preview:
- `MONGODB_URI` = the Atlas SRV string, e.g. `mongodb+srv://dewa-api:<password>@cluster0.kz63cnu.mongodb.net/?appName=Cluster0`
- `MONGODB_DB_NAME` = `wealth_advisor` (optional, this is the default)
- `AUTH_JWT_PRIVATE_KEY` / `AUTH_JWT_PUBLIC_KEY` = PEM pair from `make jwt-keys` (required in production; `\n` escapes allowed)
- `NODE_ENV` = `production` (set automatically by Vercel)

Then run `make db-indexes` once against the Atlas URI to apply validators and indexes.

| Var | Default | Required | Effect |
|---|---|---|---|
| `NODE_ENV` | `development` | no | `production` disables the ephemeral JWT key pair and makes `backend/src/node-server.ts` serve `frontend/dist`; `make prod` sets it; tests set `test` |
| `MONGODB_URI` | none | by every route that touches the database | unset → those routes return `CORE_DB_UNCONFIGURED`; `/api/health`, `/api/ai` and the 404 fallback work without it |
| `MONGODB_DB_NAME` | `wealth_advisor` | no | database name |
| `AUTH_JWT_PRIVATE_KEY`, `AUTH_JWT_PUBLIC_KEY` | none | in production | PEM, `\n` escapes allowed; `make jwt-keys` prints a pair. Neither set outside production → ephemeral pair (tokens die on restart). Only one set, or neither in production → `AU_1901` |
| `AUTH_JWT_ISSUER` | `wealth-advisor-auth` | no | JWT `iss` |
| `AUTH_JWT_AUDIENCE` | `wealth-advisor-api` | no | JWT `aud` |
| `AUTH_JWT_KEY_ID` | `wa-1` | no | JWT header `kid` |
| `AUTH_ACCESS_TOKEN_TTL_SECONDS` | `900` (15 min) | no | access token lifetime |
| `AUTH_REFRESH_TOKEN_TTL_SECONDS` | `1209600` (14 d) | no | refresh session lifetime |
| `AUTH_REFRESH_REUSE_GRACE_SECONDS` | `5` | no | window in which a rotated token counts as a retry |
| `PORT` | backend port (`docs/infra/ports.md`) | no | listen port of `backend/src/node-server.ts`; set by `make backend` and `make prod` |
| `PROXY_PORT` | proxy port (`docs/infra/ports.md`) | no | nginx host port in `infra/docker-compose.yml`; set by `make proxy` |
