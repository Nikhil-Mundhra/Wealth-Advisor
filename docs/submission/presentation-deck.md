# Syntropy AI (DEWA) — FinTechathon Presentation Deck

Structured slide deck for the cross-border AI wealth management and compliance platform.

## Slide 1 — Title and Thesis

- **Headline:** Syntropy AI (DEWA) — Deterministic-First, Neuro-Symbolic Wealth Management
- **Subheadline:** Cross-border financial operating system uniting personal cashflow telemetry, multi-market institutional portfolio math, and privacy-preserving AI explanation.
- **Core thesis:** An AI wealth advisor must never perform arithmetic, tax policy, or suitability math inside an LLM. Numbers come from verified deterministic engines; language models explain the precomputed facts through a strict zero-PII boundary.

## Slide 2 — The Structural Gap (Research Context)

- **Multi-jurisdiction complexity:** Mobile wealth holders across Asia, MENA, Europe, and North America hold assets in overlapping currencies (for example `EUR`, `GBP`, `AED`, `INR`, `USD`, `SGD`) and face distinct regulatory and cultural rules (including UAE Sharia screening and India FEMA/LRS or NRE/NRO constraints).
- **Generic chatbots fail two tests:**
  1. **Math hallucination:** Prompting an LLM for asset weights produces ungrounded numbers without covariance optimization or cashflow safety checks.
  2. **PII leakage:** Forwarding raw names, emails, IBANs, or exact balances to hosted foundation models violates strict cross-border privacy requirements.

## Slide 3 — The Five-Workspace Architecture

- `rules` (`rules/src/index.ts`): Zero-dependency domain kernel enforcing validation keys, error catalogs, rational FX math, portfolio optimization, Sharia screening, bond valuation, technical/fundamental factor scoring, and profiling rules.
- `contracts`: Zod request/response schemas and HTTP/error bindings shared verbatim between server and browser.
- `backend` (`backend/src/modules/index.ts`): Modular Hono/Node API across `auth`, `admin`, `finance`, `wealth`, `advisory`, `sharing`, `market`, and `analytics`.
- `frontend`: React 19 + Tailwind CSS + React Query + React Hook Form command center and client/advisor portals.
- `infra`: Vercel deployment, environment configuration, and CI orchestration.

## Slide 4 — The Three-Pillar Advisory Engine

Every portfolio optimization and chat recommendation synthesizes three independent pillars before any prose is generated:

1. **Pillar 1 — Personal Finance & Runway:** Deterministic burn rate, emergency buffer target, and `recalibrateRiskScore` down-weighting for fragile liquidity or family dependents (`Individual` vs `Family` household mode).
2. **Pillar 2 — Cross-Border FX & Corridor Risk:** Multi-currency asset allocation with `fxMismatchPct` quantification and jurisdiction-aware product eligibility (`UAE`, `India`, `US`, `EU`).
3. **Pillar 3 — Quantitative Asset Selection:** Mean-variance optimization (`MVO`), bond pricing, fundamental ratios, technical momentum/RSI, mutual fund scoring, and strict Sharia zero-conventional-debt filtering (`shariaCompliant`).

## Slide 5 — Neuro-Symbolic Advisory Agent & Permission Ladder

Implemented in `backend/src/modules/advisory/domain/tool-registry.ts` and wired through `backend/src/modules/advisory/advisory.api.ts`:

| Tool | Engine Source | Permission Tier | Guardrail |
| :--- | :--- | :--- | :--- |
| `get_cashflow_and_runway` | Finance cashflow & burn rate | `TIER_1_ADVISORY` | Read + derived runway |
| `get_currency_exposure` | Multi-currency FX rational math | `TIER_0_READ` | Read-only exposure breakdown |
| `calculate_adaptive_portfolio` | Rules optimizer + risk recalibration | `TIER_1_ADVISORY` | Deterministic simplex constraints |
| `simulate_stress_test` | Portfolio scenario simulator | `TIER_2_SIMULATE` | Read-only hypothetical projection |
| `create_rebalance_proposal` | Self-financing rebalance planner | `TIER_2_SIMULATE` | `BUY <= SELL` proceeds invariant |
| `execute_sandbox_trade` | Wealth trade execution + audit ledger | `TIER_3_EXECUTE` | Fail-closed WebAuthn passkey step-up (`WL_1004`) |

## Slide 6 — Zero-PII Egress & Fail-Closed Security

- **Outbound scrubbing (`shieldText` / `shieldStructured`):** Replaces email addresses, IBANs, phone numbers, and free-form names before invoking Gemini, Claude, OpenAI, or mock providers, combined with `factNumbers` citation checks.
- **Cryptographic execution gate:** Rebalance trade execution requires an ephemeral challenge and verified ECDSA P-256 WebAuthn assertion (refusing execution with `WL_1004` whenever the assertion is missing or invalid).
- **Tamper-evident audit trail:** Executed trades append SHA-256 content-hashed ledger entries alongside `GET` / `POST` sharing snapshots and evidence verification.

## Slide 7 — Neuro-Symbolic Testing & CI/CD Guardrails (`<400ms` P99 SLA)

Documented in `docs/architecture/testing-guardrails.md`:

- **L0 Static & Architecture Boundaries:** TypeScript strict `tsc --noEmit` across all workspaces, dependency direction checks (`make deps-lint`), and doc/file-map enforcement (`make docs-lint`).
- **L1 Unit & Integration Suites:** Deterministic math, HTTP route integration against in-memory stores, and React Testing Library UI workflows.
- **L1.5 Property-Based Fuzzing (`backend/test/unit/rules/property-invariants.test.ts`):** Seeded randomized invariants proving simplex conservation, Sharia zero-debt filtering, monotonic risk recalibration, and zero unbonded/unfunded buys.
- **L2 Cross-Workspace Contract Parity (`backend/test/unit/core/contract-parity.test.ts`):** Automated parity across error codes, validation message keys, Zod enums/DTOs, and MongoDB collection validators.
- **L3 & L4 SLA Benchmark (`backend/test/integration/sla/stage-latency-sla.memory.test.ts`):** 45-iteration live HTTP pipeline asserting `<400ms` P99 API responsiveness.

## Slide 8 — Multi-Tenancy, Governance, and Submission Readiness

- **Multi-tenant administration:** Organization provisioning (`STARTER` / `INSTITUTIONAL`), per-tenant baseline currency, scoped API key issuance with fine-grained permissions (`read:analytics`, `advisory:recommend`, `simulate:stress-test`, `execute:sandbox`), rate limits, and token quotas (`frontend/src/app/routes/admin-tenants-page.tsx`, `frontend/src/app/routes/admin-api-keys-page.tsx`).
- **Explainable client collaboration:** Expiring, optional privacy-masked sharing links (`backend/src/modules/sharing`) allowing advisors and clients to inspect recommendations without leaking sensitive balances.
