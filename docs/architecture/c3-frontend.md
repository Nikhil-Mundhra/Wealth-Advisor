# C3: Frontend components

## Diagram
```mermaid
flowchart TB
  main[main.tsx] --> app
  subgraph app[app]
    providers[providers] --> router[router + route guards]
    router --> routes[routes: pages]
  end
  subgraph features[features]
    auth[auth: api, session, forms, error messages]
    marketing[marketing: highlight panel]
  end
  routes --> auth
  routes --> marketing
  app --> ui
  app --> lib
  auth --> ui[components: ui primitives, layout]
  marketing --> ui
  auth --> lib[lib: api client, query client, forms, errors, validation]
  ui --> lib
  lib --> api[(Backend /api)]
```

## Components
| Path | Responsibility | Depends on |
|---|---|---|
| `frontend/src/app/` | providers, router, guards, pages composing features | features, components, lib |
| `frontend/src/features/auth/` | auth API calls, session, signup and login forms, auth error messages | components, lib, contracts, rules |
| `frontend/src/features/marketing/` | auth-page highlight panel | components |
| `frontend/src/components/` | shared UI primitives and layout | lib |
| `frontend/src/lib/` | API client, query client, contract forms, error and validation messages, class helper | contracts, rules |
