import { z } from 'zod';
import {
  ConstructPortfolioRequest,
  ExecuteTradeRequest,
  IsoDateField,
  OptimizePortfolioRequest,
  type CashflowSummaryResponse,
  type ConstructPortfolioResponse,
  type ExecuteTradeResponse,
  type RebalanceProposalResponse,
  type StressTestOutcomeDto,
} from '@wealth-advisor/contracts';
import {
  CURRENCIES,
  HOUSEHOLD_MODES,
  PERMISSION_TIERS,
  mapScoreToRiskTier,
  type Currency,
  type PermissionTier,
} from '@wealth-advisor/rules';
import type { AnalyticsApi } from '../../analytics/public.ts';
import type { FinanceApi } from '../../finance/public.ts';
import { Money } from '../../market/public.ts';
import type { MarketApi } from '../../market/public.ts';
import type { WealthApi } from '../../wealth/public.ts';
import { AdvisoryErrors } from './errors/advisory-errors.ts';

// Agent tool registry (G9): one tool per deterministic engine in `docs/domain/advisory-pipeline.md`.
// Each tool returns a typed result computed from stored data through another module's public surface;
// the model narrates those structured fields through the calculation shield, never the reverse.

export const ADVISORY_TOOL_NAMES = [
  'get_cashflow_and_runway',
  'get_currency_exposure',
  'calculate_adaptive_portfolio',
  'simulate_stress_test',
  'create_rebalance_proposal',
  'execute_sandbox_trade',
] as const;
export type AdvisoryToolName = (typeof ADVISORY_TOOL_NAMES)[number];

export function isAdvisoryToolName(value: string): value is AdvisoryToolName {
  return (ADVISORY_TOOL_NAMES as readonly string[]).includes(value);
}

export const ADVISORY_TOOL_TIERS: Record<AdvisoryToolName, PermissionTier> = {
  get_cashflow_and_runway: 'TIER_1_ADVISORY',
  get_currency_exposure: 'TIER_0_READ',
  calculate_adaptive_portfolio: 'TIER_1_ADVISORY',
  simulate_stress_test: 'TIER_2_SIMULATE',
  create_rebalance_proposal: 'TIER_2_SIMULATE',
  execute_sandbox_trade: 'TIER_3_EXECUTE',
};

export const ADVISORY_TOOL_DESCRIPTIONS: Record<AdvisoryToolName, string> = {
  get_cashflow_and_runway: 'Burn-rate runway and remittance corridors from stored accounts and transactions.',
  get_currency_exposure: 'Per-account balances converted into one target currency through the market FX rates.',
  calculate_adaptive_portfolio: 'Risk-tiered target allocation constructed from the stored portfolio and profile.',
  simulate_stress_test: 'Stress scenarios over the constructed allocation with the latest measured snapshot covariance.',
  create_rebalance_proposal: 'Drift-derived rebalance actions against the stored target weights.',
  execute_sandbox_trade: 'Execute stored-target trades into the sandbox ledger behind a verified passkey assertion.',
};

export const GetCashflowAndRunwayInput = z.object({
  householdMode: z.enum(HOUSEHOLD_MODES).default('FAMILY_HOUSEHOLD'),
});
export type GetCashflowAndRunwayInput = z.infer<typeof GetCashflowAndRunwayInput>;

export const GetCurrencyExposureInput = z.object({
  targetCurrency: z.enum(CURRENCIES).default('EUR'),
});
export type GetCurrencyExposureInput = z.infer<typeof GetCurrencyExposureInput>;

export const SimulateStressTestInput = z.object({
  asOf: IsoDateField.optional(),
});
export type SimulateStressTestInput = z.infer<typeof SimulateStressTestInput>;

export const ADVISORY_TOOL_INPUTS: Record<AdvisoryToolName, z.ZodType> = {
  get_cashflow_and_runway: GetCashflowAndRunwayInput,
  get_currency_exposure: GetCurrencyExposureInput,
  calculate_adaptive_portfolio: ConstructPortfolioRequest,
  simulate_stress_test: SimulateStressTestInput,
  create_rebalance_proposal: OptimizePortfolioRequest,
  execute_sandbox_trade: ExecuteTradeRequest,
};

export interface CurrencyExposureItem {
  readonly accountId: string;
  readonly currency: Currency;
  readonly balance: number; // minor units, as stored
  readonly convertedBalance: number | null; // minor units in the target currency; null when no rate values it
  readonly rate: number | null;
  readonly rateDate: string | null;
}

export interface CurrencyExposureResult {
  readonly targetCurrency: Currency;
  readonly exposures: readonly CurrencyExposureItem[];
  readonly unvaluedCount: number;
}

export interface StressTestResult {
  readonly asOf: string;
  readonly symbols: readonly string[];
  readonly volatilities: readonly number[];
  readonly covariance: readonly (readonly number[])[];
  readonly window: { readonly from: string; readonly to: string; readonly observations: number };
  readonly scenarios: readonly StressTestOutcomeDto[];
  readonly portfolioExpectedReturn: number;
  readonly portfolioVolatility: number;
}

export interface ToolScope {
  readonly tenantId: string;
  readonly userId: string;
}

export interface ToolRegistryDeps {
  readonly finance: FinanceApi;
  readonly wealth: WealthApi;
  readonly market: MarketApi;
  readonly analytics: AnalyticsApi;
}

// The grant travels with the caller: a chat turn holds TIER_1_ADVISORY, so a model that names a
// TIER_2 or TIER_3 tool is refused before any stored data moves.
export function canInvoke(tool: AdvisoryToolName, grantedTier: PermissionTier): boolean {
  return PERMISSION_TIERS.indexOf(grantedTier) >= PERMISSION_TIERS.indexOf(ADVISORY_TOOL_TIERS[tool]);
}

function requireTier(tool: AdvisoryToolName, grantedTier: PermissionTier): void {
  if (!canInvoke(tool, grantedTier)) throw AdvisoryErrors.tierForbidden(tool, ADVISORY_TOOL_TIERS[tool]);
}

export interface ToolRegistry {
  readonly definitions: readonly {
    readonly name: AdvisoryToolName;
    readonly description: string;
    readonly tier: PermissionTier;
    readonly inputSchema: z.ZodType;
  }[];
  canInvoke(tool: AdvisoryToolName, grantedTier: PermissionTier): boolean;
  dispatch(
    tool: 'get_cashflow_and_runway',
    scope: ToolScope,
    args: unknown,
    grantedTier: PermissionTier,
  ): Promise<CashflowSummaryResponse>;
  dispatch(
    tool: 'get_currency_exposure',
    scope: ToolScope,
    args: unknown,
    grantedTier: PermissionTier,
  ): Promise<CurrencyExposureResult>;
  dispatch(
    tool: 'calculate_adaptive_portfolio',
    scope: ToolScope,
    args: unknown,
    grantedTier: PermissionTier,
  ): Promise<ConstructPortfolioResponse>;
  dispatch(
    tool: 'simulate_stress_test',
    scope: ToolScope,
    args: unknown,
    grantedTier: PermissionTier,
  ): Promise<StressTestResult>;
  dispatch(
    tool: 'create_rebalance_proposal',
    scope: ToolScope,
    args: unknown,
    grantedTier: PermissionTier,
  ): Promise<RebalanceProposalResponse>;
  dispatch(
    tool: 'execute_sandbox_trade',
    scope: ToolScope,
    args: unknown,
    grantedTier: PermissionTier,
  ): Promise<ExecuteTradeResponse>;
}

export function createToolRegistry(deps: ToolRegistryDeps): ToolRegistry {
  const { finance, wealth, market, analytics } = deps;

  // The adaptive allocation falls back to the portfolio's own recalibrated score, the same source the
  // chat reply narrates, so a bare call with no overrides still adapts to stored data.
  async function adaptivePortfolio(scope: ToolScope, args: unknown): Promise<ConstructPortfolioResponse> {
    const input = ConstructPortfolioRequest.parse(args);
    if (input.riskTier === undefined && input.statedRiskScore === undefined) {
      const portfolio = await wealth.getPortfolio(scope.tenantId, scope.userId);
      return wealth.constructPortfolio(scope.tenantId, scope.userId, {
        ...input,
        riskTier: mapScoreToRiskTier(portfolio.effectiveRiskScore),
      });
    }
    return wealth.constructPortfolio(scope.tenantId, scope.userId, input);
  }

  async function invoke(tool: AdvisoryToolName, scope: ToolScope, args: unknown): Promise<unknown> {
    switch (tool) {
      case 'get_cashflow_and_runway': {
        const input = GetCashflowAndRunwayInput.parse(args);
        return finance.getCashflowSummary(scope.tenantId, scope.userId, input.householdMode);
      }
      case 'get_currency_exposure': {
        const input = GetCurrencyExposureInput.parse(args);
        const { accounts } = await finance.getAccounts(scope.tenantId, scope.userId);
        // convertBatch maps items in order, so an index identifies its account; a failed item leaves only
        // itself unvalued, exactly like the finance valuation pass.
        const conversions = await market.convert({
          items: accounts.map((a) => ({ money: Money.of(a.balance, a.currency), date: a.lastSyncedAt.slice(0, 10) })),
          target: input.targetCurrency,
          mode: 'spot',
        });
        const exposures = accounts.map((account, index) => {
          const result = conversions[index];
          const valued = result?.ok === true ? result.valuation : null;
          return {
            accountId: account.id,
            currency: account.currency,
            balance: account.balance,
            convertedBalance: valued ? valued.converted.amount : null,
            rate: valued ? valued.rate : null,
            rateDate: valued ? valued.rateDate : null,
          };
        });
        return {
          targetCurrency: input.targetCurrency,
          exposures,
          unvaluedCount: exposures.filter((e) => e.convertedBalance === null).length,
        } satisfies CurrencyExposureResult;
      }
      case 'calculate_adaptive_portfolio':
        return adaptivePortfolio(scope, args);
      case 'simulate_stress_test': {
        const input = SimulateStressTestInput.parse(args);
        const snapshot = input.asOf ? await analytics.snapshotAt(input.asOf) : await analytics.latestSnapshot();
        const constructed = await adaptivePortfolio(scope, {});
        return {
          asOf: snapshot.asOf,
          symbols: [...snapshot.symbols],
          volatilities: [...snapshot.volatilities],
          covariance: snapshot.covariance.map((row) => [...row]),
          window: { ...snapshot.window },
          scenarios: constructed.stressTestOutcomes,
          portfolioExpectedReturn: constructed.portfolioExpectedReturn,
          portfolioVolatility: constructed.portfolioVolatility,
        } satisfies StressTestResult;
      }
      case 'create_rebalance_proposal': {
        const input = OptimizePortfolioRequest.parse(args);
        return wealth.optimizePortfolio(scope.tenantId, scope.userId, input);
      }
      case 'execute_sandbox_trade': {
        const input = ExecuteTradeRequest.parse(args);
        return wealth.executeTrade(scope.tenantId, scope.userId, input);
      }
    }
  }

  return {
    definitions: ADVISORY_TOOL_NAMES.map((name) => ({
      name,
      description: ADVISORY_TOOL_DESCRIPTIONS[name],
      tier: ADVISORY_TOOL_TIERS[name],
      inputSchema: ADVISORY_TOOL_INPUTS[name],
    })),
    canInvoke,
    async dispatch(tool: string, scope: ToolScope, args: unknown, grantedTier: PermissionTier): Promise<any> {
      if (!isAdvisoryToolName(tool)) throw AdvisoryErrors.unknownTool(tool);
      requireTier(tool, grantedTier);
      return invoke(tool, scope, args);
    },
  };
}
