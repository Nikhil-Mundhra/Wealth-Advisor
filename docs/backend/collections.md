# Collections

Declared in each module's `*.indexes.ts`; listed in its manifest's `collections`.

| Collection | Owner | Holds | Non-obvious |
|---|---|---|---|
| `users` | auth | account root; embeds providers, roles, consents, withdrawal | provider uniqueness holds only among `status: 'ACTIVE'` users (partial unique index) |
| `sessions` | auth | one document per refresh token | TTL purges at `purgeAt` = `expiresAt` + 7 d; the TTL monitor runs about once a minute, so expiry is checked in code |

Source: `backend/src/modules/auth/infrastructure/persistence/auth.indexes.ts`.
