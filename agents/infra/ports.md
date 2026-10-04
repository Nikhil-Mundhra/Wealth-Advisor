# Infra: ports

## Calls
- `docs/infra/ports.md` : current numbers, ranges and every file that sets each port

## Rules
- The Makefile variable is the source; pick numbers inside the role's range.
- Every file `docs/infra/ports.md` lists for a port changes with it in the same change.

## Workflow
- add or change a port: Makefile variable → every other file listed for it in `docs/infra/ports.md` → `docs/infra/ports.md` → `make restart` and `make status`
