# Advisory APIs

## POST /api/advisory/chat
- responsibility: answer an advisory question from the caller's cashflow summary and portfolio through the active LLM provider (`GET /api/admin/models`, default `mock`); `gemini` and `openai` replace only `reply` and `threePillarRationale` of the deterministic mock answer, and fall back to the mock answer on a missing API key, a provider error or an unparsable reply; `claude` and `mock` answer with the mock adapter
- contract: request `AdvisoryChatRequest`, response `AdvisoryChatResponse` 200, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1005`, `AU_1901`, `WL_1001`, `CORE_DB_UNCONFIGURED`; auth optional Bearer (`backend/docs/auth-token.md` `optionalAuth`): no token → demo account; a present but invalid token → `AU_1005`
