import type { MiddlewareHandler } from 'hono';
import { hasAdvisorRole, SHARING_ERROR_CODES } from '@wealth-advisor/rules';
import {
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  ListSharedPlansQuery,
  ListSharedPlansResponse,
  RevokeShareLinkResponse,
  SharedPlanResponse,
} from '@wealth-advisor/contracts';
import { toDocumentId } from '#core/db/document-id.ts';
import { DomainError } from '#core/domain/domain-error.ts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { SharingApi } from '../../sharing.api.ts';
import { InMemoryRateLimiter } from '../sharing-rate-limiter.ts';

type Principal = { tenantId: string; userId: string; roles: readonly string[] };

export function sharingRoutes(
  api: SharingApi,
  writeAuth: MiddlewareHandler,
  rateLimiter: InMemoryRateLimiter = new InMemoryRateLimiter(),
): readonly RouteDefinition[] {
  return [
    RouteBuilder.post('/create')
      .use(writeAuth)
      .body(CreateShareLinkRequest)
      .responds(CreateShareLinkResponse, 201)
      .handle(async ({ c, body }) => {
        const { tenantId, userId, roles } = c.get('principal') as Principal;
        const targetUserId = body.clientId ?? userId;
        if (targetUserId !== userId) {
          if (!hasAdvisorRole(roles ?? [])) {
            throw new DomainError(SHARING_ERROR_CODES.scopeForbidden, 'only an advisor may share a client plan');
          }
          if (!toDocumentId(targetUserId)) {
            throw new DomainError(SHARING_ERROR_CODES.scopeForbidden, 'invalid client id');
          }
        }
        return api.createShareLink(tenantId, targetUserId, body);
      }),

    RouteBuilder.get('/links')
      .use(writeAuth)
      .query(ListSharedPlansQuery)
      .responds(ListSharedPlansResponse)
      .handle(async ({ c, query }) => {
        const { tenantId, userId, roles } = c.get('principal') as Principal;
        const isAdvisorOrAdmin = hasAdvisorRole(roles ?? []);
        return api.listSharedPlans(tenantId, userId, {
          clientId: query?.clientId,
          isAdvisorOrAdmin,
        });
      }),

    RouteBuilder.delete('/:token')
      .use(writeAuth)
      .responds(RevokeShareLinkResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId, roles } = c.get('principal') as Principal;
        const isAdvisorOrAdmin = hasAdvisorRole(roles ?? []);
        return api.revokeShareLink(tenantId, userId, c.req.param('token') ?? '', {
          isAdvisorOrAdmin,
        });
      }),

    RouteBuilder.get('/:token')
      .use(rateLimiter.middleware())
      .responds(SharedPlanResponse)
      .handle(async ({ c }) => api.getSharedPlan(c.req.param('token') ?? '')),
  ];
}
