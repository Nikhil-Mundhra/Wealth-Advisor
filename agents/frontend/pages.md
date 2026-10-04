# Frontend: pages and routing

## Calls
- `docs/frontend/session-flow.md` : session status the guards read

## Rules
- A page is `app/routes/<name>-page.tsx`; it composes features and gets server data from feature hooks.
- Signed-out pages sit under `GuestRoute`, signed-in pages under `ProtectedRoute`; unknown paths redirect to `/`.
- A feature is consumed only from `app/`.

## Workflow
- add a page: `app/routes/<name>-page.tsx` → route in `app/router.tsx` under `GuestRoute` or `ProtectedRoute` → map line
- add a feature: `features/<name>/{api,components}` → used from a page → map lines in the owning guides

## File structure

```
frontend/src/app/route-guards.tsx : ProtectedRoute and GuestRoute redirects by session status
frontend/src/app/router.tsx : route table: /signup, /login (guest), / (protected)
frontend/src/app/routes/home-page.tsx : signed-in placeholder: backend status, profile, Ask AI stub, sign out
frontend/src/app/routes/login-page.tsx : login page: highlight panel + login form
frontend/src/app/routes/signup-page.tsx : signup page: highlight panel + signup form
frontend/src/assets/auth-hero.jpg : auth panel photo (Unsplash License)
frontend/src/features/auth/components/auth-header.tsx : page title + subtitle
frontend/src/features/auth/components/auth-switch-link.tsx : switch between sign-in and sign-up
frontend/src/features/marketing/components/highlight-panel.tsx : photo panel with product highlight card and prev/next
frontend/src/features/marketing/data/highlights.ts : highlight copy
```
