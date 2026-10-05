# Frontend: pages and routing

## Calls
- `docs/frontend/session-flow.md` : session status the guards read

## Rules
- Signed-out pages sit under `GuestRoute`, signed-in pages under `ProtectedRoute`, admin pages under `AdminRoute` inside it; `/share/:token` stays outside every guard.
- Pages read `frontend/src/lib/demo-data.ts` until the backend endpoint for that data exists, then switch to a feature hook.

## File structure

```
frontend/src/app/route-guards.test.tsx : admins pass, other roles redirect home
frontend/src/app/route-guards.tsx : ProtectedRoute and GuestRoute redirects by session status; AdminRoute checks the admin role
frontend/src/app/router.tsx : route table: /signup, /login (guest); / /portfolio /cashflow /advisory /evidence /settings/security /admin* (protected); /share/:token (public)
frontend/src/app/routes/admin-api-keys-page.tsx : API key issuance placeholder pending the tenant module
frontend/src/app/routes/admin-models-page.tsx : runtime LLM provider list with the mock active
frontend/src/app/routes/admin-page.tsx : admin overview linking tenants, API keys, models
frontend/src/app/routes/admin-pages.test.tsx : overview links and provider list
frontend/src/app/routes/admin-tenants-page.tsx : tenant provisioning placeholder pending the tenant module
frontend/src/app/routes/advisory-page.test.tsx : thread, step-up gate, and no-auth degradation
frontend/src/app/routes/advisory-page.tsx : copilot thread, rebalance card, biometric step-up modal
frontend/src/app/routes/cashflow-page.test.tsx : accounts and remittance plan render
frontend/src/app/routes/cashflow-page.tsx : multi-currency balances and remittance corridor plan
frontend/src/app/routes/dashboard-page.test.tsx : net worth, runway gauge, trail chart, rebalance link, household toggle
frontend/src/app/routes/dashboard-page.tsx : net worth hero, runway gauge, household toggle, rebalance CTA, trail chart, target allocation
frontend/src/app/routes/evidence-page.test.tsx : executions with tiers and digests
frontend/src/app/routes/evidence-page.tsx : sandbox ledger table
frontend/src/app/routes/login-page.tsx : login page: highlight panel + login form; account-created notice after a partial signup
frontend/src/app/routes/portfolio-page.test.tsx : holdings with current, target, and drift weights
frontend/src/app/routes/portfolio-page.tsx : holdings table with current vs target drift
frontend/src/app/routes/security-settings-page.test.tsx : session, tier ladder, passkey empty state
frontend/src/app/routes/security-settings-page.tsx : session facts, tier ladder, passkeys, sign out
frontend/src/app/routes/shared-plan-page.test.tsx : privacy masking toggle
frontend/src/app/routes/shared-plan-page.tsx : public read-only strategy view with privacy masking
frontend/src/app/routes/signup-page.tsx : signup page: highlight panel + signup form
frontend/src/assets/auth-hero.jpg : auth panel photo (Unsplash License)
frontend/src/features/auth/components/auth-header.tsx : page title + subtitle
frontend/src/features/auth/components/auth-switch-link.tsx : switch between sign-in and sign-up
frontend/src/features/marketing/components/highlight-panel.tsx : photo panel with product highlight card and prev/next
frontend/src/features/marketing/data/highlights.ts : highlight copy
```
