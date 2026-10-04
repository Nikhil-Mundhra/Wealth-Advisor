# Frontend

## Route
- UI primitives, layout, design tokens → `agents/frontend/ui.md`
- forms, validation, API error messages → `agents/frontend/forms.md`
- pages, router, route guards, adding a feature → `agents/frontend/pages.md`
- calling an endpoint, query and mutation hooks, API client → `agents/frontend/data.md`
- session state, access token, refresh → `agents/frontend/session.md`
- component boundaries → `docs/architecture/c3-frontend.md`

## Rules
- Layers: `app` → `features` → `components` → `lib`; features never import each other; only `app/` composes features.
- Request and response shapes come only from `@wealth-advisor/contracts`.
- Tests sit next to the file (`*.test.tsx`); a test creates one `QueryClient` per test, outside render.
- delete: grep → unlink → delete → re-grep → `npm test -w frontend` → remove the map line.

## File structure

```
frontend/index.html : SPA shell; DM Sans font
frontend/package.json : frontend scripts (dev, build, test) and dependencies
frontend/src/app/app.tsx : providers + router
frontend/src/app/providers.tsx : QueryClientProvider and SessionProvider
frontend/src/main.tsx : mounts <App/> and global styles
frontend/src/test/setup.ts : Vitest setup: jest-dom matchers, cleanup
frontend/tsconfig.json : typecheck settings
frontend/vite.config.ts : dev server, /api proxy, Tailwind plugin, Vitest config
```
