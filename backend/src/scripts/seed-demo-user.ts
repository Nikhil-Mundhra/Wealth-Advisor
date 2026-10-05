import { env } from '#core/config/env.ts';
import { closeMongoClient, getDb } from '#core/db/connection/mongo-client.ts';
import { objectIdGenerator } from '#core/db/ids/object-id-generator.ts';
import { systemClock } from '#core/time/clock.ts';
import { ScryptPasswordHasher } from '#modules/auth/infrastructure/crypto/scrypt-password-hasher.ts';
import { type UserDocument, USERS_COLLECTION } from '#modules/auth/infrastructure/db/documents/user.document.ts';
import { MongoUserRepository } from '#modules/auth/infrastructure/db/repositories/mongo-user.repository.ts';
import { DEMO_EMAIL, seedDemoUser } from '#modules/auth/infrastructure/db/seed/demo-user.seed.ts';

// Seeds the demo account into MongoDB. The in-memory store seeds itself at startup.
if (env().NODE_ENV === 'production') {
  console.error('refusing to seed the demo account with NODE_ENV=production');
  process.exit(1);
}

const users = new MongoUserRepository(async () => (await getDb()).collection<UserDocument>(USERS_COLLECTION), systemClock);
const outcome = await seedDemoUser(users, new ScryptPasswordHasher(), objectIdGenerator, systemClock);
console.log(`demo account ${outcome === 'created' ? 'created' : 'already exists'}: ${DEMO_EMAIL}`);
await closeMongoClient();
