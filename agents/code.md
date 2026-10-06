# Code

## Rules
- imports: relative imports carry `.ts`/`.tsx`; type-only names use `import type`; packages are imported only through their barrel.
- syntax: erasable TypeScript only (Node strips types; `frontend/tsconfig.json` does not enforce it): no `enum`, namespace, decorator or parameter property; closed sets are `as const` objects.
- naming: kebab-case files with the area's role suffix; follow the suffixes already in the folder.
- exports: named only; the one default export is `backend/src/app.ts` (Vercel entry). No new `index.ts` barrels.
- constants: limits, patterns, error codes and validation keys shared between workspaces or visible on the wire live in `rules/`, never as literals elsewhere; a constant internal to one mechanism stays beside it.

## Comments
- Comment why, not what: a constraint, a measurement, a rejected alternative, a trap.
- Never restate the code, narrate steps, or keep commented-out code; a comment introducing a block means extract a function.
- One file-level line only when the file name does not state the responsibility.
- No author, date, ticket or changelog comments.
- A change updates or deletes every comment it made untrue.
