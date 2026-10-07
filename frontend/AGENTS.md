# Frontend

## Route
- styling, accessibility: UI primitives, layout, tokens → `frontend/agents/ui.md`
- forms, validation, error text → `frontend/agents/forms.md`
- access: pages, router, guards → `frontend/agents/pages.md`
- server state: endpoint calls, query and mutation hooks → `frontend/agents/data.md`
- session and token security → `frontend/agents/session.md`
- component boundaries → `docs/architecture/c3-frontend.md`
- frontend facts: design tokens, session flow, onboarding → `frontend/docs/index.md`

## Axes
- contract shapes → `contracts/AGENTS.md`

## Rules
- paths: unrooted paths in the frontend guides are under `frontend/src/`.
- layers: `app` → `features` → `components` → `lib`; features never import each other; only `app/` composes features; `lib/` never imports `features/` outside tests.
- imports: no path aliases; relative paths.
- testing: tests sit next to the file; one `QueryClient` per test, created outside render.

## File structure

```
frontend/index.html : SPA shell; DM Sans and Fraunces fonts
frontend/package.json : frontend scripts (dev, build, test) and dependencies
frontend/src/app/app.tsx : providers + router
frontend/src/app/providers.tsx : QueryClientProvider and SessionProvider
frontend/src/main.tsx : mounts <App/> and global styles
frontend/src/test/setup.ts : Vitest setup: jest-dom matchers, cleanup, modal <dialog> stub for jsdom
frontend/tsconfig.json : typecheck settings
frontend/vite.config.ts : dev server, /api proxy, Tailwind plugin, Vitest config
```
