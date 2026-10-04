import type { UseCase } from '#core/application/use-case.ts';
import type { IdGenerator } from '#core/domain/id-generator.ts';
import type { EventBus } from '#core/events/event-bus.ts';
import type { Clock } from '#core/time/clock.ts';
import { User } from '../../domain/entities/user.entity.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import { userSignedUp } from '../../domain/events/user-signed-up.event.ts';
import { assertPasswordAllowed } from '../../domain/policies/password.policy.ts';
import { Email } from '../../domain/value-objects/email.vo.ts';
import type { SignupCommand } from '../dto/signup.command.ts';
import type { SignupResult } from '../dto/signup.result.ts';
import type { PasswordHasherPort } from '../ports/password-hasher.port.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';

interface SignupDeps {
  readonly users: UserRepositoryPort;
  readonly hasher: PasswordHasherPort;
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly events: EventBus;
}

// Creates an email+password account. The pre-check gives a fast 409; the unique index is the real guard
// when two signups for the same email race.
export class SignupUseCase implements UseCase<SignupCommand, SignupResult> {
  private readonly deps: SignupDeps;

  constructor(deps: SignupDeps) {
    this.deps = deps;
  }

  async execute(command: SignupCommand): Promise<SignupResult> {
    const { users, hasher, ids, clock, events } = this.deps;
    const email = Email.of(command.email);
    assertPasswordAllowed(command.password);
    if (await users.findActiveByProvider('EMAIL', email.value)) throw AuthErrors.emailTaken();

    const now = clock.now();
    const user = User.registerWithEmail({
      id: ids.next(),
      email,
      passwordHash: await hasher.hash(command.password),
      displayName: command.displayName,
      now,
    });
    if ((await users.insert(user)) === 'DUPLICATE_PROVIDER') throw AuthErrors.emailTaken();

    await events.publish(userSignedUp(user.id, now));
    return { userId: user.id };
  }
}
