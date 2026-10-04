# Writing comments

## Rules
- Comment why, not what: a constraint, a measurement, a rejected alternative, a trap.
- Never restate the code, narrate steps, or keep commented-out code.
- A comment introducing a block inside a function means the block should be a function; extract it.
- One file-level line stating the responsibility only when the file name does not.
- No author, date, ticket or changelog comments; git holds those.

## Workflow
- adding code: write the code first; add a comment only for a fact the code cannot carry
- changing code: update or delete every comment the change made untrue
- refactoring: comment count stays the same or drops unless a new fact appears
