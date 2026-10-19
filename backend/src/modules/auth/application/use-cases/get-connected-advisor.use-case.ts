import type { UseCase } from '#core/application/use-case.ts';
import type { ClientAdvisorProfileDto } from '@wealth-advisor/contracts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';

export interface GetConnectedAdvisorQuery {
  readonly userId: string;
}

interface GetConnectedAdvisorDeps {
  readonly users: UserRepositoryPort;
}

export class GetConnectedAdvisorUseCase implements UseCase<GetConnectedAdvisorQuery, ClientAdvisorProfileDto | null> {
  private readonly deps: GetConnectedAdvisorDeps;

  constructor(deps: GetConnectedAdvisorDeps) {
    this.deps = deps;
  }

  async execute(query: GetConnectedAdvisorQuery): Promise<ClientAdvisorProfileDto | null> {
    const { users } = this.deps;
    const client = await users.findActiveById(query.userId);
    if (!client) throw AuthErrors.unauthenticated();

    if (!client.advisorId) return null;

    const advisor = await users.findActiveById(client.advisorId);
    if (!advisor) return null;

    return {
      advisorId: advisor.id,
      advisorName: advisor.displayName ?? 'Wealth Analyst',
      advisorEmail: advisor.email.value,
      firmName: 'Global Nomads Wealth Partners',
      connectedAt: client.updatedAt.toISOString(),
    };
  }
}
