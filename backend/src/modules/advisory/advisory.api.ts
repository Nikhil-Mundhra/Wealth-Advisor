import type { AdvisoryChatRequest, AdvisoryChatResponse } from '@wealth-advisor/contracts';
import { mapScoreToRiskTier, type LlmProvider } from '@wealth-advisor/rules';
import type { FinanceApi } from '../finance/public.ts';
import type { WealthApi } from '../wealth/public.ts';
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
      const proposal = await wealth
        .constructPortfolio(tenantId, userId, { riskTier: mapScoreToRiskTier(portfolio.effectiveRiskScore) })
        .catch(() => null);

      const provider = getActiveProvider ? await getActiveProvider() : 'mock';

      return gateway.chat(provider, {
        message: input.message,
        locale,
        householdMode,
        cashflow,
        portfolio,
        proposalHoldings: proposal?.holdings ?? [],
      });
    },
  };
}

export type AdvisoryApi = ReturnType<typeof createAdvisoryApi>;
