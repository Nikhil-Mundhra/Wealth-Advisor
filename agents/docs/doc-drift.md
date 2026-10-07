# Doc drift check

status: planned · not built

## Calls
- `scripts/docs-lint.mjs` : the checker to extend; every finding comes from it
- `agents/docs/sync-docs.md` : `last synced:`, the local diff base, and the edit pass

## Rules
- ownership is declared: each check maps a changed path prefix to the one doc that owns it; no check infers an owner from a heuristic.
- motion is not coverage: a finding names a changed code path and the doc that must change with it; no check passes because a `.md` file was touched.
- truth is not mechanised: whether a statement still holds is judged at commit time in `agents/docs/sync-docs.md`, never by a check.
- no model in CI: checks stay deterministic and reviewable.
- diff base: pull-request base SHA in CI, `last synced:` locally; an unresolvable base reports and exits 0.
- severity: a new check reports `stale <code> : <doc> : <path>` as a warning; promote it to failure only after a commit range that produced zero false positives.
- suppression: any path or rule excluded from a check is listed in the owning doc with its reason.

## Checks
| code | changed | owning doc | severity |
|---|---|---|---|
| `map` | any tracked file | its owning `## File structure` map | failure, already in `scripts/docs-lint.mjs` |
| `sync` | `agents/docs/sync-docs.md` `last synced:` | none | failure, Phase 1 |
| `module` | new `backend/src/modules/<name>/` | `backend/docs/module-dependencies.md` | warning, Phase 1 |
| `engine` | new export in `backend/src/modules/*/domain/` | `docs/domain/advisory-pipeline.md` | warning, Phase 1 |
| `route` | new entry in `backend/src/app.ts` | `contracts/docs/apis/index.md` | warning, Phase 2, after those docs are tabular |
| `contract` | new export in `contracts/src/` | `contracts/AGENTS.md` | warning, Phase 2 |

## Workflow
1. Table before checks: the prefix → doc map lives in `scripts/docs-lint.mjs`; a check with no declared owner is not written.
2. Land `sync` and `module` and `engine` as warnings; leave the severity of `route` and `contract` open.
3. Per range, count each warning's false positives; promote only the checks that reach zero.
4. Then the skill half: `agents/docs/sync-docs.md` runs the checker before its map pass, and the commit rule in `AGENTS.md` names the run.
