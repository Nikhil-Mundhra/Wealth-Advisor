# Frontend: pages and routing

## Calls
- `frontend/docs/session-flow.md` : session status the guards read

## Rules
- Signed-out pages sit under `GuestRoute`, signed-in pages under `ProtectedRoute`, admin pages under `AdminRoute` inside it; `/share/:token` stays outside every guard.
- Pages read `frontend/src/lib/demo-data.ts` until the backend endpoint for that data exists, then switch to a feature hook.

## File structure

```
frontend/public/apple-touch-icon.png : high-resolution web app touch icon (180x180)
frontend/public/favicon-32x32.png : standard transparent favicon for browser tabs (32x32)
frontend/public/favicon.png : high-DPI transparent browser favicon (64x64)
frontend/public/logo.png : transparent brand logo asset for public web use
frontend/public/og-image.jpg : Open Graph and Twitter social link preview image (1024x576)
frontend/src/app/route-guards.test.tsx : admins pass, other roles redirect home
frontend/src/app/route-guards.tsx : ProtectedRoute and GuestRoute redirects by session status; AdminRoute checks the admin role
frontend/src/app/router.tsx : route table: /home (public); /signup, /login, /admin/login, /advisor/login (guest); / (root HomePage or Dashboard); /onboarding /portfolio /cashflow /advisory /evidence /settings/security /settings/ledger /settings/ai /admin* (protected); /share/:token (public)
frontend/src/app/routes/admin-api-keys-page.tsx : API key issuance placeholder pending the tenant module
frontend/src/app/routes/admin-credentials-page.tsx : demo persona accounts and credentials reference tab
frontend/src/app/routes/admin-login-page.tsx : operator authentication portal for platform administrators
frontend/src/app/routes/admin-models-page.tsx : runtime LLM provider list with the mock active
frontend/src/app/routes/admin-page.tsx : admin overview linking tenants, API keys, models
frontend/src/app/routes/admin-pages.test.tsx : overview links and provider list
frontend/src/app/routes/admin-tenants-page.tsx : tenant provisioning placeholder pending the tenant module
frontend/src/app/routes/admin-users-page.tsx : admin user account management, filtering, and role/status mutations
frontend/src/app/routes/advisor-login-page.tsx : institutional login terminal for fiduciary wealth analysts
frontend/src/app/routes/advisor-workstation-page.test.tsx : advisor roster scoping for Alex Morgan, one-click portfolio entry, and instrument matrix tab
frontend/src/app/routes/advisor-workstation-page.tsx : wealth analyst workstation with client roster, AI advisory copilot, AUM summaries, and invitation links
frontend/src/app/routes/advisory-page.test.tsx : thread, step-up gate, and no-auth degradation
frontend/src/app/routes/advisory-page.tsx : copilot thread, rebalance card, biometric step-up modal
frontend/src/app/routes/advisory-route.test.tsx : /advisory routing renders personal portfolio copilot across roles
frontend/src/app/routes/advisory-thread.tsx : store-free copilot thread shared by the client and advisor workstation views
frontend/src/app/routes/ai-settings-page.test.tsx : user API key input, model selection, toast notification, and persistence tests
frontend/src/app/routes/ai-settings-page.tsx : user AI API key configuration and FinanceBench model rankings page
frontend/src/app/routes/cashflow-page.test.tsx : accounts and remittance plan render
frontend/src/app/routes/cashflow-page.tsx : multi-currency balances and remittance corridor plan
frontend/src/app/routes/dashboard-page.test.tsx : net worth, runway gauge, trail chart, rebalance link, household toggle
frontend/src/app/routes/dashboard-page.tsx : net worth hero, runway gauge, household toggle, rebalance CTA, trail chart, target allocation, portfolio holdings
frontend/src/app/routes/evidence-page.test.tsx : in-browser SHA-256 verification and CSV export trigger tests
frontend/src/app/routes/evidence-page.tsx : institutional evidence explorer with W3C WebAuthn verification and tamper-evident audit ledger
frontend/src/app/routes/home-page.test.tsx : home page rendering and interactive simulation tests
frontend/src/app/routes/home-page.tsx : market-ready homepage presenting the triad architecture, advisor OS, MIT Sloan quant rigor, knowledge graph, and interactive simulator
frontend/src/app/routes/login-page.tsx : login page: highlight panel + login form; account-created notice after a partial signup
frontend/src/app/routes/onboarding-page.test.tsx : onboarding starts without preselected risk answer and advances after selection
frontend/src/app/routes/onboarding-page.tsx : dedicated onboarding questionnaire wizard with fresh answers for first-time signups
frontend/src/app/routes/portfolio-page.test.tsx : holdings with current, target, and drift weights
frontend/src/app/routes/portfolio-page.tsx : deep-link route wrapper rendering shared PortfolioSection
frontend/src/app/routes/portfolio-section.tsx : shared portfolio holdings table rendered on the dashboard and as a deep link
frontend/src/app/routes/role-login-mismatch.test.tsx : role mismatch keeps a signed-in session and GuestRoute redirects role portals
frontend/src/app/routes/root-route.tsx : dual-mode root route: HomePage for anonymous visitors, AppShell with DashboardPage for authenticated users
frontend/src/app/routes/route-error-boundary.tsx : graceful error boundary with reload and navigation controls for uncaught route errors
frontend/src/app/routes/security-settings-page.test.tsx : session, tier ladder, passkey empty state
frontend/src/app/routes/security-settings-page.tsx : session facts, tier ladder, passkeys, sign out
frontend/src/app/routes/settings-ledger-page.test.tsx : executions with tiers, passkey proof, and CSV export trigger
frontend/src/app/routes/settings-ledger-page.tsx : sandbox ledger table with SettingsNav and CSV export
frontend/src/app/routes/settings-nav.tsx : settings subnavigation tabs between Security and Ledger
frontend/src/app/routes/shared-plan-page.test.tsx : privacy masking toggle
frontend/src/app/routes/shared-plan-page.tsx : public read-only strategy view with privacy masking
frontend/src/app/routes/signup-page.tsx : signup page: highlight panel + signup form
frontend/src/assets/advisor-meeting.jpg : advisor and client strategic consultation photo
frontend/src/assets/auth-portrait-1.jpg : auth panel portrait photo 1 (skyline advisor analysis)
frontend/src/assets/auth-portrait-2.jpg : auth panel portrait photo 2 (accounting & financial statements)
frontend/src/assets/auth-portrait-3.jpg : auth panel portrait photo 3 (quantitative analyst models)
frontend/src/assets/auth-portrait-4.jpg : auth panel portrait photo 4 (portfolio review and reporting)
frontend/src/assets/auth-portrait-5.jpg : auth panel portrait photo 5 (collaborative advisory strategy)
frontend/src/assets/logo-dark.png : institutional network graph logo mark for dark theme
frontend/src/assets/logo.png : institutional network graph logo mark for light theme
frontend/src/assets/market-shock.jpg : late-night market downturn and volatility photo
frontend/src/features/admin/components/credentials-tab.tsx : demo persona accounts and credentials reference card with one-click copy and direct login links
frontend/src/features/admin/components/platform-keys-card.tsx : platform keys management card with runtime DB configuration and system ENV fallback
frontend/src/features/admin/components/user-management/admin-create-user-modal.tsx : modal dialog for creating new user accounts with roles and tenant assignments
frontend/src/features/admin/components/user-management/admin-delete-user-modal.tsx : confirmation dialog for user account deletion
frontend/src/features/admin/components/user-management/admin-edit-user-modal.tsx : modal dialog for editing user profile, roles, status, and tenant
frontend/src/features/admin/components/user-management/admin-reset-password-modal.tsx : modal dialog for administrative password reset
frontend/src/features/admin/components/user-management/admin-user-stat-cards.tsx : user account metrics and status breakdown cards
frontend/src/features/admin/components/user-management/admin-users-filters.tsx : search bar and dropdown filters for role, status, and tenant
frontend/src/features/admin/components/user-management/admin-users-table.tsx : table displaying user accounts, role badges, status chips, and action menus
frontend/src/features/advisor/advisor-store.ts : reactive advisor store for active client selection using useSyncExternalStore
frontend/src/features/advisor/clients-data.ts : seeded expat clients dataset with holdings, accounts, and pre-meeting briefs
frontend/src/features/advisor/components/client-portfolio-modal.tsx : read-only client portfolio surveillance modal for wealth analysts
frontend/src/features/advisor/components/client-roster.tsx : interactive advisor client book roster cards
frontend/src/features/advisor/components/client-selector.tsx : header client switcher with household mode and quick actions
frontend/src/features/advisor/components/connected-advisor-card.tsx : client settings card showing connected wealth analyst or invite delegation code entry
frontend/src/features/advisor/components/instrument-comparison-modal.tsx : institutional UCITS instruments comparison matrix
frontend/src/features/advisor/components/invite-client-modal.tsx : modal for generating unique client delegation onboarding links
frontend/src/features/advisor/components/pre-meeting-brief-modal.tsx : 30-second advisor pre-meeting briefing modal
frontend/src/features/advisor/instruments-data.ts : institutional UCITS etf and money market product comparison dataset
frontend/src/features/advisor/types.ts : advisor domain types for clients, holdings, accounts, and briefs
frontend/src/features/ai-config/ai-settings-store.test.ts : unit tests for AI configuration store and key masking
frontend/src/features/ai-config/ai-settings-store.ts : reactive store with local storage persistence for user AI API keys
frontend/src/features/ai-config/components/code-snippets.tsx : model-agnostic TypeScript AI SDK and Python LiteLLM developer snippets
frontend/src/features/ai-config/components/model-card.tsx : model card rendering FinanceBench factual correctness %, tags, and selection controls
frontend/src/features/ai-config/components/toast-notification.tsx : floating toast notification overlay confirming AI key and model save
frontend/src/features/ai-config/models-data.ts : FinanceBench benchmarked model specifications and ranking dataset
frontend/src/features/ai-config/types.ts : TypeScript interfaces for AI configurations, model specs, and providers
frontend/src/features/auth/components/auth-header.tsx : page title + subtitle
frontend/src/features/auth/components/auth-switch-link.tsx : switch between sign-in and sign-up
frontend/src/features/marketing/components/advisor-lifecycle-section.tsx : advisor lifecycle operating system section with lifecycle tabs and integrations
frontend/src/features/marketing/components/compliance-security-section.tsx : compliance, guardrails, and SOC 2 security architecture
frontend/src/features/marketing/components/documentation-section.tsx : documentation section hosting interactive subtabs for all technical specifications
frontend/src/features/marketing/components/execution-blueprint-section.tsx : 4-phase execution blueprint from structured intake to persona benchmarking
frontend/src/features/marketing/components/highlight-panel.tsx : photo panel with product highlight card and prev/next
frontend/src/features/marketing/components/homepage-footer.tsx : institutional footer with regulatory disclosures and navigation
frontend/src/features/marketing/components/homepage-hero.tsx : hero section with value proposition, metrics, and neuro-symbolic pipeline card
frontend/src/features/marketing/components/homepage-nav.tsx : sticky navigation bar with section links, theme toggle, and auth CTAs
frontend/src/features/marketing/components/knowledge-graph-section.tsx : client knowledge graph engine with Complex Event Processing
frontend/src/features/marketing/components/mit-sloan-shock-section.tsx : MIT Sloan quantitative rigor section analyzing income shocks and demographic bias
frontend/src/features/marketing/components/neuro-symbolic-simulator.tsx : interactive simulator playground comparing raw LLM vs neuro-symbolic engine
frontend/src/features/marketing/components/particles-background.test.tsx : unit test verifying decorative canvas rendering and lifecycle cleanup
frontend/src/features/marketing/components/particles-background.tsx : theme-aware browser-side canvas particle background with gentle repulsion and link physics
frontend/src/features/marketing/components/positioning-matrix-section.tsx : strategic positioning comparison matrix for B2B2C vs B2C
frontend/src/features/marketing/components/triad-overview-section.tsx : overview of the triad architecture (Workflow OS, Semantic Graph, MIT Sloan)
frontend/src/features/marketing/data/highlights.ts : highlight copy
frontend/src/features/sharing/components/share-strategy-modal.test.tsx : masked share URL issuance and privacy toggle
frontend/src/features/sharing/components/share-strategy-modal.tsx : read-only strategy URL modal with privacy masking toggle
frontend/src/features/wealth/components/construction/allocation-tab.tsx : optimal multi-asset allocation table with weights, unit conversions, scores, and sharia status
frontend/src/features/wealth/components/construction/compliance-tab.tsx : fiduciary and jurisdiction rule verification checklist driven by compliance flags
frontend/src/features/wealth/components/construction/rationale-tab.tsx : six-pillar fiduciary rationale narrative with source model attribution
frontend/src/features/wealth/components/construction/stress-tab.tsx : macro scenario cards, monte carlo percentiles, and the what-if rate shift simulator
frontend/src/features/wealth/components/portfolio-construction-modal.test.tsx : characterization coverage for solve payloads, derived what-if math, tab panels, and compliance flags
frontend/src/features/wealth/components/portfolio-construction-modal.tsx : quantitative portfolio construction and mean-variance optimization modal
```
