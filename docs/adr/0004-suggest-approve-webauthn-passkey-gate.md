# ADR-0003: Integer Minor Units and Exact Rational Arithmetic Over Floating-Point Money

- Status: Accepted
- Date: 2026-11-14

## Context

Expat cashflows and cross-border portfolio valuations span `EUR`, `GBP`, `USD`, `SGD`, `CNY`, `AED`, `INR`, `CHF`, and `JPY`. IEEE-754 binary floating-point arithmetic (`0.1 + 0.2 !== 0.3`) introduces cent-level rounding drift when converting FX pairs, summing account balances, and validating self-financing rebalance proceeds.

## Decision

1. Store and transport every monetary balance and transaction amount as an **integer minor unit** paired explicitly with an ISO currency code (`Money`, `@wealth-advisor/contracts`, `transactions`, `accounts`).
2. Perform all FX rate scaling and cross-rate inversions using exact `BigInt` rational numerator/denominator arithmetic in `backend/src/modules/market/domain/decimal.ts` and `backend/src/modules/market/domain/fx-rate.vo.ts`, rounding only at the final integer minor-unit boundary.
3. Persist documents in MongoDB with explicit `$jsonSchema` validators and compound unique indexes declared in each module schema alongside versioned `schema_migrations` (`backend/src/core/db/migrations/migration-runner.ts`).

## Alternatives Considered

- **IEEE-754 floats everywhere:** Unacceptable silent rounding drift in multi-currency reconciliation and ledger hashes.
- **PostgreSQL + Prisma with `NUMERIC`:** Strong ACID relational joins across normalized tables, but requires migrating an existing document schema model and paid managed Postgres hosting compared to MongoDB Atlas M0 free tier.

## Consequences

- **Positive:** Zero binary float rounding drift across currency conversions (`backend/test/unit/rules/property-invariants.test.ts` asserts inverse and identity round-trip tolerances across 40 randomized trials); atomic single-document upserts and SHA-256 ledger hashing stay fast.
- **Negative / Exit Criteria:** Multi-collection accounting invariants (such as simultaneous multi-account double-entry clearing in real money custody) would require multi-document replica-set transactions or migration to PostgreSQL serializable transactions if the product ever moves beyond simulated sandbox custody.
