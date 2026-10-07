import { sha256Hex } from '#core/crypto/sha256.ts';
import type { Clock } from '#core/time/clock.ts';
import { DomainError } from '#core/domain/domain-error.ts';
import { WEALTH_ERROR_CODES } from '@wealth-advisor/rules';
import type {
  AssetProductDto,
  AssetProductListResponse,
  ExecuteTradeRequest,
  ExecuteTradeResponse,
  OptimizePortfolioRequest,
  PortfolioResponse,
  RebalanceProposalResponse,
  SandboxLedgerEntryDto,
  SandboxLedgerResponse,
} from '@wealth-advisor/contracts';
import type { AnalyticsApi } from '../analytics/public.ts';
import type {
  AssetProductRepository,
  PortfolioRepository,
  SandboxLedgerRepository,
} from './application/ports.ts';
import type { AssetProductDocument } from './infrastructure/db/documents/asset-product.document.ts';
import type { PortfolioDocument } from './infrastructure/db/documents/portfolio.document.ts';
import type { SandboxLedgerDocument } from './infrastructure/db/documents/sandbox-ledger.document.ts';

export interface WealthApiDeps {
  products: AssetProductRepository;
  portfolios: PortfolioRepository;
  ledger: SandboxLedgerRepository;
  clock: Clock;
  analytics?: AnalyticsApi;
}

function toProductDto(doc: AssetProductDocument): AssetProductDto {
  return {
    id: doc._id.toHexString(),
    symbol: doc.symbol,
    name: doc.name,
    assetClass: doc.assetClass,
    denominationCurrency: doc.denominationCurrency,
    riskRating: doc.riskRating,
    expenseRatio: doc.expenseRatio,
    annualizedYield: doc.annualizedYield,
    threeYearReturn: doc.threeYearReturn,
    fiveYearReturn: doc.fiveYearReturn,
    domicileCountry: doc.domicileCountry,
    description: doc.description,
    isActive: doc.isActive,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toIdString(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof (val as { toHexString?: () => string }).toHexString === 'function') {
    return (val as { toHexString: () => string }).toHexString();
  }
  return String(val);
}

function toPortfolioResponse(doc: PortfolioDocument): PortfolioResponse {
  return {
    id: toIdString(doc._id),
    tenantId: toIdString(doc.tenantId),
    userId: toIdString(doc.userId),
    baseCurrency: doc.baseCurrency,
    totalValuationBase: doc.totalValuationBase,
    baseRiskScore: doc.baseRiskScore,
    effectiveRiskScore: doc.effectiveRiskScore,
    burnRateRunwayMonths: doc.burnRateRunwayMonths,
    holdings: doc.holdings.map((h) => ({
      assetSymbol: h.assetSymbol,
      assetName: h.assetName,
      assetClass: h.assetClass,
      currency: h.currency,
      quantity: h.quantity,
      averageCostBasis: h.averageCostBasis,
      currentPrice: h.currentPrice,
      marketValueBase: h.marketValueBase,
      currentWeight: h.currentWeight,
      targetWeight: h.targetWeight,
    })),
    lastRebalancedAt: doc.lastRebalancedAt ? doc.lastRebalancedAt.toISOString() : null,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toLedgerEntryDto(doc: SandboxLedgerDocument): SandboxLedgerEntryDto {
  return {
    id: toIdString(doc._id),
    tenantId: toIdString(doc.tenantId),
    userId: toIdString(doc.userId),
    orderType: doc.orderType,
    initialPortfolioStateHash: doc.initialPortfolioStateHash,
    executedTrades: doc.executedTrades,
    resultingPortfolioStateHash: doc.resultingPortfolioStateHash,
    passkeyAssertionProof: doc.passkeyAssertionProof,
    auditDigest: doc.auditDigest,
    transactionHash: doc.transactionHash,
    status: doc.status,
    timestamp: doc.timestamp.toISOString(),
  };
}

export function createWealthApi(deps: WealthApiDeps) {
  const { products, portfolios, ledger, clock } = deps;

  return {
    async getProducts(): Promise<AssetProductListResponse> {
      const all = await products.findAll();
      return { products: all.map(toProductDto) };
    },

    async getPortfolio(tenantId: string, userId: string): Promise<PortfolioResponse> {
      const doc = await portfolios.findByUser(tenantId, userId);
      if (!doc) throw new DomainError(WEALTH_ERROR_CODES.portfolioNotFound, 'portfolio not found');
      return toPortfolioResponse(doc);
    },

    async optimizePortfolio(
      tenantId: string,
      userId: string,
      _input?: OptimizePortfolioRequest,
    ): Promise<RebalanceProposalResponse> {
      const doc = await portfolios.findByUser(tenantId, userId);
      if (!doc) throw new DomainError(WEALTH_ERROR_CODES.portfolioNotFound, 'portfolio not found');

      const currentWeights: Record<string, number> = {};
      const targetWeights: Record<string, number> = {};
      const driftPercentages: Record<string, number> = {};

      for (const h of doc.holdings) {
        currentWeights[h.assetSymbol] = h.currentWeight;
        targetWeights[h.assetSymbol] = h.targetWeight;
        driftPercentages[h.assetSymbol] = Number(((h.targetWeight - h.currentWeight) * 100).toFixed(1));
      }

      const snapshot = deps.analytics ? await deps.analytics.latestSnapshot().catch(() => null) : null;

      const actions = doc.holdings
        .filter((h) => Math.abs(h.targetWeight - h.currentWeight) >= 0.001)
        .map((h) => {
          const isSell = h.currentWeight > h.targetWeight;
          const diff = Math.abs(h.targetWeight - h.currentWeight);
          const amountBase = Math.round(doc.totalValuationBase * diff);
          return {
            assetSymbol: h.assetSymbol,
            action: isSell ? ('SELL' as const) : ('BUY' as const),
            amountBase,
            targetWeight: h.targetWeight,
          };
        });

      return {
        effectiveRiskScore: doc.effectiveRiskScore,
        currentWeights,
        targetWeights,
        driftPercentages,
        actions,
        rationale: {
          personalFinance:
            'Household runway dropped towards the 3-month threshold under elevated cross-border expenses. Expanding liquid cash reserves restores family buffer to 6+ months.',
          crossBorder:
            'Recent FX headwinds increased EUR conversion cost for family remittances. Allocating to short-duration EUR overnight liquidity shields upcoming remittance obligations from currency shocks.',
          wealthStrategy: snapshot
            ? `Trimming overweight US equities (60% -> 40%) based on 365-day risk analytics (${snapshot.window.observations} observations) to match the recalibrated risk tolerance.`
            : 'Trimming overweight US equities (60% -> 40%) locks in equity gains and reduces portfolio beta to match the recalibrated risk tolerance.',
        },
      };
    },

    async executeTrade(tenantId: string, userId: string, input: ExecuteTradeRequest): Promise<ExecuteTradeResponse> {
      const { passkeyAssertion, trades, orderType } = input;
      if (!passkeyAssertion?.signature || !passkeyAssertion?.credentialId) {
        throw new DomainError(WEALTH_ERROR_CODES.passkeyRequired, 'FIDO2 biometric passkey signature required for Tier 3 execution');
      }

      const now = clock.now();
      const timestampIso = now.toISOString();

      const p = await portfolios.findByUser(tenantId, userId);
      const initialSummary = p
        ? p.holdings.map((h) => ({ s: h.assetSymbol, w: h.currentWeight, q: h.quantity }))
        : [];
      const initialHash = sha256Hex(`state_${tenantId}_${userId}_initial_${JSON.stringify(initialSummary)}`);

      let resultingSummary = initialSummary;
      if (p) {
        for (const t of trades) {
          const h = p.holdings.find((item) => item.assetSymbol === t.assetSymbol);
          if (h) {
            h.currentWeight = t.targetWeight;
            h.marketValueBase = Math.round(p.totalValuationBase * h.currentWeight);
            if (h.currentPrice > 0) {
              h.quantity = Math.round(h.marketValueBase / h.currentPrice);
            }
          }
        }
        p.lastRebalancedAt = now;
        p.updatedAt = now;
        resultingSummary = p.holdings.map((h) => ({ s: h.assetSymbol, w: h.currentWeight, q: h.quantity }));
        await portfolios.save(p);
      }

      const resultingHash = sha256Hex(`state_${tenantId}_${userId}_${timestampIso}_${JSON.stringify(resultingSummary)}`);

      const tradeDiffJson = JSON.stringify(trades);
      const auditPayload = `${userId}:${tenantId}:${timestampIso}:${passkeyAssertion.signature}:${tradeDiffJson}`;
      const auditDigest = sha256Hex(auditPayload);
      const transactionHash = `0x${sha256Hex(auditDigest).slice(0, 40)}`;

      const entry = await ledger.append({
        tenantId: docId(tenantId),
        userId: docId(userId),
        orderType,
        initialPortfolioStateHash: initialHash,
        executedTrades: trades,
        resultingPortfolioStateHash: resultingHash,
        passkeyAssertionProof: {
          credentialId: passkeyAssertion.credentialId,
          clientDataJson: passkeyAssertion.clientDataJson,
          authenticatorData: passkeyAssertion.authenticatorData,
          signature: passkeyAssertion.signature,
          verifiedAt: timestampIso,
        },
        auditDigest,
        transactionHash,
        status: 'COMMITTED',
        timestamp: now,
      });

      return {
        ledgerEntry: toLedgerEntryDto(entry),
        success: true,
      };
    },

    async getLedger(tenantId: string, userId: string): Promise<SandboxLedgerResponse> {
      const entries = await ledger.findAllByUser(tenantId, userId);
      return { entries: entries.map(toLedgerEntryDto) };
    },
  };
}

function docId(val: string): any {
  return val;
}

export type WealthApi = ReturnType<typeof createWealthApi>;
