# Ports

| Range | Role | Mapping |
|---|---|---|
| — | Production (Vercel) | `vercel.json`: `/api/*` → `backend/`, `/*` → `frontend/` (static) |
| 8088–8099 | Edge, local | `:8088` nginx, `:8089` `vercel dev` → same mapping as production |
| 5170–5179 | Frontend dev (Vite) | `:5173` → `/api/*` → `:3000` |
| 3000–3099 | Backend services | `:3000` API |
