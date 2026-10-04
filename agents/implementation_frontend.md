# Implementation: frontend

## File structure

```
frontend/index.html : SPA shell; DM Sans font
frontend/package.json : frontend scripts (dev, build, test) and dependencies
frontend/src/app/app.tsx : providers + router
frontend/src/app/providers.tsx : QueryClientProvider and SessionProvider
frontend/src/app/route-guards.tsx : ProtectedRoute and GuestRoute redirects by session status
frontend/src/app/router.tsx : route table: /signup, /login (guest), / (protected)
frontend/src/app/routes/home-page.tsx : signed-in placeholder: backend status, profile, Ask AI stub, sign out
frontend/src/app/routes/login-page.tsx : login page: highlight panel + login form
frontend/src/app/routes/signup-page.tsx : signup page: highlight panel + signup form
frontend/src/assets/auth-hero.jpg : auth panel photo (Unsplash License)
frontend/src/components/layout/split-layout.tsx : two-pane page: media aside (desktop) + centered content
frontend/src/components/ui/alert.tsx : form-level message (role=alert), error/info tones
frontend/src/components/ui/button.test.tsx : Button type default and loading state
frontend/src/components/ui/button.tsx : Button: primary/outline/ghost/inverse variants, loading state
frontend/src/components/ui/checkbox.tsx : labelled checkbox
frontend/src/components/ui/divider.tsx : horizontal rule with optional centered text (currently unused)
frontend/src/components/ui/form-field.test.tsx : label, hint and error wiring
frontend/src/components/ui/form-field.tsx : label + control + hint/error with accessible id wiring
frontend/src/components/ui/icon-button.tsx : icon-only Button with required accessible label
frontend/src/components/ui/input.tsx : text input; invalid style follows aria-invalid
frontend/src/components/ui/label.tsx : form label
frontend/src/components/ui/password-input.test.tsx : visibility toggle and aria-pressed
frontend/src/components/ui/password-input.tsx : Input with show/hide toggle
frontend/src/components/ui/spinner.tsx : loading indicator, optionally announced
frontend/src/components/ui/text-link.tsx : router-aware inline link
frontend/src/features/auth/api/auth-api.ts : auth endpoint calls typed by contracts
frontend/src/features/auth/api/use-login.ts : login mutation
frontend/src/features/auth/api/use-logout.ts : logout mutation; always ends the local session
frontend/src/features/auth/api/use-me.ts : current-user query
frontend/src/features/auth/api/use-signup.ts : signup mutation, then login with the same credentials
frontend/src/features/auth/components/auth-header.tsx : page title + subtitle
frontend/src/features/auth/components/auth-switch-link.tsx : switch between sign-in and sign-up
frontend/src/features/auth/components/login-form.tsx : login form validated by LoginRequest
frontend/src/features/auth/components/signup-form.test.tsx : validation, success flow, taken-email mapping
frontend/src/features/auth/components/signup-form.tsx : signup form validated by SignupRequest
frontend/src/features/auth/map-auth-error.test.ts : error code mapping
frontend/src/features/auth/map-auth-error.ts : API error codes → field or form messages
frontend/src/features/auth/session/session-provider.tsx : wires the API client to the session; restores it on load
frontend/src/features/auth/session/session-store.ts : in-memory access token, session status, single-flight refresh
frontend/src/features/auth/session/use-session.ts : session status hook
frontend/src/features/marketing/components/highlight-panel.tsx : photo panel with product highlight card and prev/next
frontend/src/features/marketing/data/highlights.ts : highlight copy
frontend/src/lib/api-client.ts : fetch wrapper: /api base, contract-validated responses, bearer token, one retry after refresh
frontend/src/lib/api-error.ts : ApiError built from the error contract
frontend/src/lib/cn.ts : className merge helper
frontend/src/lib/query-client.ts : TanStack Query client defaults
frontend/src/main.tsx : mounts <App/> and global styles
frontend/src/styles/globals.css : Tailwind import and design tokens
frontend/src/test/setup.ts : Vitest setup: jest-dom matchers, cleanup
frontend/tsconfig.json : typecheck settings
frontend/vite.config.ts : dev server :5173, /api proxy to :3000, Tailwind plugin, Vitest config
```
