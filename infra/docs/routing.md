# Request routing

## Mapping
| Request | Served by |
|---|---|
| `/api/*` | backend |
| `/assets/*` | frontend static files (fingerprinted) |
| `/*` | frontend static file if it exists, else `index.html` (SPA fallback) |

Every implementer below serves this same mapping.

## Implementers
| Runtime | File | How |
|---|---|---|
| Vercel (production, `make vercel-dev`) | `vercel.json` | top-level `rewrites`: `/api/(.*)` → `backend` service, `/(.*)` → `frontend` service; the frontend service rewrites unmatched paths to `/index.html` |
| nginx (`make proxy`) | `infra/nginx/default.conf` | `location /api/` → backend upstream; `/assets/` → files, cached immutable; `/` → `try_files $uri /index.html`, `no-cache` |
| Vite dev server (`make frontend`) | `frontend/vite.config.ts` | `server.proxy` sends `/api` to the backend; Vite serves everything else |
| Node, production mode (`make prod`) | `backend/src/node-server.ts` | `/api` routes first, then static files from `frontend/dist`, then `index.html` |
