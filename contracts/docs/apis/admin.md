# Admin APIs

Every admin route requires a Bearer access token (`backend/docs/auth-token.md` `requireAuth`) whose roles include `ADMIN`; a token without it → `AD_1004` (403).

## GET /api/admin/tenants
- responsibility: return every tenant
- contract: request none, response `TenantListResponse` 200, errors `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth Bearer

## POST /api/admin/tenants
- responsibility: create an `ACTIVE` tenant; omitted settings default to `EUR` baseline, corridors `EUR_CNY` and `GBP_SGD`, provider `mock`, 50 members, passkey required for rebalance
- contract: request `CreateTenantRequest`, response `TenantDto` 201, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1005`, `AU_1901`, `AD_1003`, `CORE_DB_UNCONFIGURED`; auth Bearer

## GET /api/admin/api-keys
- responsibility: return every API key of every tenant, without secrets
- contract: request none, response `ApiKeyListResponse` 200, errors `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth Bearer

## POST /api/admin/api-keys
- responsibility: create an `ACTIVE` API key for a tenant; stores only the SHA-256 hash of the secret; returns the secret `dewa_live_<random>_<random>` once
- contract: request `CreateApiKeyRequest`, response `ApiKeyCreatedResponse` 201, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1005`, `AU_1901`, `AD_1001`, `CORE_DB_UNCONFIGURED`; auth Bearer

## POST /api/admin/api-keys/:id/revoke
- responsibility: set the API key's status to `REVOKED`
- contract: request none, response none 204, errors `AU_1005`, `AU_1901`, `AD_1002`, `CORE_DB_UNCONFIGURED`; auth Bearer
- nested route / query: `:id` the API key id; unknown or malformed → `AD_1002`; already revoked → `AD_1002` in the `mongo` store, 204 in the `memory` store

## GET /api/admin/models
- responsibility: return the active LLM provider (default `mock`), every provider in `LLM_PROVIDERS`, and process uptime; `systemHealth.status` is always `ok` and `systemHealth.database` always `connected`
- contract: request none, response `AdminSettingsResponse` 200, errors `AU_1005`, `AU_1901`, `CORE_DB_UNCONFIGURED`; auth Bearer

## POST /api/admin/models
- responsibility: set the platform-wide active LLM provider used by `POST /api/advisory/chat`
- contract: request `UpdateAdminModelRequest`, response `AdminModelSettingDto` 200, errors `CORE_INVALID_JSON`, `CORE_VALIDATION_FAILED`, `AU_1005`, `AU_1901`, `AD_1005`, `CORE_DB_UNCONFIGURED`; auth Bearer
