import { AdvisoryChatRequest, AdvisoryChatResponse } from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { AdvisoryApi } from '../../advisory.api.ts';

export function advisoryRoutes(api: AdvisoryApi): readonly RouteDefinition[] {
  return [
    RouteBuilder.post('/chat')
      .body(AdvisoryChatRequest)
      .responds(AdvisoryChatResponse)
      .handle(async ({ body }) => api.chat('default', 'default', body)),
  ];
}
