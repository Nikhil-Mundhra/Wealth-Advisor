# Clients

## Routes
| Route | Access | Page | Shows |
|---|---|---|---|
| `/login` | guest | `LoginPage` | passkey sign-in, email/password fallback, demo quick-fill |
| `/signup` | guest | `SignupPage` | onboarding, currency selection, passkey enrolment prompt |
| `/share/:token` | public | `SharedPlanPage` | read-only plan, masking toggle, three-pillar rationale, stress simulation |
| `/` | expat | `DashboardPage` | net worth in base currency, household toggle, currency donut, runway gauge |
| `/portfolio` | expat | `PortfolioPage` | holdings, rebalance drift, share-link modal |
| `/cashflow` | expat | `CashflowPage` | multi-currency balances, pooled cash flow, remittance corridor planner |
| `/advisory` | expat | `AdvisoryPage` | streaming copilot, tool stream, action cards, rationale drawer, Tier 3 passkey modal |
| `/evidence` | expat, judge | `EvidencePage` | sandbox ledger, before/after diffs, passkey proofs, SHA-256 checks, JSON export |
| `/settings/security` | expat | `SecuritySettingsPage` | passkeys, active sessions, permission tiers |
| `/admin` | admin, judge | `AdminDashboardPage` | tenants, token usage, health |
| `/admin/tenants` | admin | `AdminTenantsPage` | provisioning, member limits, corridors, risk policies |
| `/admin/api-keys` | admin | `AdminApiKeysPage` | issue scoped keys, usage, revoke |
| `/admin/models` | admin, judge | `AdminModelsPage` | LLM switch, latency, demo reset |

## Navigation
| Viewport | Layout |
|---|---|
| desktop (> 768px) | left sidebar: navigation, currency ticker, admin toggle, avatar |
| mobile (≤ 768px) | bottom bar: Dashboard, Portfolio, Cash Flow, Advisory; top bar: tenant selector, theme toggle, language, avatar menu (`/settings/security`, `/evidence`, `/admin`) |

## Locales
`en`, `zh-CN`, `zh-HK`, `de`. Client-side dictionaries; choice stored in `localStorage`; the LLM prompt carries the active locale.

## Theme and mobile web
- Dark palette: background `#0b0f19`, cards `#111827`, borders `#1f2937`; WCAG AA contrast; theme follows the system until toggled.
- Planned tokens: `--color-surface`, `--color-surface-subtle` (built tokens: `docs/frontend/design-tokens.md`).
- `min-h-dvh`; safe-area insets; touch targets ≥ 44×44px; chat and action cards in a bottom sheet on mobile.

## Native apps
| | iOS | Android |
|---|---|---|
| Shell | Capacitor (`com.wealthadvisor.dewa`, "DEWA Wealth", webDir `dist`) | same |
| Biometrics | Face ID; `NSFaceIDUsageDescription` | BiometricPrompt; `USE_BIOMETRIC` |
| Passkey domain | Associated Domains `webcredentials:<domain>` | Digital Asset Links `assetlinks.json` |
| Push | APNs | FCM |
| Release | Xcode, TestFlight | Gradle, `.aab` for Play Console |
