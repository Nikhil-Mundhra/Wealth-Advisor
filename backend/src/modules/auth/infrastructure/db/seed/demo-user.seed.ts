import type { IdGenerator } from '#core/domain/id-generator.ts';
import type { Clock } from '#core/time/clock.ts';
import type { PasswordHasherPort } from '../../../application/ports/password-hasher.port.ts';
import type { UserRepositoryPort } from '../../../application/ports/user-repository.port.ts';
import { User } from '../../../domain/entities/user.entity.ts';
import { Email } from '../../../domain/value-objects/email.vo.ts';

// Local-only demo account. Bypasses the signup contract on purpose: its password is shorter than signup allows.
export const DEMO_EMAIL = 'testing@example.com';
export const DEMO_PASSWORD = 'testing';

export async function seedDemoUser(users: UserRepositoryPort, hasher: PasswordHasherPort, ids: IdGenerator, clock: Clock): Promise<'created' | 'exists'> {
  const email = Email.of(DEMO_EMAIL);
  if (await users.findActiveByProvider('EMAIL', email.value)) return 'exists';
  const user = User.registerWithEmail({
    id: ids.next(),
    tenantId: '600000000000000000000001',
    email,
    passwordHash: await hasher.hash(DEMO_PASSWORD),
    displayName: 'Demo',
    now: clock.now(),
    roles: ['USER', 'ADMIN'],
  });
  await users.insert(user);
  return 'created';
}
