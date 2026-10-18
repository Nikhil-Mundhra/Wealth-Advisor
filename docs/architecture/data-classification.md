# Data Classification & AI Privacy Standards

This document establishes the data classification taxonomy, per-field data handling standards, and external LLM provider egress controls for the wealth advisory platform.

---

## 1. Classification Taxonomy

Data processed and stored across the system is categorized into four sensitivity tiers:

| Tier | Definition | Handling & Encryption | External LLM Egress |
|---|---|---|---|
| **Public** | Publicly accessible information, regulatory disclaimers, educational material, marketing copy. | Plaintext; unauthenticated read access allowed. | Permitted. |
| **Internal** | Non-sensitive operational data: market indices, historical FX rates, system health telemetry. | Encrypted in transit (TLS 1.3); restricted to authenticated services. | Permitted when required for context. |
| **Confidential** | Customer financial data: asset weights, risk tolerance scores, cashflow runway bands, simulated portfolio proposals. | Encrypted at rest (AES-256) and in transit; tenant-isolated. | Permitted only through strict sanitization chokepoint. |
| **Restricted** | Direct PII and cryptographic secrets: user emails, password hashes, session secrets, private signing keys, raw account numbers. | Encrypted at rest; salt+hash (`scrypt`); strictly segregated. | **Strictly Forbidden.** Never egresses to any LLM. |

---

## 2. Per-Field Data Classification

| Entity | Field | Classification | Retention & Masking Rules |
|---|---|---|---|
| **User** | `id` | Confidential | Tenant-scoped UUID / ObjectId; replaced by opaque token before LLM egress |
| **User** | `email` | Restricted | Primary account identifier; stripped before LLM prompt assembly |
| **User** | `displayName` | Restricted | Personal identifier; stripped before LLM prompt assembly |
| **User** | `passwordHash` | Restricted | scrypt hash (N=2^17, r=8, p=1); never leaves backend auth module |
| **User** | `roles` | Internal | Access control claims (`USER`, `ADMIN`) |
| **Session** | `refreshTokenHash` | Restricted | SHA-256 digest of refresh secret; 14-day TTL; deleted on logout |
| **Account** | `accountNumber` | Restricted | Anonymized or masked to last 4 characters; never sent to LLMs |
| **Account** | `currency` | Internal | ISO 4217 3-letter currency code (e.g. `EUR`, `USD`, `GBP`) |
| **Account** | `balance` | Confidential | Stored in integer minor units (cents); aggregated into portfolio net worth |
| **Portfolio** | `allocations` | Confidential | Asset symbol and weight percentages; processed in sanitized prompt context |
| **Risk Profile**| `baseRiskScore` | Confidential | Clamped numerical score (`1.0` to `10.0`); mapped to risk band |
| **Ledger** | `signatureProof` | Restricted | WebAuthn passkey authentication assertion; verifiable proof in event log |

---

## 3. LLM Provider Egress & Prompt Sanitization

### Chokepoint Architecture
All requests destined for external LLM inference endpoints pass through a single, dedicated prompt sanitization chokepoint. Prompts constructed outside this chokepoint are rejected by construction.

### Zero Direct PII Guarantee
1. **Opaque Tokenization:** User, account, and portfolio identifiers are replaced with ephemeral, opaque tokens (`portfolio_demo_1`) prior to prompt dispatch. Opaque tokens are mapped back to real assets only within server-side response parsers.
2. **Direct Identifier Stripping:** Fields classified as `Restricted` (notably `email` and `displayName`) are permanently stripped from the prompt context.
3. **Default-Deny Allow-List:** An allow-list defines the fields permitted in LLM context. Any field not explicitly enumerated in the allow-list is dropped automatically.
4. **No Raw Arithmetic:** The model is not permitted to perform unverified mathematical calculations or execute code. All numerical quantities in advisory responses originate from deterministic calculation engines (`financial_calc_engine`).

---

## 4. Provider Governance & Zero-Retention Terms

To protect customer confidentiality, external LLM providers must satisfy non-negotiable security requirements:
- **Zero Data Retention (ZDR):** Providers must not log or retain prompt or completion payloads past the request lifecycle.
- **No Model Training:** Customer inputs and outputs must never be used for foundation model training or fine-tuning.
- **B2B API Tier:** All integrations operate under enterprise B2B terms with contractual confidentiality and data processing agreements (DPA).
- **Fallback to Mock:** If a provider endpoint is unavailable, unresponsive, or fails contract validation, the system gracefully falls back to deterministic local rule engines without interrupting user workflows.
