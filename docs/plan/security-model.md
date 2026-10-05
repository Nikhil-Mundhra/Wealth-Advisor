# Security model

## Calculation shield
- The LLM never computes weights, returns, variances or burn rates.
- It calls typed calculation tools; the engine runs deterministic TypeScript and returns JSON.
- The LLM explains the result in the user's locale as the three-pillar rationale: personal finance, cross-border FX, wealth strategy; cross-border disclaimers are appended.

## Permission tiers
| Tier | Scope | Runs |
|---|---|---|
| 0 Read | balances, transactions, asset catalogue, portfolio, shared plan view | autonomously |
| 1 Advisory | risk profile update, target portfolio, hedge suggestion; advisory only | autonomously |
| 2 Simulate | what-if stress tests (e.g. −10% FX shock, €15,000 remittance spike) | on user request |
| 3 Execute | sandbox ledger mutations: rebalance order, liquidity ring-fencing | only after a passkey assertion |

API keys carry tiers as scopes: `read:analytics`, `advisory:recommend`, `simulate:stress-test`, `execute:sandbox`.

## Passkeys (FIDO2 / WebAuthn)
- Sign-in and enrolment replace passwords; enrolment at onboarding or `/settings/security`.
- `rpId` from the environment: `localhost` locally, the production domain on Vercel.
- Tier 3 step-up: the backend issues a challenge → `navigator.credentials.get` → the backend verifies the signature against the stored public key → the assertion is stored with the ledger entry.
- Audit digest: `SHA256(userId + tenantId + timestamp + passkeySignature + tradeDiff)`.

## API keys
Stored as SHA-256 hashes; the plaintext carries a prefix (`dewa_live_…`). Limits per tenant: requests per minute, monthly token budget.

## Share links
- `/share/:token`: random token, TTL (7 or 30 days), optional passphrase.
- Tier 0 only: recipients view the plan and rationale and run non-mutating simulations; never execute.
- Privacy masking shows weights, asset classes and risk metrics, without absolute amounts.

Stored shapes: `docs/plan/collections.md`.
