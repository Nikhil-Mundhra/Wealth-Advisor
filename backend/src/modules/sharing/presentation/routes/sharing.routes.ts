import {
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  SharedPlanResponse,
} from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { SharingApi } from '../../sharing.api.ts';

export function sharingRoutes(api: SharingApi): readonly RouteDefinition[] {
  return [
    RouteBuilder.post('/create')
      .body(CreateShareLinkRequest)
      .responds(CreateShareLinkResponse, 201)
      .handle(async ({ body }) => api.createShareLink('default', 'default', body)),

    RouteBuilder.get('/:token')
      .responds(SharedPlanResponse)
      .handle(async ({ c }) => api.getSharedPlan(c.req.param('token') ?? '')),
  ];
}
