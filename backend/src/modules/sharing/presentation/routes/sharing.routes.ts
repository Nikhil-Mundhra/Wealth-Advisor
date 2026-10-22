import type { MiddlewareHandler } from 'hono';
import { hasAdvisorRole, SHARING_ERROR_CODES } from '@wealth-advisor/rules';
import {
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  SharedPlanResponse,
} from '@wealth-advisor/contracts';
import { toDocumentId } from '#core/db/document-id.ts';
import { DomainError } from '#core/domain/domain-error.ts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { SharingApi } from '../../sharing.api.ts';

type Principal = { tenantId: string; userId: string; roles: readonly string[] };

export function sharingRoutes(api: SharingApi, writeAuth: MiddlewareHandler): readonly RouteDefinition[] {
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

    RouteBuilder.get('/:token')
      .responds(SharedPlanResponse)
      .handle(async ({ c }) => api.getSharedPlan(c.req.param('token') ?? '')),
  ];
}
