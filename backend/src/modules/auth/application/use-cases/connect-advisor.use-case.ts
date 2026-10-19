import type { UseCase } from '#core/application/use-case.ts';
import type { Clock } from '#core/time/clock.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';
import type { UserProfileResult } from '../dto/user-profile.result.ts';

export interface ConnectAdvisorCommand {
  readonly userId: string;
  readonly inviteCode: string;
}

interface ConnectAdvisorDeps {
  readonly users: UserRepositoryPort;
  readonly clock: Clock;
}

export class ConnectAdvisorUseCase implements UseCase<ConnectAdvisorCommand, UserProfileResult> {
  private readonly deps: ConnectAdvisorDeps;

  constructor(deps: ConnectAdvisorDeps) {
    this.deps = deps;
  }

  async execute(command: ConnectAdvisorCommand): Promise<UserProfileResult> {
    const { users, clock } = this.deps;
    const client = await users.findActiveById(command.userId);
    if (!client) throw AuthErrors.unauthenticated();

    const rawCode = command.inviteCode.trim();
    if (!rawCode) throw AuthErrors.invalidAdvisorCode();

    const candidate = rawCode.startsWith('ADV-') ? rawCode.slice(4) : rawCode;
    const advisor = candidate.includes('@')
      ? await users.findActiveByProvider('EMAIL', candidate)
      : await users.findActiveById(candidate);

    if (!advisor || (!advisor.roles.includes('ADVISOR') && !advisor.roles.includes('ADMIN'))) {
      throw AuthErrors.invalidAdvisorCode();
    }

    client.assignAdvisor(advisor.id, clock.now());
    await users.save(client);

    return {
      id: client.id,
      email: client.email.value,
      displayName: client.displayName,
      roles: [...client.roles],
      emailVerified: client.isEmailVerified,
      advisorId: client.advisorId,
      createdAt: client.createdAt,
    };
  }
}
