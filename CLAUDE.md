# Agent

Entry point. Pick the route for the task, read that file, follow its `## Calls`.

## Route
- frontend code → `agents/frontend/index.md`
- backend code → `agents/backend/index.md`
- shared packages and dependency direction between workspaces → `agents/shared/index.md`
- ports, routing, containers, Vercel deploy → `agents/infra/index.md`
- code style for any code: imports, syntax, naming, exports, constants, comments → `agents/code.md`
- docs, guides and file maps: writing or changing any .md → `agents/docs/writing.md`
- syncing file maps and docs after commits → `agents/docs/sync-docs.md`
- checking that a commit range updated the docs that own it → `agents/docs/doc-drift.md`
- syncing routes and guides after commits → `agents/docs/sync-agent.md`
- judging the project against the hackathon brief → `agents/meta/review.md`
- understanding the system: architecture, API routes, error codes, environment, ports; choosing what to refactor → `docs/index.md`
- how advice is produced: advisory stages, engines, tiers, agent tools; what the advisory domain still lacks → `docs/domain/index.md`

## Rules
- change: one file, one responsibility; update the owning map in the same change.
- delete/rename: grep the symbol or path, remove its references first, re-grep returns nothing.
- commit: `make test` green; never commit `.env`, `.env.local`, `.vercel/`, `dist/`; no AI attribution lines.
- commands: `make help` lists every task (dev, build, test, db, deploy).
- data: `make seed-demo` is local only.
- docs: kebab-case `.md` names (`docs/implementation-plan.md`); root standards (`AGENTS.md`, `README.md`, `CLAUDE.md`) stay UPPER.
- entry: `CLAUDE.md` is a byte copy of `AGENTS.md`; edit `AGENTS.md`, then `cp AGENTS.md CLAUDE.md`.
- icons: strict no-emoji policy across UI, copy, code, commit messages, and docs; use vector SVG icons (e.g. lucide-react) for all icons, badges, and visual indicators.
