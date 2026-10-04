# Collections

Declared in each module's `*.indexes.ts` and listed in its manifest's `collections`.

## users
Owner: auth (`backend/src/modules/auth/infrastructure/persistence/auth.indexes.ts`). Account root; embeds `providers[]` (max 5), `roles[]` (min 1), `consents[]`, `withdrawal`.

| Index | Keys | Options |
|---|---|---|
| `uk_users_active_provider` | `providers.type`, `providers.subject` | unique; partial `status: 'ACTIVE'` |

Validator (`$jsonSchema`): required `email status roles providers consents createdAt updatedAt`; `status`, `roles`, `providers.type` restricted to their domain enums.

## sessions
Owner: auth (`backend/src/modules/auth/infrastructure/persistence/auth.indexes.ts`). One document per refresh token.

| Index | Keys | Options |
|---|---|---|
| `uk_sessions_token_hash` | `tokenHash` | unique |
| `ix_sessions_family` | `familyId` | |
| `ix_sessions_user_active` | `userId`, `revokedAt` | |
| `ttl_sessions_purge` | `purgeAt` | TTL, `expireAfterSeconds: 0`; `purgeAt` = `expiresAt` + 7 d |

Validator (`$jsonSchema`): required `userId tokenHash familyId clientType rememberMe issuedAt expiresAt purgeAt createdAt`; `tokenHash` is 64 lowercase hex characters; `clientType`, `revokeReason` restricted to their domain enums.

The TTL monitor runs about once a minute; expiry is checked in code, the TTL index only purges.
