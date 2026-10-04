# Agent

## File structure

```
*.md : documentation (map: agents/writing_docs.md)
.gitignore : keeps node_modules, dist, .env*, .run, .vercel out of Git
.vercelignore : keeps env files, build output and infra/ out of Vercel uploads
Makefile : start/stop/status for frontend, backend, proxy; test, db-indexes, jwt-keys
backend/ : Hono API (map: agents/implementation_backend.md)
contracts/package.json : exports src/index.ts directly (no build step)
contracts/src/auth/login.contract.ts : login request (email, password, clientType, rememberMe)
contracts/src/auth/me.contract.ts : current-user response
contracts/src/auth/refresh.contract.ts : refresh and logout requests (body token optional; web uses the cookie)
contracts/src/auth/signup.contract.ts : signup request and response
contracts/src/auth/token-pair.contract.ts : token response (refreshToken only for mobile)
contracts/src/common/client-type.contract.ts : WEB | IOS | ANDROID
contracts/src/common/error.contract.ts : error response envelope { code, message }
contracts/src/index.ts : public barrel; the only import path consumers use
contracts/tsconfig.json : typecheck settings
frontend/ : Vite + React static app (map: agents/implementation_frontend.md)
infra/docker-compose.yml : nginx container on :8088 in front of the host backend
infra/nginx/default.conf : serves frontend/dist, proxies /api to :3000, cache and security headers
package.json : npm workspaces root (contracts, frontend, backend) and top-level scripts
vercel.json : Vercel Services routing: /api/* → backend, everything else → frontend
```

## Implementation guide

- `agents/writing_docs.md` : when you are writing documentation (likely a .md file)
- `agents/implementation_backend.md` : when you are implementing backend code
- `agents/implementation_frontend.md` : when you are implementing frontend code
- `agents/sync_docs.md` : when syncing documentation and maps with recent commits
- `agents/sync_agent.md` : when syncing Agent.md and agents/ maps, guide index and calls with recent commits
- `docs/shared/apis/index.md` : when you add, change or call an /api route (contract, status, error codes)
