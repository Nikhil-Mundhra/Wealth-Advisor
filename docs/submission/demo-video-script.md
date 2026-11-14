# Demo Video Script (4-Minute Walkthrough)

Structured recording guide showcasing end-to-end deterministic calculations, privacy boundaries, passkey step-up security, and governance workflows.

## Shot List Overview (04:00 total)

- **00:00 - 00:35:** Landing Page, Positioning & Guardrails Architecture (`frontend/src/app/routes/home-page.tsx`)
- **00:35 - 01:25:** Cashflow Runway & Adaptive Portfolio Optimization (`cashflow-page.tsx`, `portfolio-page.tsx`, `backend/src/modules/wealth/wealth.api.ts`)
- **01:25 - 02:15:** Neuro-Symbolic Advisory Chat & Zero-PII Boundary (`advisory-page.tsx`, `backend/src/modules/advisory/domain/tool-registry.ts`)
- **02:15 - 03:00:** Passkey Step-Up Trade Execution & Audit Evidence (`security-settings-page.tsx`, `evidence-page.tsx`)
- **03:00 - 03:40:** Privacy-Masked Client Sharing & Admin Governance (`shared-plan-page.tsx`, `admin-tenants-page.tsx`, `admin-api-keys-page.tsx`)
- **03:40 - 04:00:** Automated CI/CD Guardrails & Wrap-Up (`make ci`)

---

## Segment 1 (00:00 - 00:35) — Problem & Architecture Overview

- **Visual:** Open the root `/` marketing and interactive overview page; switch to the **Architecture** section and open the **Testing & CI Guardrails** subtab (`frontend/src/features/marketing/components/testing-guardrails-section.tsx`).
- **Voiceover:**
  > Most AI finance demos wire a chat box straight to an LLM, risking arithmetic hallucinations and raw PII leakage. Syntropy AI separates deterministic math from natural-language explanation. All cashflow, FX, and mean-variance calculations run inside a zero-dependency TypeScript kernel validated by 260+ property-based invariants and sub-400 millisecond P99 end-to-end latency gates.

## Segment 2 (00:35 - 01:25) — Personal Runway & Three-Pillar Optimization

- **Visual:** Sign in with the seeded demo account, view the Dashboard & Cashflow page (`frontend/src/app/routes/cashflow-page.tsx`) showing emergency runway in `EUR` vs household liabilities. Navigate to Portfolio (`frontend/src/app/routes/portfolio-page.tsx`), trigger portfolio optimization, and highlight the dynamic three-pillar rationale (`personalFinance`, `crossBorder`, `investmentStrategy`).
- **Voiceover:**
  > Here Elena's household has cross-border assets across Europe and Asia. Instead of treating investments in isolation, our rules kernel first checks her liquid emergency runway and household mode (`Family` vs `Individual`). If her buffer dips below target runway or FX mismatch exceeds threshold, `recalibrateRiskScore` automatically dampens equity risk before the MVO solver proposes a strictly self-financing rebalance where total buys never exceed sell proceeds.

## Segment 3 (01:25 - 02:15) — Neuro-Symbolic Advisory Chat & Tool Registry

- **Visual:** Open `/advisory` (`frontend/src/app/routes/advisory-page.tsx`). Ask: *"What happens if EUR/AED shifts and can I tilt toward Sharia-compliant sukuk?"*. Highlight the response citing `factNumbers`, invoked tool tier metadata (`TIER_1_ADVISORY`, `TIER_2_SIMULATE`), and note in the backend logs/AI settings that PII strings are masked before LLM inference.
- **Voiceover:**
  > In the advisory workbench, user questions route through a typed 6-tool registry. Read and advisory tools fetch deterministic runway, FX exposure, and Sharia-screened allocations; simulation tools compute stress scenarios—while the LLM only narrates verified numbers after `shieldText` strips names, emails, and account identifiers.

## Segment 4 (02:15 - 03:00) — Fail-Closed Passkey Execution & Audit Evidence

- **Visual:** Attempt trade execution without step-up (show fail-closed `WL_1004` guard in tests/network or trigger WebAuthn passkey step-up assertion), complete the ECDSA P-256 passkey signature, then open `/settings/ledger` or `/evidence` (`frontend/src/app/routes/evidence-page.tsx`) to show the SHA-256 audit digest.
- **Voiceover:**
  > Moving from `TIER_2_SIMULATE` to `TIER_3_EXECUTE` is strictly fail-closed. Without a fresh WebAuthn P-256 passkey assertion tied to an ephemeral challenge, execution is blocked with `WL_1004`. Once signed, every rebalance records an immutable SHA-256 audit entry.

## Segment 5 (03:00 - 03:40) — Privacy-Masked Sharing & Multi-Tenant Admin

- **Visual:** Open the generated share link (`/share/:token`, `frontend/src/app/routes/shared-plan-page.tsx`) showing allocation weights without exposing raw account balances when privacy masking is enabled. Switch to Admin Console -> Provision a new `INSTITUTIONAL` tenant (`admin-tenants-page.tsx`) and issue a scoped API key (`admin-api-keys-page.tsx`), displaying the one-time secret banner.
- **Voiceover:**
  > Advisors and families can collaborate over time-bound, privacy-masked share links. At the platform level, administrators can onboard institutional tenants with custom baseline currencies and issue least-privilege API keys enforced with per-minute rate limits and monthly token quotas.

## Segment 6 (03:40 - 04:00) — Verification & Closing

- **Visual:** Terminal running `make ci` showing green `docs-lint`, `deps-lint`, `typecheck`, `test-property`, `test-contracts`, `test-sla`, `test`, and `build`.
- **Voiceover:**
  > From formal mathematical fuzzing to live HTTP E2E latency gates, every invariant in Syntropy AI is continuously verified on every commit.
