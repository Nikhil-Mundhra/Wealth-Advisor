# C3: Frontend components

## Diagram
```mermaid
flowchart TB
  main[main.tsx] --> app
  subgraph app[app]
    providers[providers] --> router[router]
    router --> guest[GuestRoute: signup, login]
    router --> onboarding[ProtectedRoute: onboarding]
    router --> protected[ProtectedRoute + app shell: dashboard, portfolio, cashflow, advisory, evidence, security settings]
    protected --> adminroute[AdminRoute: admin console, tenants, API keys, models]
    router --> share[public: /share/:token]
  end
  subgraph features[features]
    auth[auth: api, session, forms, error messages]
    marketing[marketing: highlight panel]
    adminfeat[admin: admin api calls]
    profiling[profiling: profile store, questionnaire, profiling modal, summary card]
  end
  guest --> auth
  guest --> marketing
  protected --> auth
  protected --> profiling
  onboarding --> profiling
  adminroute --> adminfeat
  adminfeat --> lib
  profiling --> ui
  profiling --> lib
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
| `frontend/src/app/` | providers; router; `GuestRoute`, `ProtectedRoute`, `AdminRoute` guards; auth pages, onboarding page, signed-in pages inside the app shell, admin console, public `/share/:token` page | features, components, lib, rules |
| `frontend/src/features/admin/` | admin API calls: tenants, API keys and revoke, model settings | lib, contracts |
| `frontend/src/features/auth/` | auth API calls, session, signup and login forms, auth error messages | components, lib, contracts, rules |
| `frontend/src/features/marketing/` | auth-page highlight panel | components |
| `frontend/src/features/profiling/` | profile store (`localStorage`, keyed by email), profiling questionnaire, country tag input, profiling modal, profile summary card, country list | components, lib, rules, `country-list` |
| `frontend/src/components/` | shared UI primitives; layout: app shell (signed-in frame and navigation), split layout (auth pages) | lib |
| `frontend/src/lib/` | API client, query client, contract forms, error and validation messages, class helper, theme and locale stores, UI dictionaries, demo fixture, money formatting, motion hooks, chart colors | contracts, rules |
