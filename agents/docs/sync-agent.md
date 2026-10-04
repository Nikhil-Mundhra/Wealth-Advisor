# Sync agent

last synced: 1c46d5b

## Calls
- `agents/docs/sync-docs.md` : unchecked changes, owning map, format, report and the `last synced:` update; use this file's `last synced:`

## Rules
- Scope: `Agent.md` and `agents/**/*.md`: `## Route`, `## Calls`, `## File structure`.
- Each source file appears in exactly one map, the owning map; no map lists a path missing from `git ls-files` or the working tree.
- Every path in a `## Route` or `## Calls` list exists.

## Workflow
1. Collect and classify unchecked changes per `agents/docs/sync-docs.md`.
2. Added, removed or renamed source file: fix its line in the owning map.
3. New component inside an area: one guide from the component-guide template + one `## Route` line in `agents/<area>/index.md`.
4. New area (top-level directory): `agents/<area>/index.md` from the area-index template + one `## Route` line in `Agent.md`.
5. Added, removed or renamed file under `agents/`: its `## Route` line in the area index or `Agent.md`, and every `## Calls` line that names it.
6. `make docs-lint` passes; report and update `last synced:` per `agents/docs/sync-docs.md`.
