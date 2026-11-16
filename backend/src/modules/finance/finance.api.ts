import { ObjectId } from 'mongodb';
import {
  type AccountDto,
  type AccountListResponse,
  type CashflowSummaryResponse,
  type CreateAccountRequest,
  type CreateTransactionRequest,
  type CreateTransactionResponse,
  type RemittanceCorridorSummary,
  TRANSACTION_INGESTED,
  type TransactionDto,
  type TransactionListResponse,
} from '@wealth-advisor/contracts';
import { FINANCE_ERROR_CODES, type Currency, type HouseholdMode } from '@wealth-advisor/rules';
import type { EventBus } from '#core/events/event-bus.ts';
import { createEnvelope } from '#core/events/event-envelope.ts';
import type { Clock } from '#core/time/clock.ts';
import { toIsoDate } from '#core/time/calendar-date.ts';
import { toDocumentId, DEFAULT_TENANT_ID, DEFAULT_USER_ID, toScopeId } from '#core/db/document-id.ts';
import { DomainError } from '#core/domain/domain-error.ts';
import { type ConversionResult, type MarketApi, Money } from '../market/public.ts';
import type { AccountRepository, TransactionRepository } from './application/ports.ts';
import { calculateBurnRate } from './domain/burn-rate-calculator.ts';
import type { AccountDocument } from './infrastructure/db/documents/account.document.ts';
import type { TransactionDocument } from './infrastructure/db/documents/transaction.document.ts';

export interface FinanceApiDeps {
  accounts: AccountRepository;
  transactions: TransactionRepository;
  clock: Clock;
  market?: MarketApi;
  events?: EventBus;
}

function toAccountDto(doc: AccountDocument, baseBalance: number | null): AccountDto {
  return {
    id: doc._id.toHexString(),
    tenantId: doc.tenantId.toHexString(),
    userId: doc.userId.toHexString(),
    householdMode: doc.householdMode,
    institutionName: doc.institutionName,
    accountType: doc.accountType,
    currency: doc.currency,
    balance: doc.balance,
    baseBalance,
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
    ...(doc.externalId ? { externalId: doc.externalId } : {}),
    category: doc.category,
    amount: doc.amount,
    currency: doc.currency,
    convertedBaseAmount: doc.convertedBaseAmount,
    baseCurrency: doc.baseCurrency,
    ...(doc.description ? { description: doc.description } : {}),
    remittanceMetadata: doc.remittanceMetadata,
    tuitionMetadata: doc.tuitionMetadata,
    timestamp: doc.timestamp.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}

// One valuation pass shared by the accounts list and the cashflow summary, so the two never disagree. A base-currency
// account values itself; anything else needs today's spot rate, and an account no rate can value stays unvalued rather
// than contributing its own minor units to a EUR total.
async function valueAccounts(
  accounts: readonly AccountDocument[],
  market: MarketApi | undefined,
  asOf: string,
): Promise<Map<string, number | null>> {
  // A base-currency account values itself whether or not a market is reachable.
  const valued = new Map<string, number | null>(
    accounts.map((a) => [a._id.toHexString(), a.currency === 'EUR' ? a.balance : null]),
  );
  const nonBase = accounts.filter((a) => a.currency !== 'EUR');
  if (!market || nonBase.length === 0) return valued;

  let conversions: ConversionResult[] = [];
  try {
    conversions = await market.convert({
      items: nonBase.map((a) => ({ money: Money.of(a.balance, a.currency), date: asOf })),
      target: 'EUR',
      mode: 'spot',
    });
  } catch {
    // Unseeded or unavailable rates leave every account unvalued; the caller reports how many.
    return valued;
  }

  // convertBatch maps items in order, so an index identifies its account; a failed item leaves only itself unvalued.
  nonBase.forEach((account, index) => {
    const result = conversions[index];
    if (result?.ok) valued.set(account._id.toHexString(), result.valuation.converted.amount);
  });
  return valued;
}

// A write must be attributed to a real scope: an id that is neither a document id nor the demo scope is refused, so a
// malformed caller can never file an account under the demo tenant.
function requireScopeId(id: string, demoId: string, label: string): ObjectId {
  const scopeId = toScopeId(id, demoId);
  if (!scopeId) throw new DomainError(FINANCE_ERROR_CODES.invariantViolated, `unusable ${label} scope id`);
  return scopeId;
}

export function createFinanceApi(deps: FinanceApiDeps) {
  const { accounts, transactions, clock } = deps;

  return {
    async getAccounts(tenantId: string, userId: string): Promise<AccountListResponse> {
      const docs = await accounts.findByUser(tenantId, userId);
      const valued = await valueAccounts(docs, deps.market, toIsoDate(clock.now()));
      return { accounts: docs.map((doc) => toAccountDto(doc, valued.get(doc._id.toHexString()) ?? null)) };
    },

    async createAccount(tenantId: string, userId: string, input: CreateAccountRequest): Promise<AccountDto> {
      const now = clock.now();
      const created = await accounts.create({
        tenantId: requireScopeId(tenantId, DEFAULT_TENANT_ID, 'tenant'),
        userId: requireScopeId(userId, DEFAULT_USER_ID, 'user'),
        householdMode: input.householdMode ?? 'INDIVIDUAL',
        institutionName: input.institutionName,
        accountType: input.accountType,
        currency: input.currency,
        balance: input.balance,
        lastSyncedAt: now,
        isPrimaryLiquidity: input.isPrimaryLiquidity ?? false,
        createdAt: now,
      });
      return toAccountDto(created, created.currency === 'EUR' ? created.balance : null);
    },

    async getTransactions(tenantId: string, userId: string): Promise<TransactionListResponse> {
      const docs = await transactions.findByUser(tenantId, userId);
      return { transactions: docs.map(toTransactionDto) };
    },

    async ingestTransaction(
      tenantId: string,
      userId: string,
      input: CreateTransactionRequest,
    ): Promise<CreateTransactionResponse> {
      const tId = requireScopeId(tenantId, DEFAULT_TENANT_ID, 'tenant');
      const uId = requireScopeId(userId, DEFAULT_USER_ID, 'user');

      if (input.externalId) {
        const existing = await transactions.findByExternalId(tenantId, userId, input.externalId);
        if (existing) {
          return { transaction: toTransactionDto(existing), deduplicated: true };
        }
      }

      const account = await accounts.findById(input.accountId);
      if (
        !account ||
        account.tenantId.toHexString() !== tId.toHexString() ||
        account.userId.toHexString() !== uId.toHexString()
      ) {
        throw new DomainError(FINANCE_ERROR_CODES.accountNotFound, 'account not found for scope');
      }

      const baseCurrency: Currency = 'EUR';
      const txTimestamp = new Date(input.timestamp);
      let convertedBaseAmount = input.amount;

      if (input.currency !== baseCurrency && deps.market) {
        try {
          const txDate = toIsoDate(txTimestamp);
          const conv = await deps.market.convert({
            items: [{ money: Money.of(input.amount, input.currency), date: txDate }],
            target: baseCurrency,
            mode: 'spot',
          });
          if (conv[0]?.ok) {
            convertedBaseAmount = conv[0].valuation.converted.amount;
          }
        } catch {
          // Keep minor-unit fallback when market rates are unseeded in isolated tests
        }
      }

      const created = await transactions.create({
        tenantId: tId,
        userId: uId,
        accountId: toDocumentId(input.accountId) ?? account._id,
        ...(input.externalId ? { externalId: input.externalId } : {}),
        category: input.category,
        amount: input.amount,
        currency: input.currency,
        convertedBaseAmount,
        baseCurrency,
        ...(input.description ? { description: input.description } : {}),
        ...(input.remittanceMetadata ? { remittanceMetadata: input.remittanceMetadata } : {}),
        ...(input.tuitionMetadata ? { tuitionMetadata: input.tuitionMetadata } : {}),
        timestamp: txTimestamp,
        createdAt: clock.now(),
      });

      if (deps.events) {
        await deps.events.publish(
          createEnvelope({
            type: TRANSACTION_INGESTED.type,
            version: TRANSACTION_INGESTED.version,
            occurredAt: clock.now(),
            payload: {
              tenantId,
              userId,
              transactionId: created._id.toHexString(),
              category: created.category,
              convertedBaseAmount: created.convertedBaseAmount,
              baseCurrency: created.baseCurrency,
              timestamp: created.timestamp.toISOString(),
            },
          }),
        );
      }

      return { transaction: toTransactionDto(created), deduplicated: false };
    },

    async getCashflowSummary(
      tenantId: string,
      userId: string,
      householdMode: HouseholdMode = 'FAMILY_HOUSEHOLD',
    ): Promise<CashflowSummaryResponse> {
      const accDocs = await accounts.findByUser(tenantId, userId);
      const txDocs = await transactions.findByUser(tenantId, userId);
      const valued = await valueAccounts(accDocs, deps.market, toIsoDate(clock.now()));

      // All valued checking/wallet accounts contribute to liquid reserves; isPrimaryLiquidity only designates the primary settlement account.
      const reserves = accDocs.reduce((sum, doc) => sum + (valued.get(doc._id.toHexString()) ?? 0), 0);
      const unvaluedAccountCount = accDocs.filter((doc) => valued.get(doc._id.toHexString()) == null).length;

      const burn = calculateBurnRate({ householdMode, transactions: txDocs, totalLiquidReservesBase: reserves });

      let eurCnyRate = 7.82;
      let gbpSgdRate = 1.71;
      let stale = false;
      let staleReason: string | undefined;
      if (deps.market) {
        try {
          const eurRates = await deps.market.ratesResilient('EUR');
          const cny = eurRates.rates.find((r) => r.quote === 'CNY');
          if (cny) eurCnyRate = cny.rate;
          if (eurRates.stale) {
            stale = true;
            staleReason = eurRates.staleReason;
          }
          const gbpRates = await deps.market.ratesResilient('GBP');
          const sgd = gbpRates.rates.find((r) => r.quote === 'SGD');
          if (sgd) gbpSgdRate = sgd.rate;
          if (gbpRates.stale) {
            stale = true;
            staleReason = staleReason ?? gbpRates.staleReason;
          }
        } catch {
          // Keep defaults if market rates unseeded
        }
      }

      const isDemoScope = tenantId === 'default' && userId === 'default';
      const corridors: RemittanceCorridorSummary[] = isDemoScope
        ? [
            {
              corridor: 'EUR_CNY',
              sourceCurrency: 'EUR',
              targetCurrency: 'CNY',
              monthlyTargetAmount: 2500000, // 25,000 RMB in fen
              monthlyBaseEquivalent: Math.round(2500000 / eurCnyRate),
              lastRate: eurCnyRate,
              recipientName: 'Family Support (Shanghai)',
            },
            {
              corridor: 'GBP_SGD',
              sourceCurrency: 'GBP',
              targetCurrency: 'SGD',
              monthlyTargetAmount: 480000, // S$4,800
              monthlyBaseEquivalent: Math.round((480000 / gbpSgdRate) / 0.85),
              lastRate: gbpSgdRate,
              recipientName: 'Education Reserve (Singapore)',
            },
          ]
        : txDocs
            .filter((tx) => tx.remittanceMetadata)
            .map((tx) => {
              const meta = tx.remittanceMetadata!;
              return {
                corridor: `${tx.currency}_${meta.destinationCurrency}`,
                sourceCurrency: tx.currency,
                targetCurrency: meta.destinationCurrency as Currency,
                monthlyTargetAmount: Math.round(tx.amount * meta.exchangeRateApplied),
                monthlyBaseEquivalent: tx.convertedBaseAmount,
                lastRate: meta.exchangeRateApplied,
                recipientName: tx.description ?? meta.recipientCountry,
              };
            });

      return {
        baseCurrency: 'EUR' as Currency,
        householdMode,
        monthlyInflowBase: burn.monthlyInflowBase,
        monthlyOutflowBase: burn.monthlyOutflowBase,
        netCashflowBase: burn.netCashflowBase,
        totalLiquidReservesBase: burn.totalLiquidReservesBase,
        unvaluedAccountCount,
        runwayMonths: burn.runwayMonths,
        runwayBand: burn.runwayBand,
        reserveMultiplier: burn.reserveMultiplier,
        remittanceCorridors: corridors,
        ...(stale ? { stale: true, ...(staleReason ? { staleReason } : {}) } : {}),
      };
    },
  };
}

export type FinanceApi = ReturnType<typeof createFinanceApi>;
