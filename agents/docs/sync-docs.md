# Sync docs

last synced: b8b52d7

## Calls
- `agents/docs/writing.md` : map and doc format; the rules every changed doc must still meet

## Rules
- Owning map: the guide whose `## File structure` holds the path's prefix; a conventional root file (`CONVENTIONAL` in `scripts/docs-lint.mjs`) needs no map, any other root file goes in the root `AGENTS.md` map; a file inside a repo goes in that repo's guides; a new repo or component gets a guide (`agents/docs/sync-agent.md`).
- Keep each file's existing sections; add none.
- Report contradicted rules and writing violations; do not fix them.
- Report scope: files changed in the range only.

## Workflow
1. Unchecked changes: `git log --stat --reverse <last synced>..HEAD` plus `git status --short`; skip package-lock.json and build output. A `last synced:` that is not an ancestor of HEAD (rewritten history): use the HEAD commit with the same subject, else the whole history, and say which in the report.
2. Read each added, renamed or modified file; add, delete, re-path or rewrite its map line (rewrite only if the file's job changed).
3. Docs that describe a changed file: grep `docs/` and every `<repo>/docs/` for its path, basename and new exported names; correct each stale statement and add each missing item. A changed file that adds an invariant or constraint no doc states: add it, as a fact, to the doc that owns the file's area.
4. Every `## Rules` line in any `AGENTS.md` or `agents/` (root or repo) that a changed file now contradicts: report it with that file.
5. Every doc or guide changed in the range: check it against `agents/docs/writing.md`; report directives or reasoning in docs, a fact with two owners, and any real host, username or key.
6. `make docs-lint`, report, set `last synced:` to `git rev-parse --short HEAD`.

## Report

```
rule <guide>:<line> : contradicted by <path>
writing <path> : <violation>
```

- Empty report: `no findings`.
