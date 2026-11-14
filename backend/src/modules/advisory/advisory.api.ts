import type { AdvisoryChatRequest, AdvisoryChatResponse } from '@wealth-advisor/contracts';
import { mapScoreToRiskTier, type LlmProvider } from '@wealth-advisor/rules';
import type { AnalyticsApi } from '../analytics/public.ts';
import type { FinanceApi } from '../finance/public.ts';
import type { MarketApi } from '../market/public.ts';
import type { WealthApi } from '../wealth/public.ts';
import { AdvisoryErrors } from './domain/errors/advisory-errors.ts';
import {
  createAgentOrchestrator,
  type OrchestratorBudgetConfig,
  type OrchestratorExecutionResult,
  type PlannedToolStep,
} from './domain/agent-orchestrator.ts';
import { LlmGateway } from './domain/llm-gateway.ts';
import { sanitizeUntrustedInput } from './domain/prompt-guard.ts';
import { createToolRegistry } from './domain/tool-registry.ts';

export interface AdvisoryApiDeps {
  finance: FinanceApi;
  wealth: WealthApi;
  market: MarketApi;
  analytics: AnalyticsApi;
  gateway: LlmGateway;
  getActiveProvider?: () => Promise<LlmProvider>;
}

export function createAdvisoryApi(deps: AdvisoryApiDeps) {
  const { finance, wealth, market, analytics, gateway, getActiveProvider } = deps;
  const tools = createToolRegistry({ finance, wealth, market, analytics });
  const orchestrator = createAgentOrchestrator({ tools, wealth, gateway });

  return {
    async orchestrate(
      tenantId: string,
      userId: string,
      input: AdvisoryChatRequest,
      options?: {
        readonly provider?: LlmProvider;
        readonly plannedSteps?: readonly PlannedToolStep[];
        readonly budget?: Partial<OrchestratorBudgetConfig>;
      },
    ): Promise<OrchestratorExecutionResult> {
      let provider: LlmProvider = options?.provider ?? 'mock';
      if (!options?.provider && getActiveProvider) {
        try {
          provider = await getActiveProvider();
        } catch {
          throw AdvisoryErrors.gatewayUnavailable('active provider could not be determined');
        }
      }
      return orchestrator.run({
        scope: { tenantId, userId },
        input,
        provider,
        plannedSteps: options?.plannedSteps,
        budget: options?.budget,
      });
    },

    async chat(tenantId: string, userId: string, input: AdvisoryChatRequest): Promise<AdvisoryChatResponse> {
      const householdMode = input.householdMode;
      const locale = input.locale ?? 'en';
      const sanitized = sanitizeUntrustedInput(input.message);

      // Deterministic calculation shield: the cashflow and portfolio tools resolve from stored data
      // through the tier-enforced registry; their numbers reach the model as structured fields only.
      const scope = { tenantId, userId };
      const cashflow = await tools.dispatch('get_cashflow_and_runway', scope, { householdMode }, 'TIER_1_ADVISORY');
      const portfolio = await wealth.getPortfolio(tenantId, userId);

      // The model narrates engine output only: optimizer holdings at the portfolio risk tier
      // travel with the prompt so the PROPOSAL card carries stocks, bonds and ETFs together.
      // An optimizer failure is surfaced as a NOTICE card, never silent empty holdings.
      const proposal = await tools
        .dispatch(
          'calculate_adaptive_portfolio',
          scope,
          { riskTier: mapScoreToRiskTier(portfolio.effectiveRiskScore) },
          'TIER_1_ADVISORY',
        )
        .catch((err) => {
          console.warn('[advisory] constructPortfolio failed, continuing with a NOTICE card', err);
          return null;
        });

      // A failing settings read (admin database unavailable) is a gateway failure, not a crash.
      let provider: LlmProvider = 'mock';
      if (getActiveProvider) {
        try {
          provider = await getActiveProvider();
        } catch {
          throw AdvisoryErrors.gatewayUnavailable('active provider could not be determined');
        }
      }

      const res = await gateway.chat(provider, {
        message: sanitized.sanitizedText,
        locale,
        householdMode,
        cashflow,
        portfolio,
        proposalHoldings: proposal?.holdings ?? [],
      });
      if (proposal !== null) return res;
      return {
        ...res,
        actionCards: [
          ...res.actionCards,
          {
            cardType: 'NOTICE' as const,
            payload: {
              code: 'PROPOSAL_UNAVAILABLE',
              message: 'The optimizer could not build a proposal for this portfolio; allocations below are unavailable.',
            },
          },
        ],
      };
    },
  };
}

export type AdvisoryApi = ReturnType<typeof createAdvisoryApi>;
