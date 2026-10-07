# Writing docs

## Rules
- role: guides (`AGENTS.md` and `agents/`, at the root and in each repo) hold directives; docs (`docs/`, at the root and in each repo) hold facts.
- placement: a guide or fact about one repo lives in that repo (`<repo>/AGENTS.md`, `<repo>/agents/`, `<repo>/docs/`); the root holds only what spans repos.
- ownership: one fact, one owner; grep for it before writing; elsewhere link.
- edges: guides → docs → docs; never docs → guides.
- axes: each rule has one owner. `## Route` lines in a repo entry name the axes each guide owns, `## Axes` names axes owned by another repo or guide, and rule lines start with their axis when a file owns several.
- guide content: directives only; never restate what the code or the file layout already shows.
- doc content: facts and invariants (the unspoken rules a decision must respect, stated as facts: "a present but invalid token is never served the demo account"); a doc never decides, so a directive belongs in a guide.
- reasoning: no `because`/`so` clauses, rejected alternatives, history or motivation in guides or docs; the why goes in a code comment (`agents/code.md`) or the commit message.
- form: one statement per fact; a table when facts share attributes; no prose a table or bullet can carry.
- conflict: code is the source; a doc that disagrees with it is corrected, never followed.
- enforced by `make docs-lint`: existing paths, one map per path, every source file mapped, sorted maps, an `index.md` in every docs folder, every .md reachable from the root `AGENTS.md`, each `CLAUDE.md` identical to the `AGENTS.md` beside it.

## Workflow
- add a doc: template → folder `index.md` line (a guide: `## Route` line instead)
- modify: change only the stale statement; keep headings, they are link targets
- finish: `make docs-lint`

## Templates
- repo entry (`<repo>/AGENTS.md`): `## Route` · `## Axes` · `## Rules` · `## Workflow` · `## File structure`
- component guide: `## Calls` · `## Rules` · `## Workflow` · `## File structure`
- all guides: omit empty sections; workflow lines are one-line cross-file obligations or non-obvious order, never what the layout implies
- map: flat `path : responsibility` lines, sorted by path, one code block, no tree glyphs, no padding
- index (`index.md` in every docs folder): title + one map
- fact doc: facts and invariants only; architecture docs start with `## Diagram` (Mermaid), then tables
- API route doc: `## <METHOD> <path>` + bullets `responsibility`, `contract`; `nested route / query` only when there is one

## File structure

```
scripts/docs-lint.mjs : fails on docs → guides links, missing referenced paths, a path in two maps, unsorted maps, unmapped source files, docs folders without index.md, .md unreachable from the root AGENTS.md, a CLAUDE.md differing from the AGENTS.md beside it
```
