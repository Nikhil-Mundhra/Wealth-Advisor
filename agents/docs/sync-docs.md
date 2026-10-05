# Sync docs

last synced: d68fbba

## Calls
- `agents/docs/writing.md` : map and doc format

## Rules
- Owning map: the guide whose `## File structure` holds the path's prefix; a conventional root file (`CONVENTIONAL` in `scripts/docs-lint.mjs`) needs no map, any other root file goes in its area's guide; a new area gets a guide (`agents/docs/sync-agent.md`).
- Keep each file's existing sections; add none.
- Report aggregated responsibilities; do not fix them.

## Workflow
1. Unchecked changes: `git log --stat --reverse <last synced>..HEAD` plus `git status --short`; skip package-lock.json and build output.
2. Read each added, renamed or modified file; add, delete, re-path or rewrite its map line (rewrite only if the file's job changed).
3. Docs reachable from `docs/index.md` that describe a changed file: correct the stale statement only.
4. `make docs-lint`, report, set `last synced:` to `git rev-parse --short HEAD`.

## Report

```
<path> : <current responsibility> : <jobs it combines>
```

- Aggregated: the responsibility needs "and", or lists several jobs.
- Empty report: `no aggregated responsibilities`.
