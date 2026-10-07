# Sync agent

## Calls
- `agents/docs/sync-docs.md` : `last synced:`, unchecked changes, owning map, report

## Rules
- Scope: every `AGENTS.md` and every `agents/` folder, root and repo: `## Route`, `## Axes`, `## Calls`, `## File structure`.

## Workflow
1. Changed source files: fix their lines in the owning map.
2. New component in a repo: guide in `<repo>/agents/` + `## Route` line in `<repo>/AGENTS.md`; new repo: `<repo>/AGENTS.md` + `CLAUDE.md` copy + `## Route` line in the root `AGENTS.md`.
3. Added, removed or renamed guide or entry: its `## Route` line and every `## Calls` or `## Axes` line naming it.
4. `make docs-lint`, report, set `last synced:` in `agents/docs/sync-docs.md`.
