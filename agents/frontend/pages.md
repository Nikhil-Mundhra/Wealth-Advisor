# Frontend: pages and routing

## Calls
- `docs/frontend/session-flow.md` : session status the guards read

## Rules
- Signed-out pages sit under `GuestRoute`, signed-in pages under `ProtectedRoute`.
- Pages get server data from feature hooks.

## File structure

```
frontend/src/app/route-guards.tsx : ProtectedRoute and GuestRoute redirects by session status
frontend/src/app/router.tsx : route table: /signup, /login (guest), / (protected)
frontend/src/app/routes/home-page.tsx : signed-in placeholder: backend status, profile, Ask AI stub, sign out
frontend/src/app/routes/login-page.tsx : login page: highlight panel + login form; account-created notice after a partial signup
frontend/src/app/routes/signup-page.tsx : signup page: highlight panel + signup form
frontend/src/assets/auth-hero.jpg : auth panel photo (Unsplash License)
frontend/src/features/auth/components/auth-header.tsx : page title + subtitle
frontend/src/features/auth/components/auth-switch-link.tsx : switch between sign-in and sign-up
frontend/src/features/marketing/components/highlight-panel.tsx : photo panel with product highlight card and prev/next
frontend/src/features/marketing/data/highlights.ts : highlight copy
```
