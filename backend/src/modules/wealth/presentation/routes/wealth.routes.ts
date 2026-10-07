import type { MiddlewareHandler } from 'hono';
import {
  AssetProductListResponse,
  ExecuteTradeRequest,
  ExecuteTradeResponse,
  PortfolioResponse,
  RebalanceProposalResponse,
  SandboxLedgerResponse,
} from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { WealthApi } from '../../wealth.api.ts';

export function wealthRoutes(api: WealthApi, auth?: MiddlewareHandler): readonly RouteDefinition[] {
  const guard = auth ? [auth] : [];
  const getContext = (c: any) => {
    const principal = c.get('principal');
    const userId = principal?.userId ?? 'default';
    const tenantId = c.req.header('x-tenant-id') || 'default';
    return { tenantId, userId };
  };

  return [
    RouteBuilder.get('/products')
      .use(...guard)
      .responds(AssetProductListResponse)
      .handle(async () => api.getProducts()),

    RouteBuilder.get('/portfolio')
      .use(...guard)
      .responds(PortfolioResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId } = getContext(c);
        return api.getPortfolio(tenantId, userId);
      }),

    RouteBuilder.post('/optimize')
      .use(...guard)
      .responds(RebalanceProposalResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId } = getContext(c);
        return api.optimizePortfolio(tenantId, userId);
      }),

    RouteBuilder.post('/execute')
      .use(...guard)
      .body(ExecuteTradeRequest)
      .responds(ExecuteTradeResponse)
      .handle(async ({ c, body }) => {
        const { tenantId, userId } = getContext(c);
        return api.executeTrade(tenantId, userId, body);
      }),

    RouteBuilder.get('/ledger')
      .use(...guard)
      .responds(SandboxLedgerResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId } = getContext(c);
        return api.getLedger(tenantId, userId);
      }),
  ];
}
