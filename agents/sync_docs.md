# Sync docs

last synced: 34197c8

## Calls

- `agents/writing_docs.md` : when writing any map line or doc section

## Steps

1. Unchecked changes: `git log --stat --reverse <last synced>..HEAD` plus `git status --short`. Each file listed is unchecked.
2. Classify each unchecked file: added, removed, renamed, modified. Skip package-lock.json and build output.
3. Owning map: the guide named by the `(map: …)` pointer in `Agent.md` `## File structure` that covers the path; otherwise `Agent.md` itself. *.md files belong to the `agents/writing_docs.md` docs map.
4. Read each added, renamed or modified file, then compare it with its line in the owning map:
   - added : add a line
   - removed : delete the line
   - renamed : change the path, keep or correct the responsibility
   - modified : rewrite the responsibility only if the file's job changed
5. Docs in the `agents/writing_docs.md` docs map that describe a changed file: correct the stale statement only.
6. Report aggregated responsibilities; do not fix them.
7. Set `last synced:` to `git rev-parse --short HEAD`.

## Format

- One `path : responsibility` line per file, inside the map's existing code block, in path order.
- Keep each file's existing sections; add none.

## Report

```
<path> : <current responsibility> : <jobs it combines>
```

- Aggregated: the responsibility needs "and", or lists several jobs.
- Empty report: `no aggregated responsibilities`.
