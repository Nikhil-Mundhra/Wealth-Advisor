import type { ObjectId } from 'mongodb';
import { sha256Hex } from '#core/crypto/sha256.ts';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID, toScopeId } from '#core/db/document-id.ts';
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
  RebalanceActionDto,
  RebalanceProposalResponse,
  SandboxLedgerEntryDto,
  SandboxLedgerResponse,
} from '@wealth-advisor/contracts';
import type { AnalyticsApi } from '../analytics/public.ts';
import type {
  AssetProductRepository,
  PasskeyVerifier,
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
  passkeys: PasskeyVerifier;
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
  const { products, portfolios, ledger, passkeys, clock } = deps;

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
      const actions = planRebalance(doc);
      const largest = doc.holdings.reduce<(typeof doc.holdings)[number] | null>(
        (worst, h) => (!worst || Math.abs(h.targetWeight - h.currentWeight) > Math.abs(worst.targetWeight - worst.currentWeight) ? h : worst),
        null,
      );

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
          wealthStrategy: largest
            ? `Rebalancing ${largest.assetSymbol} from ${(largest.currentWeight * 100).toFixed(0)}% to ${(largest.targetWeight * 100).toFixed(0)}%${snapshot ? ` against 365-day risk analytics (${snapshot.window.observations} observations)` : ''}, and holding any surplus proceeds in cash rather than deploying them past the target.`
            : 'Every holding already sits at its target weight; no rebalance is due.',
        },
      };
    },

    async executeTrade(tenantId: string, userId: string, input: ExecuteTradeRequest): Promise<ExecuteTradeResponse> {
      const { passkeyAssertion, trades, orderType } = input;
      if (!passkeyAssertion?.signature || !passkeyAssertion?.credentialId) {
        throw new DomainError(WEALTH_ERROR_CODES.passkeyRequired, 'FIDO2 biometric passkey signature required for Tier 3 execution');
      }
      if (!(await passkeys.verify(tenantId, userId, passkeyAssertion))) {
        throw new DomainError(WEALTH_ERROR_CODES.passkeyInvalid, 'passkey assertion failed signature verification');
      }

      const now = clock.now();
      const timestampIso = now.toISOString();

      const p = await portfolios.findByUser(tenantId, userId);
      if (!p) throw new DomainError(WEALTH_ERROR_CODES.portfolioNotFound, 'portfolio not found');

      const initialSummary = p.holdings.map((h) => ({ s: h.assetSymbol, w: h.currentWeight, q: h.quantity }));
      const initialHash = sha256Hex(`state_${tenantId}_${userId}_initial_${JSON.stringify(initialSummary)}`);

      // The client's target weight is checked against the portfolio's own and then discarded: the executed weight is the
      // recorded one, so no caller can rebalance into a portfolio the profile never proposed.
      const rebased = p.holdings.map((holding) => ({ ...holding }));
      for (const trade of trades) {
        const holding = rebased.find((item) => item.assetSymbol === trade.assetSymbol);
        if (!holding || Math.abs(holding.targetWeight - trade.targetWeight) > WEIGHT_EPSILON) {
          throw new DomainError(WEALTH_ERROR_CODES.tradeNotPermitted, `no permitted rebalance for ${trade.assetSymbol}`);
        }
        holding.currentWeight = holding.targetWeight;
        holding.marketValueBase = Math.round(p.totalValuationBase * holding.currentWeight);
        if (holding.currentPrice > 0) {
          holding.quantity = Math.round(holding.marketValueBase / holding.currentPrice);
        }
      }

      const resultingSummary = rebased.map((h) => ({ s: h.assetSymbol, w: h.currentWeight, q: h.quantity }));
      const resultingHash = sha256Hex(`state_${tenantId}_${userId}_${timestampIso}_${JSON.stringify(resultingSummary)}`);

      const tradeDiffJson = JSON.stringify(trades);
      const auditPayload = `${userId}:${tenantId}:${timestampIso}:${passkeyAssertion.signature}:${tradeDiffJson}`;
      const auditDigest = sha256Hex(auditPayload);
      const transactionHash = `0x${sha256Hex(auditDigest).slice(0, 40)}`;

      // Evidence lands before state: a failure to persist the rebalance leaves a ledger row that records an attempt
      // that did not take effect, never a moved portfolio that nothing accounts for.
      const entry = await ledger.append({
        tenantId: requireScopeId(tenantId, DEFAULT_TENANT_ID, 'tenant'),
        userId: requireScopeId(userId, DEFAULT_USER_ID, 'user'),
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

      p.holdings = rebased;
      p.lastRebalancedAt = now;
      p.updatedAt = now;
      await portfolios.save(p);

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

// Weights are stored as decimals, so a target and its drift are compared with a tolerance rather than for equality.
const WEIGHT_EPSILON = 0.001;

// Drift is the plan, but a plan whose buys outrun its sells cannot be executed: the buys share the sell proceeds in
// drift order and whatever is left over stays in cash rather than being deployed past the target.
function planRebalance(doc: PortfolioDocument): RebalanceActionDto[] {
  const sells = doc.holdings.filter((h) => h.currentWeight - h.targetWeight >= WEIGHT_EPSILON);
  const buys = doc.holdings.filter((h) => h.targetWeight - h.currentWeight >= WEIGHT_EPSILON);
  const amountOf = (weight: number) => Math.round(doc.totalValuationBase * weight);

  let proceeds = sells.reduce((sum, h) => sum + amountOf(h.currentWeight - h.targetWeight), 0);
  const actions: RebalanceActionDto[] = sells.map((h) => ({
    assetSymbol: h.assetSymbol,
    action: 'SELL',
    amountBase: amountOf(h.currentWeight - h.targetWeight),
    targetWeight: h.targetWeight,
  }));
  for (const h of buys) {
    const wanted = amountOf(h.targetWeight - h.currentWeight);
    const amountBase = Math.min(wanted, Math.max(proceeds, 0));
    proceeds -= amountBase;
    if (amountBase > 0) actions.push({ assetSymbol: h.assetSymbol, action: 'BUY', amountBase, targetWeight: h.targetWeight });
  }
  return actions;
}

// A ledger row is owned by a scope, so an id that is neither a document id nor the demo scope is refused rather than
// stored as a string the schema would reject.
function requireScopeId(id: string, demoId: string, label: string): ObjectId {
  const scopeId = toScopeId(id, demoId);
  if (!scopeId) throw new DomainError(WEALTH_ERROR_CODES.invariantViolated, `unusable ${label} scope id`);
  return scopeId;
}

export type WealthApi = ReturnType<typeof createWealthApi>;
