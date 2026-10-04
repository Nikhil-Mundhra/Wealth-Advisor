# Backend: persistence

## Calls
- `docs/backend/collections.md` : current collections, indexes, validators, TTL
- `docs/infra/env.md` : `MONGODB_URI` and database name

## Rules
- Writes that must not race use conditional filters (compare-and-set), never read-then-write.
- Indexes and validators live in `<module>/infrastructure/persistence/*.indexes.ts`, applied by `make db-indexes`, never per request.
- Repositories extend `BaseRepository` and implement an application port; documents and entities convert only through a mapper.

## Workflow
- add a collection or index: document + mapper + repository → entry in `<module>.indexes.ts` → listed in the manifest's `collections` → `make db-indexes` → `docs/backend/collections.md`

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
