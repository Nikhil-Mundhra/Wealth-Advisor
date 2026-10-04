import type { UseCase } from '#core/application/use-case.ts';
import type { IdGenerator } from '#core/domain/id-generator.ts';
import type { Clock } from '#core/time/clock.ts';
import { Session } from '../../domain/entities/session.entity.ts';
import type { User } from '../../domain/entities/user.entity.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import { Email } from '../../domain/value-objects/email.vo.ts';
import type { TokenConfig } from '../config/token-config.ts';
import type { LoginCommand } from '../dto/login.command.ts';
import type { TokenPairResult } from '../dto/token-pair.result.ts';
import type { PasswordHasherPort } from '../ports/password-hasher.port.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';
import { TokenPairIssuer } from './issue-token-pair.ts';

interface LoginDeps {
  readonly users: UserRepositoryPort;
  readonly hasher: PasswordHasherPort;
  readonly issuer: TokenPairIssuer;
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly config: TokenConfig;
}

// Email+password login. Unknown email and wrong password are indistinguishable: same error, and a password
// hash is verified either way so response time does not reveal which emails exist.
export class LoginUseCase implements UseCase<LoginCommand, TokenPairResult> {
  private readonly deps: LoginDeps;
  private dummyHash: Promise<string> | undefined;

  constructor(deps: LoginDeps) {
    this.deps = deps;
  }

  async execute(command: LoginCommand): Promise<TokenPairResult> {
    const { users, hasher, issuer, ids, clock, config } = this.deps;
    const user = await this.findUser(command.email);
    const passwordMatches = await hasher.verify(user?.passwordHash ?? (await this.getDummyHash()), command.password);
    if (!user || !user.passwordHash || !passwordMatches) throw AuthErrors.invalidCredentials();

    const now = clock.now();
    user.recordLogin('EMAIL', now);
    await users.save(user);

    const refreshToken = TokenPairIssuer.newRefreshToken();
    const session = Session.startFamily({
      id: ids.next(),
      familyId: ids.next(),
      userId: user.id,
      tokenHash: refreshToken.hash,
      clientType: command.clientType,
      rememberMe: command.rememberMe,
      now,
      ttlSeconds: config.refreshTokenTtlSeconds,
    });
    return issuer.issue(user, session, refreshToken.raw);
  }

  private async findUser(rawEmail: string): Promise<User | null> {
    let email: Email;
    try {
      email = Email.of(rawEmail);
    } catch {
      return null; // a malformed email is just another failed login
    }
    return this.deps.users.findActiveByProvider('EMAIL', email.value);
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.deps.hasher.hash('dummy-password-for-timing-equalization');
    return this.dummyHash;
  }
}
