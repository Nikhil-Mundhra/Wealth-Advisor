# Sync agent

last synced: 34197c8

## Calls

- `agents/sync_docs.md` : for unchecked changes, map ownership, format, report and the `last synced:` update; use this file's `last synced:`

## Scope

`Agent.md` and `agents/**/*.md`: file maps, `## Implementation guide`, `## Calls`.

## Steps

1. Collect and classify unchecked changes per `agents/sync_docs.md`.
2. Each added, removed or renamed source file appears in exactly one map, the owning map; no map lists a path missing from `git ls-files` or the working tree.
3. New top-level directory with its own guide: add `<dir>/ : <responsibility> (map: <guide>)` to `Agent.md` `## File structure`.
4. Added, removed or renamed file under `agents/`:
   - `Agent.md` `## Implementation guide` : `` - `<path>` : when <task> ``
   - `agents/writing_docs.md` docs map : `<path> : <responsibility>`
5. Every path in a `## Calls` or `## Implementation guide` list exists.
6. Report and update `last synced:` per `agents/sync_docs.md`.
