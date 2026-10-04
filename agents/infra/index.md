# Infra

## Route
- adding or changing a port → `agents/infra/ports.md`
- adding a container → `agents/infra/containers.md`
- changing Vercel routing or deploying → `agents/infra/vercel.md`
- ports, request routing, environment variables → `docs/infra/index.md`

## Rules
- Routing parity: a change to one implementer in `docs/infra/routing.md` changes all of them in the same change.
- Secrets live in the Vercel project or `.env.local`; never in `vercel.json`, compose files or the Makefile.
