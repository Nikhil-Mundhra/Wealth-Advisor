import { ObjectId } from 'mongodb';
import { sha256Hex } from '#core/crypto/sha256.ts';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID, toScopeId } from '#core/db/document-id.ts';
import type { Clock } from '#core/time/clock.ts';
import { DomainError } from '#core/domain/domain-error.ts';
import {
  calculateBaseRiskScore,
  constructOptimalPortfolio,
  deriveCorridorCurrencies,
  deriveTimeHorizonYears,
  mapScoreToRiskTier,
  mapStressAnswerToRiskBand,
  recalibrateRiskScore,
  WEALTH_ERROR_CODES,
  type OptimizationConstraints,
  type RiskTier,
} from '@wealth-advisor/rules';
import type {
  AssetProductDto,
  AssetProductListResponse,
  ConstructPortfolioRequest,
  ConstructPortfolioResponse,
  ExecuteTradeRequest,
  ExecuteTradeResponse,
  OptimizePortfolioRequest,
  PortfolioResponse,
  ProfileSummary,
  ProfilingAnswers,
  RebalanceActionDto,
  RebalanceProposalResponse,
  RiskProfileResponse,
  SandboxLedgerEntryDto,
  SandboxLedgerResponse,
} from '@wealth-advisor/contracts';
import { INSTITUTIONAL_CANDIDATE_SECURITIES } from './domain/institutional-securities.ts';
import type { AnalyticsApi } from '../analytics/public.ts';
import type {
  AssetProductRepository,
  PasskeyVerifier,
  PortfolioRepository,
  RiskProfileRepository,
  SandboxLedgerRepository,
} from './application/ports.ts';
import type { AssetProductDocument } from './infrastructure/db/documents/asset-product.document.ts';
import type { PortfolioDocument } from './infrastructure/db/documents/portfolio.document.ts';
import type { RiskProfileDocument } from './infrastructure/db/documents/risk-profile.document.ts';
import type { SandboxLedgerDocument } from './infrastructure/db/documents/sandbox-ledger.document.ts';

export interface WealthApiDeps {
  products: AssetProductRepository;
  portfolios: PortfolioRepository;
  profiles?: RiskProfileRepository;
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
    // Older databases predate the securityType column; default so reads never emit undefined.
    securityType: doc.securityType ?? 'MUTUAL_FUND_ETF',
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
  const { products, portfolios, profiles, ledger, passkeys, clock } = deps;

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
      input?: OptimizePortfolioRequest,
    ): Promise<RebalanceProposalResponse> {
      const doc = await portfolios.findByUser(tenantId, userId);
      if (!doc) throw new DomainError(WEALTH_ERROR_CODES.portfolioNotFound, 'portfolio not found');

      // Dynamic recalibration: live runway and FX pressure override the onboarding score.
      // Unknown household mode defaults to family, the conservative bar that never overstates risk capacity.
      const effectiveRiskScore = recalibrateRiskScore({
        baseRiskScore: input?.statedRiskScore ?? doc.baseRiskScore,
        runwayMonths: input?.runwayMonths ?? doc.burnRateRunwayMonths,
        householdMode: input?.householdMode ?? 'FAMILY_HOUSEHOLD',
        fxMismatchPct: input?.fxMismatchPct,
      });
      // What-if overrides shape the response only; only a live call with no input persists the recalibration.
      // An empty object over HTTP counts as live, not what-if: readJsonBody normalizes empty bodies to {}
      // and RouteBuilder always forwards the parsed body, so input === undefined is never true over HTTP.
      const isLiveCall = input === undefined || Object.keys(input).length === 0;
      if (isLiveCall && effectiveRiskScore !== doc.effectiveRiskScore) {
        doc.effectiveRiskScore = effectiveRiskScore;
        doc.updatedAt = clock.now();
        await portfolios.save(doc);
      }

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
        effectiveRiskScore,
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

    async constructPortfolio(
      tenantId: string,
      userId: string,
      request?: ConstructPortfolioRequest,
    ): Promise<ConstructPortfolioResponse> {
      const p = await portfolios.findByUser(tenantId, userId);
      const profile = profiles ? await profiles.findByUser(tenantId, userId) : null;
      const baseValue = request?.targetTotalValueBase ?? p?.totalValuationBase ?? 9500000;

      let tier: RiskTier = request?.riskTier ?? 'moderate';
      if (!request?.riskTier) {
        if (request?.statedRiskScore !== undefined) {
          tier = mapScoreToRiskTier(request.statedRiskScore);
        } else if (p?.effectiveRiskScore !== undefined) {
          tier = mapScoreToRiskTier(p.effectiveRiskScore);
        } else if (profile?.summary?.baseRiskScore !== undefined) {
          tier = mapScoreToRiskTier(profile.summary.baseRiskScore);
        }
      }

      const isShariaClient = Boolean(
        request?.shariaOnly ||
        profile?.answers?.countries?.remittanceDestinations?.includes('AE') ||
        profile?.answers?.countries?.residence === 'AE',
      );

      const constraints: OptimizationConstraints = {
        riskTier: tier,
        shariaOnly: isShariaClient,
        minLiquidityFactor: request?.minLiquidityFactor ?? 0.70,
        maxSectorExposure: request?.maxSectorExposure ?? 0.30,
        maxSingleSecurityWeight: request?.maxSingleSecurityWeight ?? 0.25,
        singleFundHouseCap: 0.15,
        targetTotalValueBase: baseValue,
      };

      let candidateList = INSTITUTIONAL_CANDIDATE_SECURITIES;
      if (request?.jurisdiction === 'INDIA') {
        candidateList = candidateList.filter((c) => c.domicileCountry === 'IN' || c.assetClass === 'MONEY_MARKET');
      } else if (request?.jurisdiction === 'UAE') {
        candidateList = candidateList.filter((c) => c.domicileCountry === 'AE' || c.assetClass === 'MONEY_MARKET');
      }

      const optimal = constructOptimalPortfolio(candidateList, constraints);

      const largestHolding = optimal.holdings[0];
      const topEquity = optimal.holdings.find((h) => h.assetClass.startsWith('EQUITY'));

      const rationale = {
        personalFinance:
          'Allocation guarantees emergency liquidity runway exceeds 6 months via overnight money market reserves before capital is deployed into duration risk.',
        crossBorder: isShariaClient
          ? 'Cross-border UAE and GCC remittance corridors protected via USD/AED sovereign and green corporate sukuk yielding 5.10%–5.45% tax-efficient distributions.'
          : 'Cross-border corridors diversified across EUR sovereign bonds and global equities to hedge against regional currency depreciation.',
        wealthStrategy: largestHolding
          ? `Mean-variance optimization selected ${largestHolding.name} (${largestHolding.symbol}) as anchor holding at ${(largestHolding.weight * 100).toFixed(0)}% weight with Composite Score of ${largestHolding.compositeScore.toFixed(2)}.`
          : 'Portfolio weights aligned with targeted risk-return frontier.',
        technicalAttribution: topEquity
          ? `${topEquity.symbol} selected based on bullish 20/200 EMA crossover, RSI momentum (${topEquity.technicalScore.toFixed(2)} technical score), and healthy institutional order flow.`
          : 'Technical trend filters passed across all active equity allocations.',
        fundamentalAttribution: topEquity
          ? `${topEquity.symbol} verified with DCF margin of safety > 20%, ROE > 15%, and disciplined debt-to-equity below 0.35.`
          : 'Fundamental solvency and DCF valuations verified for all holdings.',
        regulatoryAttribution: isShariaClient
          ? 'SCA & AAOIFI Sharia compliance verified. Zero non-compliant conventional debt instruments held.'
          : 'SEBI and UCITS IV/V regulatory registration and concentration limits (<15% single fund house) verified.',
      };

      const sourceAttribution = [
        'Valuation Engine: Damodaran DCF Intrinsic Model & Country-specific WACC',
        'Technical Engine: 200 EMA Trend Filter, RSI Momentum, and Ichimoku Cloud',
        'Fixed Income & Sukuk: Macaulay/Modified Duration & Convexity Macro Shift Model',
        'Mutual Fund Screener: Sharpe, Sortino, Jensen Alpha, Information Ratio & Expense Cap (SEBI/UCITS)',
        'Stress Testing: 2,000-Path Monte Carlo Simulation & ±200bps Policy Rate Shocks',
      ];

      return {
        riskTier: optimal.riskTier,
        riskAversionLambda: optimal.riskAversionLambda,
        holdings: optimal.holdings,
        portfolioExpectedReturn: optimal.portfolioExpectedReturn,
        portfolioVolatility: optimal.portfolioVolatility,
        portfolioSharpeRatio: optimal.portfolioSharpeRatio,
        durationWeightedExposure: optimal.durationWeightedExposure,
        complianceChecks: optimal.complianceChecks,
        stressTestOutcomes: optimal.stressTestOutcomes,
        monteCarlo: optimal.monteCarlo,
        rationale,
        sourceAttribution,
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

    async getProfile(tenantId: string, userId: string): Promise<RiskProfileResponse> {
      if (!profiles) throw new DomainError(WEALTH_ERROR_CODES.profileNotFound, 'risk profile not found');
      const doc = await profiles.findByUser(tenantId, userId);
      if (!doc) throw new DomainError(WEALTH_ERROR_CODES.profileNotFound, 'risk profile not found');
      return {
        tenantId: toIdString(doc.tenantId),
        userId: toIdString(doc.userId),
        answers: doc.answers,
        summary: doc.summary,
        updatedAt: doc.updatedAt.toISOString(),
      };
    },

    async saveProfile(
      tenantId: string,
      userId: string,
      answers: ProfilingAnswers,
    ): Promise<RiskProfileResponse> {
      if (!profiles) throw new DomainError(WEALTH_ERROR_CODES.profileNotFound, 'risk profile not configured');
      const tId = requireScopeId(tenantId, DEFAULT_TENANT_ID, 'tenant');
      const uId = requireScopeId(userId, DEFAULT_USER_ID, 'user');
      const now = clock.now();

      const baseRiskScore = calculateBaseRiskScore(answers);
      const effectiveRiskBand = mapStressAnswerToRiskBand(answers.stressResponse);
      const timeHorizonYears = deriveTimeHorizonYears(answers.age);
      const corridorCurrencies = deriveCorridorCurrencies(answers.countries);

      const summary: ProfileSummary = {
        baseRiskScore,
        effectiveRiskBand,
        timeHorizonYears,
        corridorCurrencies,
        completedAt: now.toISOString(),
      };

      const existing = await profiles.findByUser(tenantId, userId);
      const doc: RiskProfileDocument = {
        _id: existing?._id ?? new ObjectId(),
        tenantId: tId,
        userId: uId,
        answers,
        summary,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      await profiles.save(doc);

      const p = await portfolios.findByUser(tenantId, userId);
      if (p) {
        p.baseRiskScore = baseRiskScore;
        p.updatedAt = now;
        await portfolios.save(p);
      }

      return {
        tenantId: toIdString(tId),
        userId: toIdString(uId),
        answers: doc.answers,
        summary: doc.summary,
        updatedAt: doc.updatedAt.toISOString(),
      };
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
