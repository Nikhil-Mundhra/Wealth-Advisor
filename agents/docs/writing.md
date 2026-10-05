# Writing docs

## Rules
- role: guides (`AGENTS.md`, `agents/`) hold directives; docs (`docs/`) hold facts.
- ownership: one fact, one owner; grep for it before writing; elsewhere link.
- edges: guides → docs → docs; never docs → guides.
- axes: each rule has one owner. Area index `## Route` lines name the axes each guide owns, `## Axes` names axes owned by another area, and rule lines start with their axis when a file owns several.
- style: directives and unspoken rules only; no reasoning; never restate what the code or the file layout already shows.
- enforced by `make docs-lint`: existing paths, one map per path, every source file mapped, sorted maps, an `index.md` in every docs folder, every .md reachable from `AGENTS.md`, `CLAUDE.md` identical to `AGENTS.md`.

## Workflow
- add a doc: template → folder `index.md` line (a guide: `## Route` line instead)
- modify: change only the stale statement; keep headings, they are link targets
- finish: `make docs-lint`

## Templates
- area index guide: `## Route` · `## Axes` · `## Rules` · `## Workflow` · `## File structure`
- component guide: `## Calls` · `## Rules` · `## Workflow` · `## File structure`
- all guides: omit empty sections; workflow lines are one-line cross-file obligations or non-obvious order, never what the layout implies
- map: flat `path : responsibility` lines, sorted by path, one code block, no tree glyphs, no padding
- index (`docs/**/index.md`): title + one map
- fact doc: facts only; architecture docs start with `## Diagram` (Mermaid), then tables
- API route doc: `## <METHOD> <path>` + bullets `responsibility`, `contract`; `nested route / query` only when there is one

## File structure

```
scripts/docs-lint.mjs : fails on docs → agents links, missing referenced paths, a path in two maps, unsorted maps, unmapped source files, docs folders without index.md, .md unreachable from AGENTS.md, CLAUDE.md differing from AGENTS.md
```
