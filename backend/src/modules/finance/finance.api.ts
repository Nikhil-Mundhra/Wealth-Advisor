import { ObjectId } from 'mongodb';
import type {
  AccountDto,
  AccountListResponse,
  CashflowSummaryResponse,
  CreateAccountRequest,
  RemittanceCorridorSummary,
  TransactionDto,
  TransactionListResponse,
} from '@wealth-advisor/contracts';
import type { Currency, HouseholdMode } from '@wealth-advisor/rules';
import type { Clock } from '#core/time/clock.ts';
import { toIsoDate } from '#core/time/calendar-date.ts';
import type { MarketApi } from '../market/public.ts';
import type { AccountRepository, TransactionRepository } from './application/ports.ts';
import { calculateBurnRate } from './domain/burn-rate-calculator.ts';
import type { AccountDocument } from './infrastructure/db/documents/account.document.ts';
import type { TransactionDocument } from './infrastructure/db/documents/transaction.document.ts';

export interface FinanceApiDeps {
  accounts: AccountRepository;
  transactions: TransactionRepository;
  clock: Clock;
  market?: MarketApi;
}

function toAccountDto(doc: AccountDocument): AccountDto {
  return {
    id: doc._id.toHexString(),
    tenantId: doc.tenantId.toHexString(),
    userId: doc.userId.toHexString(),
    householdMode: doc.householdMode,
    institutionName: doc.institutionName,
    accountType: doc.accountType,
    currency: doc.currency,
    balance: doc.balance,
    lastSyncedAt: doc.lastSyncedAt.toISOString(),
    isPrimaryLiquidity: doc.isPrimaryLiquidity,
    createdAt: doc.createdAt.toISOString(),
  };
}

function toTransactionDto(doc: TransactionDocument): TransactionDto {
  return {
    id: doc._id.toHexString(),
    tenantId: doc.tenantId.toHexString(),
    userId: doc.userId.toHexString(),
    accountId: doc.accountId.toHexString(),
    category: doc.category,
    amount: doc.amount,
    currency: doc.currency,
    convertedBaseAmount: doc.convertedBaseAmount,
    baseCurrency: doc.baseCurrency,
    remittanceMetadata: doc.remittanceMetadata,
    tuitionMetadata: doc.tuitionMetadata,
    timestamp: doc.timestamp.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}

const DEMO_TENANT_ID = '600000000000000000000001';
const DEMO_USER_ID = '500000000000000000000001';

function resolveTenantId(id: string): ObjectId {
  if (id === 'default') return new ObjectId(DEMO_TENANT_ID);
  return ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : new ObjectId(DEMO_TENANT_ID);
}

function resolveUserId(id: string): ObjectId {
  if (id === 'default') return new ObjectId(DEMO_USER_ID);
  return ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : new ObjectId(DEMO_USER_ID);
}

export function createFinanceApi(deps: FinanceApiDeps) {
  const { accounts, transactions, clock } = deps;

  return {
    async getAccounts(tenantId: string, userId: string): Promise<AccountListResponse> {
      const docs = await accounts.findByUser(tenantId, userId);
      return { accounts: docs.map(toAccountDto) };
    },

    async createAccount(tenantId: string, userId: string, input: CreateAccountRequest): Promise<AccountDto> {
      const now = clock.now();
      const created = await accounts.create({
        tenantId: resolveTenantId(tenantId),
        userId: resolveUserId(userId),
        householdMode: input.householdMode ?? 'INDIVIDUAL',
        institutionName: input.institutionName,
        accountType: input.accountType,
        currency: input.currency,
        balance: input.balance,
        lastSyncedAt: now,
        isPrimaryLiquidity: input.isPrimaryLiquidity ?? false,
        createdAt: now,
      });
      return toAccountDto(created);
    },

    async getTransactions(tenantId: string, userId: string): Promise<TransactionListResponse> {
      const docs = await transactions.findByUser(tenantId, userId);
      return { transactions: docs.map(toTransactionDto) };
    },

    async getCashflowSummary(
      tenantId: string,
      userId: string,
      householdMode: HouseholdMode = 'FAMILY_HOUSEHOLD',
    ): Promise<CashflowSummaryResponse> {
      const accDocs = await accounts.findByUser(tenantId, userId);
      const txDocs = await transactions.findByUser(tenantId, userId);

      let convertedAccounts = accDocs;
      if (deps.market) {
        try {
          const nonBase = accDocs.filter((a) => a.currency !== 'EUR');
          if (nonBase.length > 0) {
            const conversions = await deps.market.convert({
              items: nonBase.map((a) => ({
                amount: a.balance,
                currency: a.currency,
                date: toIsoDate(clock.now()),
              })),
              target: 'EUR',
              mode: 'SPOT',
            });
            convertedAccounts = accDocs.map((a) => {
              if (a.currency === 'EUR') return a;
              const match = conversions.find((c) => c.item.currency === a.currency);
              return match?.valuation?.converted ? { ...a, balance: match.valuation.converted.amount } : a;
            });
          }
        } catch {
          // If rates are temporarily unseeded or unavailable, retain raw balances
        }
      }

      const burn = calculateBurnRate({
        householdMode,
        accounts: convertedAccounts,
        transactions: txDocs,
      });

      let eurCnyRate = 7.82;
      let gbpSgdRate = 1.71;
      if (deps.market) {
        try {
          const eurRates = await deps.market.rates('EUR');
          const cny = eurRates.rates.find((r) => r.quote === 'CNY');
          if (cny) eurCnyRate = cny.rate;
          const gbpRates = await deps.market.rates('GBP');
          const sgd = gbpRates.rates.find((r) => r.quote === 'SGD');
          if (sgd) gbpSgdRate = sgd.rate;
        } catch {
          // Keep defaults if market rates unseeded
        }
      }

      const corridors: RemittanceCorridorSummary[] = [
        {
          corridor: 'EUR_CNY',
          sourceCurrency: 'EUR',
          targetCurrency: 'CNY',
          monthlyTargetAmount: 2500000, // 25,000 RMB in fen
          monthlyBaseEquivalent: 320000, // ~€3,200
          lastRate: eurCnyRate,
          recipientName: 'Family Support (Shanghai)',
        },
        {
          corridor: 'GBP_SGD',
          sourceCurrency: 'GBP',
          targetCurrency: 'SGD',
          monthlyTargetAmount: 480000, // S$4,800
          monthlyBaseEquivalent: 330000, // ~€3,300
          lastRate: gbpSgdRate,
          recipientName: 'Education Reserve (Singapore)',
        },
      ];

      return {
        baseCurrency: 'EUR' as Currency,
        householdMode,
        monthlyInflowBase: burn.monthlyInflowBase,
        monthlyOutflowBase: burn.monthlyOutflowBase,
        netCashflowBase: burn.netCashflowBase,
        totalLiquidReservesBase: burn.totalLiquidReservesBase,
        runwayMonths: burn.runwayMonths,
        runwayBand: burn.runwayBand,
        reserveMultiplier: burn.reserveMultiplier,
        remittanceCorridors: corridors,
      };
    },
  };
}

export type FinanceApi = ReturnType<typeof createFinanceApi>;
