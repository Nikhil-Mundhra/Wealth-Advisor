# Architecture Decision Records

Each record documents the context, chosen design, rejected alternatives, trade-offs, and exit criteria for a load-bearing architectural boundary in DEWA.

```
docs/adr/0001-neuro-symbolic-boundary.md : neuro-symbolic boundary between deterministic computation and LLM narration
docs/adr/0002-mongodb-transactional-outbox-queue.md : MongoDB transactional outbox and dead-letter queue over dedicated brokers
docs/adr/0003-mongodb-and-rational-minor-unit-money.md : integer minor units and BigInt rational FX arithmetic over floats
docs/adr/0004-suggest-approve-webauthn-passkey-gate.md : code-enforced permission tiers and WebAuthn P-256 step-up approval
docs/adr/0005-hybrid-vercel-and-cloud-run-deployment.md : hybrid Vercel Atlas M0 showcase and scale-to-zero Cloud Run deployment
```
