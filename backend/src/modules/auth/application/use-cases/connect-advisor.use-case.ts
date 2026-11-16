import { hasAdvisorRole } from '@wealth-advisor/rules';
import type { UseCase } from '#core/application/use-case.ts';
import type { Clock } from '#core/time/clock.ts';
import type { User } from '../../domain/entities/user.entity.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';
import type { UserProfileResult } from '../dto/user-profile.result.ts';

export async function resolveAdvisorByCode(users: UserRepositoryPort, rawCode: string): Promise<User | null> {
  const trimmed = rawCode.trim();
  if (!trimmed) return null;
  const withoutPrefix = trimmed.startsWith('ADV-') ? trimmed.slice(4) : trimmed;
  // Support both legacy ADV-<advisorId> and unique per-invite ADV-<advisorId>:<token> codes.
  const candidate = withoutPrefix.split(':', 1)[0] ?? '';
  if (!candidate) return null;
  const advisor = candidate.includes('@')
    ? await users.findActiveByProvider('EMAIL', candidate)
    : await users.findActiveById(candidate);
  return advisor && hasAdvisorRole(advisor.roles) ? advisor : null;
}

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

    const advisor = await resolveAdvisorByCode(users, command.inviteCode);
    if (!advisor || advisor.id === client.id) {
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
