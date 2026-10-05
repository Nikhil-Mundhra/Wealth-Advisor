# Sync agent

last synced: 489f881

## Calls
- `agents/docs/sync-docs.md` : unchecked changes, owning map, report; use this file's `last synced:`

## Rules
- Scope: `AGENTS.md` and `agents/**/*.md`: `## Route`, `## Axes`, `## Calls`, `## File structure`.

## Workflow
1. Changed source files: fix their lines in the owning map.
2. New component in an area: guide + `## Route` line in `agents/<area>/index.md`; new area: `agents/<area>/index.md` + `## Route` line in `AGENTS.md`.
3. Added, removed or renamed guide: its `## Route` line and every `## Calls` or `## Axes` line naming it.
4. `make docs-lint`, report, set `last synced:` per `agents/docs/sync-docs.md`.

## File structure`.
- Each source file appears in exactly one map, the owning map; no map lists a path missing from `git ls-files` or the working tree.
- Every path in a `## Route` or `## Calls` list exists.

## Workflow
1. Collect and classify unchecked changes per `agents/docs/sync-docs.md`.
2. Added, removed or renamed source file: fix its line in the owning map.
3. New component inside an area: one guide from the component-guide template + one `## Route` line in `agents/<area>/index.md`.
4. New area (top-level directory): `agents/<area>/index.md` from the area-index template + one `## Route` line in `AGENTS.md`.
5. Added, removed or renamed file under `agents/`: its `## Route` line in the area index or `AGENTS.md`, and every `## Calls` line that names it.
6. `make docs-lint` passes; report and update `last synced:` per `agents/docs/sync-docs.md`.
