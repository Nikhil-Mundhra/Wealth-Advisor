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

export function wealthRoutes(api: WealthApi): readonly RouteDefinition[] {
  return [
    RouteBuilder.get('/products')
      .responds(AssetProductListResponse)
      .handle(async () => api.getProducts()),

    RouteBuilder.get('/portfolio')
      .responds(PortfolioResponse)
      .handle(async () => api.getPortfolio('default', 'default')),

    RouteBuilder.post('/optimize')
      .responds(RebalanceProposalResponse)
      .handle(async () => api.optimizePortfolio('default', 'default')),

    RouteBuilder.post('/execute')
      .body(ExecuteTradeRequest)
      .responds(ExecuteTradeResponse)
      .handle(async ({ body }) => api.executeTrade('default', 'default', body)),

    RouteBuilder.get('/ledger')
      .responds(SandboxLedgerResponse)
      .handle(async () => api.getLedger('default', 'default')),
  ];
}
