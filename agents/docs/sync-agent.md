# Sync agent

last synced: d68fbba

## Calls
- `agents/docs/sync-docs.md` : unchecked changes, owning map, report; use this file's `last synced:`

## Rules
- Scope: `AGENTS.md` and `agents/**/*.md`: `## Route`, `## Axes`, `## Calls`, `## File structure`.

## Workflow
1. Changed source files: fix their lines in the owning map.
2. New component in an area: guide + `## Route` line in `agents/<area>/index.md`; new area: `agents/<area>/index.md` + `## Route` line in `AGENTS.md`.
3. Added, removed or renamed guide: its `## Route` line and every `## Calls` or `## Axes` line naming it.
4. `make docs-lint`, report, set `last synced:` per `agents/docs/sync-docs.md`.
