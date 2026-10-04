import { env } from '#core/config/env.ts';
import { closeMongoClient, getDb } from '#core/persistence/mongo-client.ts';
import { objectIdGenerator } from '#core/persistence/object-id-generator.ts';
import { systemClock } from '#core/time/clock.ts';
import { User } from '#modules/auth/domain/entities/user.entity.ts';
import { Email } from '#modules/auth/domain/value-objects/email.vo.ts';
import { ScryptPasswordHasher } from '#modules/auth/infrastructure/crypto/scrypt-password-hasher.ts';
import { type UserDocument, USERS_COLLECTION } from '#modules/auth/infrastructure/persistence/documents/user.document.ts';
import { MongoUserRepository } from '#modules/auth/infrastructure/persistence/mongo-user.repository.ts';

// Local-only demo account. Bypasses the signup contract on purpose (its password is shorter than signup allows),
// so it must never run against production.
const DEMO_EMAIL = 'testing@example.com';
const DEMO_PASSWORD = 'testing';

if (env().NODE_ENV === 'production') {
  console.error('refusing to seed the demo account with NODE_ENV=production');
  process.exit(1);
}

const users = new MongoUserRepository(async () => (await getDb()).collection<UserDocument>(USERS_COLLECTION), systemClock);
const email = Email.of(DEMO_EMAIL);
if (await users.findActiveByProvider('EMAIL', email.value)) {
  console.log(`demo account already exists: ${DEMO_EMAIL}`);
} else {
  const user = User.registerWithEmail({
    id: objectIdGenerator.next(),
    email,
    passwordHash: await new ScryptPasswordHasher().hash(DEMO_PASSWORD),
    displayName: 'Demo',
    now: systemClock.now(),
  });
  await users.insert(user);
  console.log(`demo account created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}
await closeMongoClient();
