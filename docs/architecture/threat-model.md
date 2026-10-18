# Threat Model & Security Controls

This document details the architectural threat model for the Dynamic Expat Wealth Agent (DEWA) across the STRIDE methodology, differentiating between load-bearing security controls and defense-in-depth safeguards.

---

## 1. System Scope & Trust Boundaries

The system manages multi-currency expat wealth portfolios, financial analytics, risk profiling, and AI-driven advisory interactions.

### Trust Boundaries:
1. **Client to Backend (Boundary T1):** Web browser to edge and backend HTTP API. Untrusted inputs, bearer tokens, cookies.
2. **Backend to Database (Boundary T2):** Internal network communication between backend services and MongoDB.
3. **Backend to External Market Providers (Boundary T3):** Outbound HTTPS calls to Marketstack and Frankfurter.
4. **Backend to AI Model Providers (Boundary T4):** Outbound HTTPS calls to LLM inference endpoints. Zero-retention policy applies.
5. **Continuous Integration & Build Pipeline (Boundary T5):** GitHub Actions runners, dependency downloads, and test environments.

---

## 2. STRIDE Threat Analysis

| Category | Threat Description | Architectural Mitigation | Control Type |
|---|---|---|---|
| **Spoofing** | Attacker steals or replays refresh tokens to impersonate legitimate users. | Refresh token family rotation with compare-and-set semantics; immediate revocation of all child sessions upon replay detection (`AU_1003`). `HttpOnly`, `Secure`, `SameSite=Lax` cookies path-scoped strictly to `/api/auth`. | Load-bearing |
| **Spoofing** | Attacker passes an arbitrary tenant ID in request headers to view another tenant's financial data. | Tenant context is resolved strictly from the verified Ed25519 access token claims (`tenant_id`). No client-supplied header or query can override tenant tenancy. | Load-bearing |
| **Tampering** | Attacker sends multi-megabyte payloads to trigger Out-Of-Memory crashes. | Strict 1MB JSON body size limit enforced at `readJsonBody`; rejects oversized requests with HTTP 413 `CORE_PAYLOAD_TOO_LARGE`. | Load-bearing |
| **Tampering** | Prompt injection attacks via untrusted user inputs aiming to trigger unapproved trades. | LLMs have strictly read-only and analytical capabilities; tool calls cannot perform state-modifying trades directly. Tier 3 sandbox trades require verified WebAuthn/Passkey assertion server-side prior to execution. | Load-bearing |
| **Repudiation** | User claims an automated trade was executed without their consent. | Every rebalance and sandbox trade produces an immutable, SHA-256 digested audit entry in the event ledger linked to a cryptographic Passkey signature assertion. | Load-bearing |
| **Information Disclosure** | Sensitive financial PII (balances, account numbers, names, email) leaked to external LLM providers. | Prompt sanitization chokepoint strips `email` and `displayName`, tokenizes portfolio identifiers into opaque handles, and enforces a strict field allow-list (`docs/architecture/data-classification.md`). | Load-bearing |
| **Information Disclosure** | Token exfiltration via HTTP `Referer` header on unauthenticated share links (`/share/:token`). | Global `Referrer-Policy: strict-origin-when-cross-origin` header and CSP prevent token leakage across origin boundaries. | Defense-in-depth |
| **Denial of Service** | Malicious users exhaust external market API quotas or LLM token budgets. | Request budget manager tracks and bounds external provider calls. Strict rate and quota checks reject unbudgeted requests with `MK_1902` before invoking remote APIs. | Load-bearing |
| **Elevation of Privilege** | Normal user attempts to execute privileged admin operations (`/api/admin/*`). | Route guards verify the `ADMIN` role claim in the verified JWT payload (`AU_1005`). | Load-bearing |

---

## 3. Load-Bearing vs. Defense-in-Depth Controls

### Load-Bearing Controls (Fail-Closed)
- **Token Verification:** Asymmetric Ed25519 (`EdDSA`) access tokens verified by signature, expiration, issuer, and audience before granting access.
- **Tenant Isolation:** Scoped database queries keyed strictly on JWT claims (`tenant_id`).
- **Passkey Step-Up Authorization:** Tier 3 sandbox executions require a fresh, valid WebAuthn assertion verified server-side.
- **Payload Size Enforcement:** Global 1MB threshold on JSON parsing preventing Node.js event-loop exhaustion.
- **Strict Data Sanitization:** Single chokepoint for all LLM prompt assembly enforcing zero PII egress.

### Defense-in-Depth Safeguards
- **Security Headers:** Hono `secureHeaders` middleware setting `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`.
- **CORS Restrictions:** Explicit HTTP method allow-lists and credential validation.
- **Dependency Auditing:** Automated `npm audit --omit=dev --audit-level=high` quality gate in CI pipeline.
- **Least-Privilege CI:** GitHub Actions workflows restricted to `permissions: read-all`.

---

## 4. Hardened Build & Network Egress Considerations

During automated testing and continuous integration:
- `mongodb-memory-server` downloads a pre-compiled MongoDB binary during initial test execution when not cached. In hardened production build environments, this binary download is restricted to local caching (`~/.cache/mongodb-binaries`) or pre-built container images.
- Outbound network egress from production application servers is restricted to verified external provider domains (ECB/Frankfurter, Marketstack, and approved LLM gateway endpoints).
