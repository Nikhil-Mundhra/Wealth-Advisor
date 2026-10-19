import type { UseCase } from '#core/application/use-case.ts';
import type { AdvisorClientListResponse, AdvisorClientSummaryDto } from '@wealth-advisor/contracts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';

export interface ListAdvisorClientsQuery {
  readonly advisorId: string;
}

interface ListAdvisorClientsDeps {
  readonly users: UserRepositoryPort;
}

export class ListAdvisorClientsUseCase implements UseCase<ListAdvisorClientsQuery, AdvisorClientListResponse> {
  private readonly deps: ListAdvisorClientsDeps;

  constructor(deps: ListAdvisorClientsDeps) {
    this.deps = deps;
  }

  async execute(query: ListAdvisorClientsQuery): Promise<AdvisorClientListResponse> {
    const { users } = this.deps;
    const advisor = await users.findActiveById(query.advisorId);
    if (!advisor || (!advisor.roles.includes('ADVISOR') && !advisor.roles.includes('ADMIN'))) {
      throw AuthErrors.unauthenticated();
    }

    const clientUsers = await users.findClientsByAdvisorId(query.advisorId);

    const clients: AdvisorClientSummaryDto[] = clientUsers.map((c) => ({
      id: c.id,
      email: c.email.value,
      displayName: c.displayName,
      totalValuationBase: 38200000,
      currency: 'EUR',
      runwayMonths: 18.4,
      riskBand: 'BALANCED',
      connectedAt: c.updatedAt.toISOString(),
    }));

    return { clients };
  }
}
