import type { MiddlewareHandler } from 'hono';
import {
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  SharedPlanResponse,
} from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { SharingApi } from '../../sharing.api.ts';

export function sharingRoutes(api: SharingApi, auth: MiddlewareHandler): readonly RouteDefinition[] {
  return [
    RouteBuilder.post('/create')
      .use(auth)
      .body(CreateShareLinkRequest)
      .responds(CreateShareLinkResponse, 201)
      .handle(async ({ c, body }) => {
        const { tenantId, userId } = c.get('principal');
        return api.createShareLink(tenantId, userId, body);
      }),

    RouteBuilder.get('/:token')
      .responds(SharedPlanResponse)
      .handle(async ({ c }) => api.getSharedPlan(c.req.param('token') ?? '')),
  ];
}
