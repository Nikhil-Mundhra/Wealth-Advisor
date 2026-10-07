import type { Context, MiddlewareHandler } from 'hono';
import { AdvisoryChatRequest, AdvisoryChatResponse } from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { AdvisoryApi } from '../../advisory.api.ts';

export function advisoryRoutes(api: AdvisoryApi, auth: MiddlewareHandler): readonly RouteDefinition[] {
  const scope = (c: Context) => {
    const { tenantId, userId } = c.get('principal');
    return { tenantId, userId };
  };

  return [
    RouteBuilder.post('/chat')
      .use(auth)
      .body(AdvisoryChatRequest)
      .responds(AdvisoryChatResponse)
      .handle(async ({ c, body }) => {
        const { tenantId, userId } = scope(c);
        return api.chat(tenantId, userId, body);
      }),
  ];
}
