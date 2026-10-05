# Brief

Concept and research question: `README.md`.

| | |
|---|---|
| Project | Dynamic Expat Wealth Agent (DEWA) |
| Competition | FinTechathon 2026, International Track: "AI as a Financial Participant" |
| Core topic | B: Wealth Advisory Agent |
| Extensions | A: Personal & Family Finance; C: Cross-Border & Student Finance |
| Persona | `docs/plan/persona.md` |

## Scoring rubric
| Pillar | Weight | Planned features |
|---|---|---|
| Task completion | 40% | multi-currency cash flow (EUR, GBP, USD, SGD, CNY); individual vs family liquidity pooling; expat risk profiling; multi-asset matching; Black-Litterman/MVO allocation; sandbox trade execution |
| Security & compliance | 30% | permission tiers with passkey step-up (`docs/plan/security-model.md`); tenant isolation; masked read-only share links; calculation shield; cross-border regulatory checks; immutable sandbox audit log |
| Innovation & interaction | 30% | burn-rate risk recalibration (A → B); FX shock absorption and remittance timing (C → B); streaming copilot with action cards; three-pillar rationale; share links; four locales; dark mode; mobile web and native apps |
| Bonus | 0–5 pts | hash-verified sandbox ledger with an optional on-chain anchor |

## Household scope
Standalone expense tracking is Topic A. Household mode is in Topic B scope because it sets the liquidity carve-out and the risk penalty in the optimizer.

| Mode | Income | Emergency buffer | Risk capacity |
|---|---|---|---|
| `INDIVIDUAL` | one stream; personal burn rate | 3–6 months | higher |
| `FAMILY_HOUSEHOLD` | pooled multi-currency; dependants (education, parents' remittances) | 6–12 months | conservative |
