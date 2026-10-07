import type { Context, MiddlewareHandler } from 'hono';
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

export function wealthRoutes(api: WealthApi, auth: MiddlewareHandler, writeAuth: MiddlewareHandler): readonly RouteDefinition[] {
  const guard = [auth];
  const scope = (c: Context) => {
    const { tenantId, userId } = c.get('principal');
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
        const { tenantId, userId } = scope(c);
        return api.getPortfolio(tenantId, userId);
      }),

    RouteBuilder.post('/optimize')
      .use(...guard)
      .responds(RebalanceProposalResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId } = scope(c);
        return api.optimizePortfolio(tenantId, userId);
      }),

    RouteBuilder.post('/execute')
      .use(writeAuth)
      .body(ExecuteTradeRequest)
      .responds(ExecuteTradeResponse)
      .handle(async ({ c, body }) => {
        const { tenantId, userId } = scope(c);
        return api.executeTrade(tenantId, userId, body);
      }),

    RouteBuilder.get('/ledger')
      .use(...guard)
      .responds(SandboxLedgerResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId } = scope(c);
        return api.getLedger(tenantId, userId);
      }),
  ];
}
