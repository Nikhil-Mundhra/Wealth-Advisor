# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please report it privately. Do not open public GitHub issues or discussions for undisclosed security issues.

### Reporting Channels
- Primary contact: security@wealthadvisor.local (or submit via private GitHub Security Advisory)
- Please include:
  - Description of the vulnerability and attack vector
  - Step-by-step reproduction instructions or proof-of-concept
  - Impact assessment (confidentiality, integrity, availability)
  - Affected components, routes, or files

### Response SLA
- Initial acknowledgment: within 24 hours
- Vulnerability assessment and triage: within 72 hours
- Remediation timeline and coordinated disclosure: within 14 calendar days

---

## Supported Versions

Only the current main branch and latest released version receive security updates.

| Version | Supported |
|---|---|
| Main (`HEAD`) | Yes |
| < 1.0.0 | No |

---

## Security Architecture & Controls

### 1. Authentication and Session Cryptography
- Passwords hashed using `scrypt` (N=2^17, r=8, p=1) via `node:crypto`.
- Access tokens signed using asymmetric Ed25519 (`EdDSA`) key pairs with strict `iss`, `aud`, `sub`, and `jti` claims verification.
- Refresh tokens generated as 32 cryptographically secure random bytes; only SHA-256 digests are stored in the database.
- Refresh token rotation enforces family replay detection; any attempt to reuse an expired or rotated token immediately revokes the entire session family (`AU_1003`).

### 2. Cookie and Transport Security
- Refresh cookies use `HttpOnly`, `Secure`, `SameSite=Lax`, and are strictly path-scoped to `/api/auth`.
- `clearRefreshCookie` and `setRefreshCookie` share identical security attributes to prevent attribute-dropping attacks.
- Global security headers middleware on all routes:
  - `Content-Security-Policy`: restricts script execution, style sources, fonts, and images to self and approved CDNs.
  - `X-Frame-Options: DENY`: prevents clickjacking across all UI views.
  - `X-Content-Type-Options: nosniff`: blocks MIME-sniffing.
  - `Referrer-Policy: strict-origin-when-cross-origin`: prevents URL token leakage to third parties.

### 3. Request Boundaries and Denial-of-Service Defense
- Strict request size limit of 1MB (`MAX_JSON_BODY_BYTES`) enforced on all incoming JSON payloads via `readJsonBody`, returning HTTP 413 `CORE_PAYLOAD_TOO_LARGE`.
- Unknown `/api/*` routes terminate in deterministic error responses (`CORE_NOT_FOUND`) rather than falling through to application code.

### 4. AI & Data Privacy Controls
- Zero-retention model: prompts and LLM completion payloads are never persisted to MongoDB, operational logs, or browser `localStorage`.
- Direct identifiers (`email`, `displayName`, account numbers) are stripped before prompt payload construction.
- Strict data classification taxonomy (`docs/architecture/data-classification.md`) partitions data into Public, Internal, Confidential, and Restricted tiers.
- High-risk operations (such as portfolio rebalancing execution) require verified WebAuthn / Passkey assertion before execution.

### 5. Supply Chain & Continuous Integration Security
- Automated dependency vulnerability audits (`npm audit --omit=dev --audit-level=high`) run as blocking quality gates in CI.
- GitHub Actions workflows operate with least-privilege permissions (`permissions: read-all`).
- Automated dependency scanning and security updates via Dependabot (`.github/dependabot.yml`).
