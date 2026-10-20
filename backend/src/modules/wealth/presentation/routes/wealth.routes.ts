import type { Context, MiddlewareHandler } from 'hono';
import { ADVISOR_ROLE, ADMIN_ROLE, WEALTH_ERROR_CODES } from '@wealth-advisor/rules';
import { DomainError } from '#core/domain/domain-error.ts';
import {
  AssetProductListResponse,
  ConstructPortfolioRequest,
  ConstructPortfolioResponse,
  ExecuteTradeRequest,
  ExecuteTradeResponse,
  OptimizePortfolioRequest,
  PortfolioResponse,
  RebalanceProposalResponse,
  RiskProfileResponse,
  SandboxLedgerResponse,
  SaveRiskProfileRequest,
} from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { WealthApi } from '../../wealth.api.ts';

export function wealthRoutes(api: WealthApi, auth: MiddlewareHandler, writeAuth: MiddlewareHandler): readonly RouteDefinition[] {
  const guard = [auth];
  const scope = (c: Context) => {
    const principal = c.get('principal') as { tenantId: string; userId: string; roles: readonly string[] };
    const { tenantId, userId, roles } = principal;
    return { tenantId, userId, roles };
  };

  // A caller reads another user's portfolio only with an advisor or admin role; everyone else
  // gets 404, so user IDs are not enumerable through this query param.
  const targetOrOwn = (userId: string, roles: readonly string[], clientId: string | undefined): string => {
    const targetUserId = clientId || userId;
    if (targetUserId !== userId && !roles.includes(ADVISOR_ROLE) && !roles.includes(ADMIN_ROLE)) {
      throw new DomainError(WEALTH_ERROR_CODES.portfolioNotFound, 'portfolio not found');
    }
    return targetUserId;
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
        const { tenantId, userId, roles } = scope(c);
        const targetUserId = targetOrOwn(userId, roles, c.req.query('clientId'));
        return api.getPortfolio(tenantId, targetUserId);
      }),

    RouteBuilder.post('/optimize')
      .use(...guard)
      .body(OptimizePortfolioRequest)
      .responds(RebalanceProposalResponse)
      .handle(async ({ c, body }) => {
        const { tenantId, userId, roles } = scope(c);
        const targetUserId = targetOrOwn(userId, roles, c.req.query('clientId'));
        return api.optimizePortfolio(tenantId, targetUserId, body);
      }),

    RouteBuilder.post('/construct')
      .use(...guard)
      .body(ConstructPortfolioRequest)
      .responds(ConstructPortfolioResponse)
      .handle(async ({ c, body }) => {
        const { tenantId, userId } = scope(c);
        return api.constructPortfolio(tenantId, userId, body);
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

    RouteBuilder.get('/profile')
      .use(...guard)
      .responds(RiskProfileResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId } = scope(c);
        return api.getProfile(tenantId, userId);
      }),

    RouteBuilder.put('/profile')
      .use(writeAuth)
      .body(SaveRiskProfileRequest)
      .responds(RiskProfileResponse)
      .handle(async ({ c, body }) => {
        const { tenantId, userId } = scope(c);
        return api.saveProfile(tenantId, userId, body);
      }),
  ];
}
