# Writing docs

## Rules
- No internal reasoning or verbosity. Directives and unspoken rules only.
- Before writing, identify the structure of the .md or section and its responsibility; write only what belongs there.
- Guides (`Agent.md`, `agents/`) hold directives, workflow and `## Calls`; docs (`docs/`) hold facts.
- One fact, one owner. Grep for the fact before writing it; everywhere else link, never restate.
- Edges are one-way: guides → docs, docs → docs (index → leaf, leaf → sibling). Docs never link to `agents/`.
- A folder's `index.md` is the only inventory of that folder; every docs folder has one.
- File maps live in the `## File structure` of the guide that owns those paths; a path appears in exactly one map.
- Maps: flat `path : responsibility` lines, sorted by path, in one code block; no tree glyphs, no padding.

## Workflow
- add a section: take the template for the doc type; insert in template order; no prose between sections
- add a doc: create from its template → one line in the folder `index.md` → if it is a guide, one `## Route` line in its area index or `Agent.md`
- add a component: one guide + one `## Route` line in the area index; plus one doc + one docs-index line only if it brings new facts
- modify: change only the stale statement; keep heading names, they are link targets
- delete: grep the path and its headings → remove references (indexes, maps, `## Calls`, `## Route`) → delete the file → re-grep returns nothing
- finish: `make docs-lint` passes

## Templates
- area index guide (`Agent.md`, `agents/<area>/index.md`): `## Route` · `## Rules` · `## File structure`
- component guide (`agents/**/*.md`): `## Calls` · `## Rules` · `## Workflow` · `## File structure`; omit empty sections; guide-specific sections go after `## Workflow`
- index (`docs/**/index.md`): title + one map code block
- fact doc: facts only; architecture docs start with `## Diagram` (Mermaid), then tables
- API route doc: `## <METHOD> <path>` + bullets `nested route / query`, `responsibility`, `contract` (model: `docs/shared/apis/auth.md`)

## File structure

```
scripts/docs-lint.mjs : fails on docs → agents links, a path in two guide maps, missing referenced paths, docs folders without index.md, .md unreachable from Agent.md
```
