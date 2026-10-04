# Environment

Backend variables are validated once, on first use, by `backend/src/core/config/env.ts`. Local runs (`make backend`, `make prod`, `make db-indexes`, `make seed-demo`) load `.env.local` at the repo root when present; Vercel takes them from the project settings.

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
