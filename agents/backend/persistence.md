# Backend: persistence

## Calls
- `docs/backend/collections.md` : collections, indexes, TTL

## Rules
- Writes that must not race use conditional filters (compare-and-set), never read-then-write.
- Indexes and validators are applied by `make db-indexes`, never per request.

## Workflow
- collection or index change: `<module>.indexes.ts` → manifest `collections` → `make db-indexes` → `docs/backend/collections.md`

## File structure

```
backend/src/modules/auth/application/ports/session-repository.port.ts : session persistence contract (compare-and-set)
backend/src/modules/auth/application/ports/user-repository.port.ts : user persistence contract
backend/src/modules/auth/infrastructure/persistence/auth.indexes.ts : indexes and $jsonSchema for users and sessions
backend/src/modules/auth/infrastructure/persistence/documents/session.document.ts : stored shape of sessions (incl. purgeAt)
backend/src/modules/auth/infrastructure/persistence/documents/user.document.ts : stored shape of users
backend/src/modules/auth/infrastructure/persistence/mappers/session.mapper.ts : SessionDocument ↔ Session
backend/src/modules/auth/infrastructure/persistence/mappers/user.mapper.ts : UserDocument ↔ User
backend/src/modules/auth/infrastructure/persistence/mongo-session.repository.ts : session repository; conditional updates replace FOR UPDATE
backend/src/modules/auth/infrastructure/persistence/mongo-user.repository.ts : user repository on Mongo
backend/src/scripts/ensure-indexes.ts : applies every module's collection definitions (deploy step)
backend/src/scripts/seed-demo-user.ts : creates the local demo account (refuses NODE_ENV=production)
```
