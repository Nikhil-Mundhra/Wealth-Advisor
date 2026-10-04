# Core APIs

## GET /api/health
- nested route / query: none
- responsibility: liveness check; touches no database
- contract: request none, response none (`{ status: 'ok' }`) 200, errors none; auth none

## ALL /api/ai
- nested route / query: none (any method; sub-paths fall to the 404 fallback)
- responsibility: placeholder until an AI feature exists
- contract: request none, response none (`{ message }`, not `ErrorResponse`) 501, errors none; auth none

## ALL /api/*
- nested route / query: any unmatched path, including a known path with an unsupported method
- responsibility: return the error contract instead of falling through to the SPA
- contract: request none, response `ErrorResponse` 404 with `CORE_NOT_FOUND`, errors `CORE_NOT_FOUND 404`; auth none
