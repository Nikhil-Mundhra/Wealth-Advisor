# Syntropy AI

> **FinTechathon 2026 Submission · International Track**  
> **Core Focus:** Topic B (Wealth Advisory Agent)  
> **Synergistic Extensions:** Topic A (Personal Finance Intelligence) & Topic C (Cross-Border Cashflow & Remittance Engine)  
> **Architecture Paradigm:** Neuro-Symbolic 5-Tier Wealth Advisory Agent with Deterministic Calculation Shield

---

## 1. Executive Summary & Value Proposition

Cross-border expatriates operate under severe financial fragmentation: multi-currency cashflows, erratic remittance commitments, differing tax jurisdictions, and fluctuating monthly burn rates. Standard consumer LLMs fail catastrophically in this domain—empirical benchmarks reveal that standalone foundation models (e.g. OpenAI o3) achieve only **46.8% factual accuracy** in production finance, frequently hallucinating portfolio calculations, proposing catastrophic spending cuts, or exhibiting demographic framing bias (MIT Sloan, 2024).

**Syntropy AI** solves this through a **B2B2C Neuro-Symbolic Advisory Operating System**. Licensed wealth advisors serve as the primary user, managing cross-border expat clients (with *Elena Vance* as the lead family expat persona, alongside *Marcus Thorne*, *Aisha Al-Mansoor*, and *David Kim*). 

The platform implements the core neuro-symbolic division of labor codified by modern financial multi-agent architectures (FinRobot V2, VERAFI SMT-lib, FinCom, and FAOS):
> *"Models formulate qualitative narratives, deterministic algorithms compute arithmetic, stateful graphs orchestrate workflows, and formal verification barriers enforce fiduciary compliance."*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Syntropy AI: 5-Tier Architecture                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Tier 1: Client & Advisor Workspace (React 19, Tailwind 4, SSE Telemetry)    │
│         Perimeter PII Redaction & Multi-Currency Portfolio Dashboard        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Neuro-Symbolic LLM Gateway (Gemini 2.5 Flash / Claude 3.5 Sonnet)   │
│         Structured Three-Pillar Prompts & Fiduciary Rationale Generation     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Deterministic Calculation Shield & Pure Quant Kernel                │
│         @wealth-advisor/rules: ±5% Drift Corridors, Runway Bands, FX Shock  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Standardized MCP Tool Bus & Institutional Product Catalog           │
│         UCITS ETFs (VWCE, CSPX, IEAG), Overnight Cash (XEON), Currency Hedges│
├─────────────────────────────────────────────────────────────────────────────┤
│ Tier 5: Verification, Permission Tiers & SHA-256 Tamper-Evident Ledger      │
│         Tier 1 (AI Suggests) → Tier 2 (Advisor Signs) → Tier 3 (Client Sees)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Topic B Core Workflow Implementation

### A. Seeded Advisor Client Book
The advisor workspace manages 4 distinct cross-border client accounts:
- **Elena Vance (Lead Expat):** 31, Berlin (DE). Family household with parent support remittances to Shanghai (EUR → CNY) and education fund to Singapore (GBP → SGD). Critical runway alert (3.2 months vs. 6.0m family floor) and +18% US equity drift breach.
- **Marcus Thorne:** 38, London (UK). Individual tech executive with GBP/USD cashflows, healthy 8.5m runway, and tax-loss harvesting optimization.
- **Aisha Al-Mansoor:** 44, Frankfurt (DE). Family household glidepath with upcoming tuition obligations, requiring capital preservation and Shariah-compliant sukuk sleeves.
- **David Kim:** 35, Munich (DE). Cross-border consultant suffering from severe cash drag (+14% idle cash in zero-yield checking accounts).

### B. 30-Second Pre-Meeting Briefs
One-click pre-meeting briefing modal distilling the client record into:
- Executive headline & 30-second summary
- Runway status with household floor comparison (3.0m individual / 6.0m family)
- Fiduciary drift alerts with boundary breach flagging
- Actionable meeting agenda and algorithmic trade proposals

### C. Institutional Product Comparison Matrix
A dedicated comparison tool covering real UCITS instruments and money market vehicles:
- **VWCE.DE** (Vanguard FTSE All-World UCITS ETF) — 0.22% TER, Physical Accumulating
- **CSPX.LSE** (iShares Core S&P 500 UCITS ETF) — 0.07% TER, Physical Accumulating, 15% US withholding tax efficiency
- **IEAG.AMS** (iShares Core EUR Govt Bond UCITS ETF) — 0.09% TER, AAA/AA Sovereign Fixed Income
- **AGGH.LSE** (iShares Core Global Aggregate Bond EUR Hedged) — 0.10% TER, Systematic FX Hedged
- **XEON.XET** (Xtrackers II EUR Overnight Rate Swap UCITS ETF) — 0.10% TER, €STR Capital Preservation Buffer

### D. Advisory Chat & Three-Pillar Fiduciary Rationale
Advisory dialogue wired to the backend LLM gateway through the **Calculation Shield**:
1. **Personal Finance Pillar:** Verifies cashflow, net burn rate, and liquid reserves.
2. **Cross-Border Pillar:** Evaluates active currency corridors and insulates remittances against foreign exchange shocks.
3. **Wealth Strategy Pillar:** Computes target weights, enforces the ±5% drift boundary, and generates rebalance trade orders.

### E. Three-Tier Permission Hierarchy
- **Tier 1 (AI Suggests):** Algorithmic analysis and scenario generation. Read-only; cannot alter portfolio state.
- **Tier 2 (Advisor Approves):** Licensed advisor reviews the proposed rebalancing and signs off. Logs cryptographically to the immutable audit ledger.
- **Tier 3 (Client Executes):** Client reviews advisor-approved proposal via a privacy-masked strategy share link. Hardware passkey execution gated in sandbox.

---

## 3. Automated Test Verification & Evidence

The codebase enforces strict test-driven development across all layers. **338 tests pass with zero failures**:

| Test Suite | Framework | Count | Status |
| :--- | :--- | :--- | :--- |
| **Backend API & Quant Rules** | Node.js Test Runner (Isolated In-Memory Mongod) | 265 passed | Green |
| **Frontend UI & Components** | Vitest 5 + React Testing Library + JSDOM | 73 passed | Green |
| **Total Automated Tests** | | **338 passed** | **100% Green** |

### Execution Commands:
```bash
# Run all workspace tests (backend + frontend)
make test

# Run frontend tests alone
npm test -w frontend

# Run backend tests alone
npm test -w backend

# Run architectural dependency lint and documentation lint
make deps-lint
make docs-lint

# Full TypeScript check across all packages
make typecheck
```

---

## 4. Quickstart & Deployment Guide

### Prerequisites
- Node.js 22+ (Pinned via `.nvmrc`)
- npm 10+
- Docker (optional, for local nginx proxy)

### Local Setup in 3 Commands:
```bash
# 1. Install workspace dependencies
make install

# 2. Run verification test suite
make test

# 3. Start development servers (Backend on :3000, Frontend on :5173)
make dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The app boots into the **Advisor Sandbox** with Elena Vance pre-selected.

### Production Build & Standalone Node Server:
```bash
# Build the Vite frontend and bundle assets
make build

# Start the unified production server
make prod
```

---

## 5. Security & Compliance Self-Assessment

### A. Technical Guardrails Implemented
- **Deterministic Calculation Shield:** Models never execute raw arithmetic. Every valuation, runway month, and drift delta is calculated by `@wealth-advisor/rules` prior to prompt assembly.
- **Immutable SHA-256 Audit Trail:** Every rebalance proposal and stress test simulation is hashed and recorded with a cryptographic digest (`/settings/ledger`), exportable to CSV.
- **Zero Training Guarantee:** API calls specify zero-retention parameters, ensuring client financial data is never ingested into LLM training corpora.
- **Privacy-Masked Client Sharing:** Shareable client strategy links redact absolute cash balances and account numbers (`/share/:token`), exposing only strategic asset percentages.

### B. Transparent Disclosure of Known Limitations & Scope
In accordance with the hackathon rules and integrity guidelines:
- **Passkey Hardware Execution (Tier 3):** The sandbox simulates biometric authorization with WebAuthn payload stubbing; production FIDO2 hardware token registration is scheduled for Phase 2.1.
- **Single-Tenant Sandbox Scope:** The current deployment operates under an isolated default tenant (`DEFAULT_TENANT_ID`). Multi-tenant database partitioning is enforced at the repository boundary but requires external IdP federation for live multi-firm rollouts.
- **Illustrative Market Scenarios:** The landing page simulator features illustrative benchmark stress tests grounded in MIT Sloan research. Live operations in the Advisor Workspace execute through the active calculation engine.

---

## 6. Submission Deliverables Summary

- **Repository:** Syntropy AI Wealth Advisor
- **Technical Architecture:** [Architecture Documentation](docs/architecture/index.md)
- **Security Self-Assessment:** [Security Assessment](docs/security/security-self-assessment.md)
- **Rubric Mapping:** [Topic B Scope Checklist](docs/compliance/topic-b-scope-checklist.md)
- **Audit Ledger & Execution Evidence:** Exportable via the in-app Cryptographic Ledger (`/settings/ledger`)

---

*Syntropy AI operates under advisor sandbox mode for FinTechathon 2026. All strategies are deterministic simulations and do not constitute formal investment solicitation.*
