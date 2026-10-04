# Ports

| Range | Role | Port | Set in |
|---|---|---|---|
| — | Production (Vercel) | platform-managed | — |
| 8088–8099 | Edge, local | `8088` nginx (`make proxy`) | Makefile `PROXY_PORT`; `infra/docker-compose.yml` fallback |
| 8088–8099 | Edge, local | `8089` `vercel dev` (`make vercel-dev`) | Makefile `VERCEL_PORT` |
| 5170–5179 | Frontend dev (Vite) | `5173` | `frontend/vite.config.ts` `server.port`; Makefile `FRONTEND_PORT` (start/stop/status checks) |
| 3000–3099 | Backend services | `3000` API; under `make prod` one Node process serves `frontend/dist` and `/api` here | Makefile `BACKEND_PORT`; `backend/src/node-server.ts` fallback; `frontend/vite.config.ts` proxy target; `infra/nginx/default.conf` upstream |

The backend port is written in all four of its files; they change together.
