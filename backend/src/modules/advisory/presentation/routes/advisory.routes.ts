import type { MiddlewareHandler } from 'hono';
import { AdvisoryChatRequest, AdvisoryChatResponse } from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { AdvisoryApi } from '../../advisory.api.ts';

export function advisoryRoutes(api: AdvisoryApi, auth?: MiddlewareHandler): readonly RouteDefinition[] {
  const guard = auth ? [auth] : [];
  return [
    RouteBuilder.post('/chat')
      .use(...guard)
      .body(AdvisoryChatRequest)
      .responds(AdvisoryChatResponse)
      .handle(async ({ c, body }) => {
        const principal = (c as any).get('principal');
        const userId = principal?.userId ?? 'default';
        const tenantId = (c as any).req.header('x-tenant-id') || 'default';
        return api.chat(tenantId, userId, body);
      }),
  ];
}
