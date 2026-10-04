# Writing docs

- No internal reasoning or verbosity. Directives and unspoken rules only.
- Before writing, identify the structure of the .md or section and its responsibility; write only what belongs there.

## Docs file structure

```
Agent.md : agent entry point: file map and which guide to read for a task
README.md : hackathon project concept
agents/implementation_backend.md : backend implementation guide: backend file map
agents/implementation_frontend.md : frontend implementation guide: frontend file map
agents/meta/review.md : hackathon judge review guide (placeholder)
agents/sync_agent.md : agent-file sync guide: maps, guide index and calls against recent commits
agents/sync_docs.md : doc sync guide: maps and docs against recent commits
agents/writing_docs.md : rules for writing documentation
docs/REFACTOR-BACKLOG.md : refactor backlog: open, done, dropped and refused items
docs/architecture/auth.md : auth module design: token model, collections, layers, env
docs/architecture/backend-structure.md : backend file map
docs/infra/ports.md : port ranges and where each request is routed
docs/shared/apis/auth.md : /api/auth/* routes: contract, status and error codes
docs/shared/apis/core.md : /api/health, /api/ai and the /api/* fallback
docs/shared/apis/index.md : API route docs map
```
