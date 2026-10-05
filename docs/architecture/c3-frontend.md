# C3: Frontend components

## Diagram
```mermaid
flowchart TB
  main[main.tsx] --> app
  subgraph app[app]
    providers[providers] --> router[router]
    router --> guest[GuestRoute: signup, login]
    router --> protected[ProtectedRoute + app shell: dashboard, portfolio, cashflow, advisory, evidence, security settings]
    protected --> admin[AdminRoute: admin console]
    router --> share[public: /share/:token]
  end
  subgraph features[features]
    auth[auth: api, session, forms, error messages]
    marketing[marketing: highlight panel]
  end
  guest --> auth
  guest --> marketing
  protected --> auth
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
| `frontend/src/app/` | providers; router; `GuestRoute`, `ProtectedRoute`, `AdminRoute` guards; auth pages, signed-in pages inside the app shell, admin console, public `/share/:token` page | features, components, lib, rules |
| `frontend/src/features/auth/` | auth API calls, session, signup and login forms, auth error messages | components, lib, contracts, rules |
| `frontend/src/features/marketing/` | auth-page highlight panel | components |
| `frontend/src/components/` | shared UI primitives; layout: app shell (signed-in frame and navigation), split layout (auth pages) | lib |
| `frontend/src/lib/` | API client, query client, contract forms, error and validation messages, class helper, theme and locale stores, UI dictionaries, demo fixture, money formatting, motion hooks, chart colors | contracts, rules |
