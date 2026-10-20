import {
  AssetProductListResponse,
  ConstructPortfolioRequest,
  ConstructPortfolioResponse,
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  ExecuteTradeRequest,
  ExecuteTradeResponse,
  PortfolioResponse,
  RebalanceProposalResponse,
  SandboxLedgerResponse,
  SharedPlanResponse,
} from '@wealth-advisor/contracts';
import { apiRequest } from '../../../lib/api-client.ts';

// Fiduciary and portfolio execution endpoints, typed by contracts.
export const wealthApi = {
  getPortfolio: (clientId?: string) =>
    apiRequest(clientId ? `/wealth/portfolio?clientId=${encodeURIComponent(clientId)}` : '/wealth/portfolio', {
      response: PortfolioResponse,
      authenticated: true,
    }),

  getProducts: () =>
    apiRequest('/wealth/products', {
      response: AssetProductListResponse,
      authenticated: true,
    }),

  getLedger: () =>
    apiRequest('/wealth/ledger', {
      response: SandboxLedgerResponse,
      authenticated: true,
    }),

  optimize: () =>
    apiRequest('/wealth/optimize', {
      method: 'POST',
      response: RebalanceProposalResponse,
      authenticated: true,
    }),

  constructPortfolio: (body?: ConstructPortfolioRequest) =>
    apiRequest('/wealth/construct', {
      method: 'POST',
      body,
      response: ConstructPortfolioResponse,
      authenticated: true,
    }),

  executeTrade: (body: ExecuteTradeRequest) =>
    apiRequest('/wealth/execute', {
      method: 'POST',
      body,
      response: ExecuteTradeResponse,
      authenticated: true,
    }),

  createShareLink: (body: CreateShareLinkRequest) =>
    apiRequest('/sharing/create', {
      method: 'POST',
      body,
      response: CreateShareLinkResponse,
      authenticated: true,
    }),

  getSharedPlan: (token: string) =>
    apiRequest(`/sharing/${encodeURIComponent(token)}`, {
      response: SharedPlanResponse,
    }),
};
