import {
  AccountDto,
  AccountListResponse,
  CashflowSummaryResponse,
  CreateAccountRequest,
  TransactionListResponse,
} from '@wealth-advisor/contracts';
import { type RouteDefinition, RouteBuilder } from '#core/http/route-builder.ts';
import type { FinanceApi } from '../../finance.api.ts';

export function financeRoutes(api: FinanceApi): readonly RouteDefinition[] {
  return [
    RouteBuilder.get('/accounts')
      .responds(AccountListResponse)
      .handle(async () => api.getAccounts('default', 'default')),

    RouteBuilder.post('/accounts')
      .body(CreateAccountRequest)
      .responds(AccountDto, 201)
      .handle(async ({ body }) => api.createAccount('default', 'default', body)),

    RouteBuilder.get('/transactions')
      .responds(TransactionListResponse)
      .handle(async () => api.getTransactions('default', 'default')),

    RouteBuilder.get('/cashflow')
      .responds(CashflowSummaryResponse)
      .handle(async ({ c }) => {
        const mode = (c.req.query('householdMode') as any) ?? 'FAMILY_HOUSEHOLD';
        return api.getCashflowSummary('default', 'default', mode);
      }),
  ];
}
