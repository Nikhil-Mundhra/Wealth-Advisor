import type { Context, MiddlewareHandler } from 'hono';
import {
  AccountDto,
  AccountListResponse,
  CashflowSummaryResponse,
  CreateAccountRequest,
  TransactionListResponse,
} from '@wealth-advisor/contracts';
import type { HouseholdMode } from '@wealth-advisor/rules';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { FinanceApi } from '../../finance.api.ts';

export function financeRoutes(api: FinanceApi, auth: MiddlewareHandler): readonly RouteDefinition[] {
  const guard = [auth];
  const scope = (c: Context) => {
    const { tenantId, userId } = c.get('principal');
    return { tenantId, userId };
  };

  return [
    RouteBuilder.get('/accounts')
      .use(...guard)
      .responds(AccountListResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId } = scope(c);
        return api.getAccounts(tenantId, userId);
      }),

    RouteBuilder.post('/accounts')
      .use(...guard)
      .body(CreateAccountRequest)
      .responds(AccountDto, 201)
      .handle(async ({ c, body }) => {
        const { tenantId, userId } = scope(c);
        return api.createAccount(tenantId, userId, body);
      }),

    RouteBuilder.get('/transactions')
      .use(...guard)
      .responds(TransactionListResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId } = scope(c);
        return api.getTransactions(tenantId, userId);
      }),

    RouteBuilder.get('/cashflow')
      .use(...guard)
      .responds(CashflowSummaryResponse)
      .handle(async ({ c }) => {
        const { tenantId, userId } = scope(c);
        const mode = (c.req.query('householdMode') as HouseholdMode) ?? 'FAMILY_HOUSEHOLD';
        return api.getCashflowSummary(tenantId, userId, mode);
      }),
  ];
}
