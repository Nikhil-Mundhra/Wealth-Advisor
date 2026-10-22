import type { AdvisoryChatRequest, AdvisoryChatResponse } from '@wealth-advisor/contracts';
import { mapScoreToRiskTier, type LlmProvider } from '@wealth-advisor/rules';
import type { FinanceApi } from '../finance/public.ts';
import type { WealthApi } from '../wealth/public.ts';
import { AdvisoryErrors } from './domain/errors/advisory-errors.ts';
import { LlmGateway } from './domain/llm-gateway.ts';

export interface AdvisoryApiDeps {
  finance: FinanceApi;
  wealth: WealthApi;
  gateway: LlmGateway;
  getActiveProvider?: () => Promise<LlmProvider>;
}

export function createAdvisoryApi(deps: AdvisoryApiDeps) {
  const { finance, wealth, gateway, getActiveProvider } = deps;

  return {
    async chat(tenantId: string, userId: string, input: AdvisoryChatRequest): Promise<AdvisoryChatResponse> {
      const householdMode = input.householdMode;
      const locale = input.locale ?? 'en';

      // Deterministic calculation shield: aggregate cashflow & portfolio before prompting model
      const cashflow = await finance.getCashflowSummary(tenantId, userId, householdMode);
      const portfolio = await wealth.getPortfolio(tenantId, userId);

      // The model narrates engine output only: optimizer holdings at the portfolio risk tier
      // travel with the prompt so the PROPOSAL card carries stocks, bonds and ETFs together.
      // An optimizer failure is surfaced as a NOTICE card, never silent empty holdings.
      const proposal = await wealth
        .constructPortfolio(tenantId, userId, { riskTier: mapScoreToRiskTier(portfolio.effectiveRiskScore) })
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
        message: input.message,
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
