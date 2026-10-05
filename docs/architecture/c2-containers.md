# C2: Containers

## Diagram: production
```mermaid
flowchart LR
  user([Browser]) -->|HTTPS| edge[Vercel edge routing]
  edge -->|"/*"| spa[Frontend · static SPA]
  edge -->|"/api/*"| api[Backend · Hono function]
  api --> db[(MongoDB Atlas)]
  spa -. "fetch /api/* + refresh cookie" .-> edge
```

## Diagram: local
```mermaid
flowchart LR
  dev([Browser])
  dev -->|make dev| vite[Vite dev server]
  vite -->|"/api/* proxy"| api[Backend · Node runner]
  dev -->|make proxy| nginx[nginx container]
  nginx -->|"/*"| dist[frontend/dist]
  nginx -->|"/api/*"| api
  dev -->|make prod| prod[Backend · Node runner, production mode: frontend/dist + /api]
  dev -->|make vercel-dev| vdev[vercel dev · vercel.json services]
  api --> db[(database at MONGODB_URI · Atlas)]
  prod --> db
  vdev --> db
  tests([make test]) --> mem[(in-memory mongod)]
```

## Containers
| Container | Technology | Responsibility |
|---|---|---|
| Frontend | React, Vite; static build | UI; access token in memory; calls `/api` |
| Edge routing | Vercel Services (`vercel.json`) | sends each request to frontend or backend |
| Backend | Hono on Vercel Functions; Node runner locally | API, auth, contract validation |
| Database | MongoDB Atlas, wherever `MONGODB_URI` points; tests use an in-memory mongod; local runs without it use the in-process memory store (`docs/infra/env.md`) | persistence |
| nginx | Docker, local only | production-like edge for testing |

## Request mapping
`docs/infra/routing.md`. Ports: `docs/infra/ports.md`.

## Data stores
| Store | Owner | Collections |
|---|---|---|
| MongoDB | auth module | `docs/backend/collections.md` |
