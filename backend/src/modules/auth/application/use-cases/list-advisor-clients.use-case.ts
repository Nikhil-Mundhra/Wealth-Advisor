import { hasAdvisorRole } from '@wealth-advisor/rules';
import type { UseCase } from '#core/application/use-case.ts';
import { telemetryLogger } from '#core/telemetry/logger.ts';
import type { AdvisorClientListResponse, AdvisorClientSummaryDto } from '@wealth-advisor/contracts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';

export interface ListAdvisorClientsQuery {
  readonly advisorId: string;
}

export type ClientMetricsResolver = (
  tenantId: string,
  clientUserIds: string[],
) => Promise<Map<string, { totalValuationBase: number; currency: string; runwayMonths: number; riskBand: string }>>;

export interface ListAdvisorClientsDeps {
  readonly users: UserRepositoryPort;
  readonly getClientMetrics?: ClientMetricsResolver;
}

export class ListAdvisorClientsUseCase implements UseCase<ListAdvisorClientsQuery, AdvisorClientListResponse> {
  private readonly deps: ListAdvisorClientsDeps;

  constructor(deps: ListAdvisorClientsDeps) {
    this.deps = deps;
  }

  async execute(query: ListAdvisorClientsQuery): Promise<AdvisorClientListResponse> {
    const { users, getClientMetrics } = this.deps;
    const advisor = await users.findActiveById(query.advisorId);
    if (!advisor || !hasAdvisorRole(advisor.roles)) {
      throw AuthErrors.unauthenticated();
    }

    const clientUsers = await users.findClientsByAdvisorId(query.advisorId);
    const tenantId = advisor.tenantId ?? 'default';

    const metricsMap = getClientMetrics
      ? await getClientMetrics(tenantId, clientUsers.map((c) => c.id)).catch((error) => {
          telemetryLogger.warn('advisor.list_clients_metrics_failed', { advisorId: query.advisorId, error });
          return new Map();
        })
      : new Map();

    const clients: AdvisorClientSummaryDto[] = clientUsers.map((c) => {
      const metric = metricsMap.get(c.id);
      return {
        id: c.id,
        email: c.email.value,
        displayName: c.displayName,
        totalValuationBase: metric?.totalValuationBase ?? 0,
        currency: metric?.currency ?? 'EUR',
        runwayMonths: metric?.runwayMonths ?? 0,
        riskBand: metric?.riskBand ?? 'UNASSESSED',
        connectedAt: c.updatedAt.toISOString(),
      };
    });

    return { clients };
  }
}
