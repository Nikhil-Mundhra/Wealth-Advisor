# Sync docs

last synced: 1c46d5b

## Calls
- `agents/docs/writing.md` : when writing any map line or doc section

## Rules
- Owning map: the guide whose `## File structure` holds the path's prefix; a root file belongs to `Agent.md`. A path under no guide's prefix goes to the guide of the component that owns it; a new area gets its own guide (`agents/docs/sync-agent.md`).
- Inventory of a `.md`: under `docs/`, its folder `index.md`; a guide, the `## Route` line in its area index or `Agent.md`.
- One `path : responsibility` line per file, inside the map's existing code block, in path order.
- Keep each file's existing sections; add none.
- Report aggregated responsibilities; do not fix them.

## Workflow
1. Unchecked changes: `git log --stat --reverse <last synced>..HEAD` plus `git status --short`. Each file listed is unchecked.
2. Classify each unchecked file: added, removed, renamed, modified. Skip package-lock.json and build output.
3. Read each added, renamed or modified file, then compare it with its line in the owning map or inventory:
   - added : add a line
   - removed : delete the line
   - renamed : change the path, keep or correct the responsibility
   - modified : rewrite the responsibility only if the file's job changed
4. Docs reachable from `docs/index.md` that describe a changed file: correct the stale statement only.
5. `make docs-lint` passes.
6. Report.
7. Set `last synced:` to `git rev-parse --short HEAD`.

## Report

```
<path> : <current responsibility> : <jobs it combines>
```

- Aggregated: the responsibility needs "and", or lists several jobs.
- Empty report: `no aggregated responsibilities`.
