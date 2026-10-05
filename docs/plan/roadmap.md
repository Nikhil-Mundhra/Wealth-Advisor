# Roadmap

Design per area: `docs/plan/index.md`.

## Phase 1 · Days 1–3 · rules, contracts, engines
- [ ] rules: currency codes and corridors; asset classes, risk 1–10, volatility; permission tiers; household modes and reserve multiplier (1.0×, 1.5–2.0×); runway thresholds (< 3, 3–6, > 6 months); passkey timeouts and RP config; share token format, TTL, masking; locales; tenant status and plans (`STARTER`, `INSTITUTIONAL`), member limits; LLM provider keys and models; viewport targets and breakpoints
- [ ] contracts: `auth/passkey` (register, login, step-up), `sharing`, `tenant` (tenant, API key), `finance` (account, transaction, cash-flow summary with `householdMode`), `wealth` (asset product, portfolio, rebalance proposal), `advisory` (chat, sandbox execution), `admin` (settings)
- [ ] engines: `BurnRateCalculator` (multi-currency to base; reserve by household mode), `ExpatRiskProfiler` (risk from runway and currency mismatch), `PortfolioOptimizer` (target weights by effective risk; `FAMILY_REMITTANCE` and `TUITION_FEE` ring-fenced into cash/money-market)
- done: typecheck clean for rules and contracts; engines unit-tested on Elena's family squeeze and a tuition shock

## Phase 2 · Days 4–7 · backend modules
- [ ] auth passkeys (`@simplewebauthn/server` or WebCrypto): `POST /api/auth/passkey/{register-options,register-verify,login-options,login-verify,step-up-challenge}`
- [ ] tenant: `tenants`, `api_keys`; tenant-scoping middleware; key verification (prefix, hash, tier)
- [ ] admin: `GET|POST /api/admin/{tenants,api-keys,models}`
- [ ] finance: `accounts`, `transactions`; household filtering; seeded Elena scenario
- [ ] wealth: `portfolios`, `asset_products`; `GET /api/wealth/portfolio`, `GET /api/wealth/products`, `POST /api/wealth/optimize`
- [ ] sharing: `shared_plans`; `POST /api/sharing/create`, `GET /api/sharing/:token`
- [ ] advisory: LLM gateway adapters and agent tools (`docs/plan/platform.md`); Tier 3 gate; `sandbox_ledgers`; three-pillar formatter
- done: all modules mounted; tenant scoping and key hashing tested; Tier 3 rejected without a valid assertion

## Phase 3 · Days 8–11 · frontend
- [ ] theme toggle, mobile viewport rules, locale provider and selector
- [ ] passkey sign-in and enrolment (`@simplewebauthn/browser`)
- [ ] every page in `docs/plan/clients.md`
- done: every route renders in dark mode, all locales, mobile layout; tests pass

## Phase 4 · Days 11–13 · native apps
- [ ] Capacitor config; iOS and Android projects per `docs/plan/clients.md`
- [ ] builds: Xcode simulator + TestFlight archive; `./gradlew assembleRelease` + `.aab`
- done: biometrics verified on both; release bundles build

## Phase 5 · Days 13–14 · submission
- [ ] 01 technical docs: `docs/architecture/` C1–C3, algorithms, tenancy, mobile, security design
- [ ] 02 presentation deck: 10 slides, 10 minutes
- [ ] 03 demo video script: 5 minutes, Elena's journey
- [ ] 04 source: typecheck, tests, Vercel deploy, reproducible mobile builds
- [ ] 05 security self-assessment: tier matrix, WebAuthn proof, share-link privacy, known risks
- [ ] 06 execution evidence: seeded ledger runs, sample digests
- [ ] verify on Vercel, desktop and mobile: passkey → dashboard → advisory → share → Tier 3 rebalance → evidence
- done: all six items under docs/submission/ (planned folder); deploy and mobile builds verified
