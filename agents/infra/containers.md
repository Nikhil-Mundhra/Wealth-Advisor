# Infra: containers

## Calls
- `docs/architecture/c2-containers.md` : containers and their runtimes
- `docs/infra/ports.md` : free port ranges
- `docs/infra/routing.md` : when the container serves or proxies requests

## Rules
- Containers are local only and defined in `infra/docker-compose.yml`; host ports come from Makefile variables passed as environment.
- Every container has Makefile start, stop and status handling that never touches foreign processes.

## Workflow
- add a container: service in `infra/docker-compose.yml` → Makefile targets (`.PHONY`, `## ` help text, `stop`, `status`) → `docs/infra/ports.md` → `docs/architecture/c2-containers.md` → map line

## File structure

```
infra/docker-compose.yml : nginx container in front of the host backend; host port from PROXY_PORT
infra/nginx/default.conf : serves frontend/dist, proxies /api to the host backend, cache and security headers
```
