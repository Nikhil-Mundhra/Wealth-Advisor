# ADR-0001: Neuro-Symbolic Boundary Between LLM Narration and Deterministic Engines

- Status: Accepted
- Date: 2026-11-14

## Context

Consumer foundation models hallucinate arithmetic, drift across multi-turn prompts, and cannot guarantee regulatory constraints such as Sharia/AAOIFI screening or family emergency-runway floors. At the same time, expatriate wealth advisory requires natural-language synthesis across heterogeneous personal cashflows, multi-currency corridors, and suitability rules.

## Decision

Strictly isolate probabilistic LLM generation from mathematical computation and compliance enforcement:

1. Deterministic calculations live only in `@wealth-advisor/rules` (`rules/src/portfolio-optimizer.rule.ts`) and typed backend domain services (`backend/src/modules/finance/domain/burn-rate-calculator.ts`, `backend/src/modules/market/domain/decimal.ts`).
2. `createAgentOrchestrator` (`backend/src/modules/advisory/domain/agent-orchestrator.ts`) invokes tools strictly through `ToolRegistry`, computes ground-truth facts before prompt construction, and runs `sanitizeUntrustedInput` (`backend/src/modules/advisory/domain/prompt-guard.ts`) to strip prompt-injection attempts and PII prior to external model calls.
3. Every generated reply passes through `shieldText` (`backend/src/modules/advisory/domain/calculation-shield.ts`), which verifies that every number stated by the LLM traces back to a pre-computed engine fact; ungrounded replies fail closed to a deterministic fallback response.

## Alternatives Considered

- **Pure LLM tool-loop with CoT math prompts:** Simpler initial prompt engineering, but fails property invariants under model upgrades and cannot deterministically pass CI without live API calls.
- **Template-only rule responses without an LLM:** Zero hallucination risk, but produces rigid responses unable to contextualize multi-lingual user questions.

## Consequences

- **Positive:** Property-based tests (`make test-property`) and versioned advisory evals (`make eval`) run deterministically in `<100ms` with `mock` adapters and enforce zero hallucinated numbers against live providers (`openrouter`, `gemini`, `anthropic`, `openai`).
- **Negative / Trade-off:** Introducing new computed metrics requires updating deterministic fact assembly (`buildAdvisoryFacts`) alongside any prompt wording changes, otherwise `shieldText` rejects the new figure.
