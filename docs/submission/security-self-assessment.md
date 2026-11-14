# Security & Privacy Self-Assessment

Self-assessment aligned with [threat-model.md](../architecture/threat-model.md) and [data-classification.md](../architecture/data-classification.md).

## 1. Data Classification & Zero-PII LLM Boundary

| Control | Implementation Location | Verification Method |
| :--- | :--- | :--- |
| Outbound PII shielding (`shieldText`, `shieldStructured`) | `backend/src/modules/advisory/domain/llm-gateway.ts` | Property fuzzing in `backend/test/unit/rules/property-invariants.test.ts` + advisory unit tests |
| Exact fact citation matching (`factNumbers`) | `backend/src/modules/advisory/domain/llm-gateway.ts` | Advisory gateway unit suite |
| Zero-data-retention (ZDR) provider headers | `backend/src/modules/advisory/domain/llm-gateway.ts` | Gateway integration & request header assertions |
| Tiered classification (`TIER_0_PUBLIC` to `TIER_4_SECRET`) | `docs/architecture/data-classification.md` | Enforced across admin & sharing projections |

- **Residual risk & mitigation:** Users could type unstructured sensitive identifiers in free-form chat prompts. `shieldText` normalizes emails, phone numbers, IBANs, and card-like digit sequences into placeholders before outbound provider serialization.

## 2. Authentication, Credentials & Step-Up Authorization

| Control | Implementation Location | Verification Method |
| :--- | :--- | :--- |
| Argon2id password hashing + per-user salt | `backend/src/modules/auth` | Auth unit and memory integration tests |
| Single-use rotating refresh tokens with reuse revocation | `backend/src/modules/auth` | Refresh rotation integration tests |
| Fail-closed WebAuthn ECDSA P-256 step-up (`WL_1004`) | `backend/src/modules/wealth/wealth.api.ts` | `backend/test/unit/wealth/wealth-api.test.ts` + live HTTP assertion in `backend/test/integration/sla/stage-latency-sla.memory.test.ts` |
| Ephemeral WebAuthn challenge single-use burn | `backend/src/modules/auth` | Passkey challenge/verify integration tests |
| Platform credential encryption (`AES-256-GCM`) | `backend/src/modules/admin` | Admin credentials & secrets tests |

- **Fail-closed guarantee:** `execute_sandbox_trade` and `/api/wealth/execute` deny execution with `WL_1004` whenever `passkeyAssertion` is missing, malformed, unsigned for the active challenge, or untrusted. In tests and production, no portfolio holdings mutate and no ledger entry is written prior to cryptographic verification.

## 3. Multi-Tenant & Role Isolation

- **Role hierarchy (`USER`, `ADVISOR`, `ADMIN`):** Admin routes require verified `ADMIN` privileges; advisor routes validate explicit advisor-client grants; sharing plan management validates owner or assigned advisor identity (`backend/test/unit/sharing/sharing-api.test.ts`).
- **Tenant & API key governance:** API keys issue prefixed one-time secrets (`wa_live_...`), store only hashed digests server-side, enforce explicit scope arrays (`API_KEY_PERMISSIONS`), and bind per-minute rate limits and monthly token quotas.
- **Boundary enforcement:** Dependency rules prevent `backend` and `frontend` from cross-importing (`make deps-lint`), keeping validation and error codes in `rules` and `contracts`.

## 4. Quantitative & Financial Conservation Invariants

Every algorithmic route enforces mathematical invariants checked on every CI run via `make test-property`:

1. **Portfolio simplex & position caps:** Allocated asset weights sum to `1.0` within tolerance with non-negative weights and concentration ceilings.
2. **Sharia compliance zero-debt invariant:** Sharia-filtered baskets reject high-leverage/conventional-debt issuers (`debtRatio <= 0.33`).
3. **Self-financing rebalance conservation:** Planned `BUY` notional proceeds never exceed available `SELL` proceeds.
4. **Risk recalibration monotonicity:** Lower emergency runway or `Family` dependent obligations monotonically cap or reduce effective risk score.

## 5. Auditability, Privacy Masking & Build Hygiene

- **Immutable SHA-256 ledger:** Trade executions append chained/hashed audit records queryable by authorized principals.
- **Privacy-masked sharing:** Shared plans support explicit redaction of holdings and absolute currency balances while retaining percentage allocation weights.
- **Secret & supply-chain hygiene:** `.env` files, `.vercel/` build dirs, and plaintext provider secrets are excluded from version control; MongoDB schema validators and unique indexes are verified in `backend/test/unit/core/contract-parity.test.ts`.
