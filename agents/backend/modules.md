# Backend: modules

## Calls
- `docs/backend/module-contract.md` : manifest fields and how modules are mounted
- `agents/backend/errors.md` : the module's error prefix and statuses
- `agents/backend/persistence.md` : when the module owns collections

## Rules
- A module is `modules/<name>/{presentation,application,domain,infrastructure}` plus `<name>.module.ts`, its composition root.
- The composition root builds every layer and returns one manifest from `defineModule`; nothing else constructs concrete classes.
- `modules/index.ts` lists modules by static import; never load a module dynamically.

## Workflow
- add a module: layer folders + `<name>.module.ts` → register the module's error prefix and statuses (`agents/backend/errors.md`) → one line in `modules/index.ts` → components row in `docs/architecture/c3-backend.md` → map lines

## File structure

```
backend/src/modules/auth/auth.module.ts : composition root: wires repositories → use cases → routes
backend/src/modules/index.ts : explicit list of modules (static imports so Vercel can bundle them)
```
