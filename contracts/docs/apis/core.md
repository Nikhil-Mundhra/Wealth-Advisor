# Core APIs

Any route can also return `CORE_INTERNAL` (unhandled error or response-contract violation). Error statuses: `rules/docs/errors.md`.

## GET /api/health
- responsibility: liveness and database status; pings MongoDB only when the store is `mongo`
- contract: request none, response none (`{ status: 'ok', database: 'up' | 'down' | 'unconfigured' | 'memory' }`) 200, errors none; auth none

## ALL /api/ai
- nested route / query: none (any method; sub-paths fall to the 404 fallback)
- responsibility: placeholder until an AI feature exists
- contract: request none, response none (`{ message }`, not `ErrorResponse`) 501, errors none; auth none

## ALL /api/*
- nested route / query: any unmatched path, including a known path with an unsupported method
- responsibility: return the error contract instead of falling through to the SPA
- contract: request none, response `ErrorResponse`, errors `CORE_NOT_FOUND`; auth none
