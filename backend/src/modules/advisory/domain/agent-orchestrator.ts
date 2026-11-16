import type { AdvisoryChatRequest, AdvisoryChatResponse, CashflowSummaryResponse, ConstructPortfolioResponse } from '@wealth-advisor/contracts';
import { mapScoreToRiskTier, type LlmProvider, type PermissionTier } from '@wealth-advisor/rules';
import { recordGuardrailTrigger, recordLlmUsage } from '#core/telemetry/metrics.ts';
import { withSpan } from '#core/telemetry/tracing.ts';
import type { WealthApi } from '../../wealth/public.ts';
import type { LlmContext, LlmGateway } from './llm-gateway.ts';
import { sanitizeUntrustedInput } from './prompt-guard.ts';
import type { AdvisoryToolName, ToolRegistry, ToolScope } from './tool-registry.ts';

export interface OrchestratorBudgetConfig {
  readonly maxSteps: number;
  readonly maxTokensBudget: number;
  readonly maxCostUsdMicros: number;
  readonly toolTimeoutMs: number;
  readonly modelTimeoutMs: number;
  readonly grantedTier: PermissionTier;
  readonly fallbackOnModelError: boolean;
}

export const DEFAULT_ORCHESTRATOR_BUDGET: OrchestratorBudgetConfig = {
  maxSteps: 4,
  maxTokensBudget: 4096,
  maxCostUsdMicros: 50000, // $0.05 per request hard ceiling
  toolTimeoutMs: 5000,
  modelTimeoutMs: 15000,
  grantedTier: 'TIER_1_ADVISORY',
  fallbackOnModelError: true,
};

export interface OrchestratorStepTrace {
  readonly stepIndex: number;
  readonly tool: AdvisoryToolName;
  readonly durationMs: number;
  readonly status: 'ok' | 'error' | 'timeout' | 'tier_refused' | 'budget_exhausted';
}

export interface OrchestratorTelemetry {
  readonly stepsExecuted: number;
  readonly maxSteps: number;
  readonly estimatedTokensUsed: number;
  readonly maxTokensBudget: number;
  readonly estimatedCostUsdMicros: number;
  readonly maxCostUsdMicros: number;
  readonly usedDeterministicFallback: boolean;
  readonly piiRedacted: boolean;
  readonly injectionDetected: boolean;
  readonly matchedInjectionPatterns: readonly string[];
  readonly toolTraces: readonly OrchestratorStepTrace[];
}

export interface OrchestratorExecutionResult {
  readonly response: AdvisoryChatResponse;
  readonly telemetry: OrchestratorTelemetry;
}

class CallTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} exceeded timeout (${timeoutMs}ms)`);
  }
}

async function withTimeout<T>(label: string, timeoutMs: number, fn: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new CallTimeoutError(label, timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

// Conservative cost model ($0.002 per 1K tokens = 2 micros per token)
function estimateCostMicros(tokens: number): number {
  return tokens * 2;
}

export interface AgentOrchestratorDeps {
  readonly tools: ToolRegistry;
  readonly wealth: WealthApi;
  readonly gateway: LlmGateway;
}

export interface PlannedToolStep {
  readonly tool: AdvisoryToolName;
  readonly args: unknown;
}

export function createAgentOrchestrator(deps: AgentOrchestratorDeps) {
  const { tools, wealth, gateway } = deps;

  return {
    async run(options: {
      readonly scope: ToolScope;
      readonly input: AdvisoryChatRequest;
      readonly provider: LlmProvider;
      readonly plannedSteps?: readonly PlannedToolStep[];
      readonly budget?: Partial<OrchestratorBudgetConfig>;
    }): Promise<OrchestratorExecutionResult> {
      const budget: OrchestratorBudgetConfig = { ...DEFAULT_ORCHESTRATOR_BUDGET, ...options.budget };
      const sanitized = sanitizeUntrustedInput(options.input.message);
      const householdMode = options.input.householdMode;
      const locale = options.input.locale ?? 'en';

      if (sanitized.piiRedacted) recordGuardrailTrigger('pii_redaction');
      if (sanitized.injectionDetected) recordGuardrailTrigger('prompt_injection');

      return withSpan(
        'agent.orchestrate',
        { 'llm.provider': options.provider, 'household.mode': householdMode },
        async () => {
          let estimatedTokensUsed = estimateTokens(sanitized.sanitizedText);
          let estimatedCostUsdMicros = estimateCostMicros(estimatedTokensUsed);

          const portfolio = await withTimeout('wealth.getPortfolio', budget.toolTimeoutMs, () =>
            wealth.getPortfolio(options.scope.tenantId, options.scope.userId),
          );

          const defaultPlan: PlannedToolStep[] = [
            { tool: 'get_cashflow_and_runway', args: { householdMode } },
            { tool: 'calculate_adaptive_portfolio', args: { riskTier: mapScoreToRiskTier(portfolio.effectiveRiskScore) } },
          ];
          const steps = options.plannedSteps ?? defaultPlan;

          let cashflow: CashflowSummaryResponse | null = null;
          let proposal: ConstructPortfolioResponse | null = null;
          const toolTraces: OrchestratorStepTrace[] = [];

          for (let idx = 0; idx < steps.length && idx < budget.maxSteps; idx += 1) {
            const step = steps[idx]!;
            if (estimatedTokensUsed >= budget.maxTokensBudget || estimatedCostUsdMicros >= budget.maxCostUsdMicros) {
              recordGuardrailTrigger('budget_exhausted');
              toolTraces.push({ stepIndex: idx, tool: step.tool, durationMs: 0, status: 'budget_exhausted' });
              break;
            }

            if (!tools.canInvoke(step.tool, budget.grantedTier)) {
              recordGuardrailTrigger('permission_tier_refusal');
              toolTraces.push({ stepIndex: idx, tool: step.tool, durationMs: 0, status: 'tier_refused' });
              continue;
            }

            const started = Date.now();
            try {
              const dispatched = await withSpan('tool.dispatch', { 'tool.name': step.tool }, () =>
                withTimeout(`tool:${step.tool}`, budget.toolTimeoutMs, async () => {
                  switch (step.tool) {
                    case 'get_cashflow_and_runway':
                      return { kind: 'cashflow' as const, value: await tools.dispatch('get_cashflow_and_runway', options.scope, step.args, budget.grantedTier) };
                    case 'get_currency_exposure':
                      return { kind: 'other' as const, value: await tools.dispatch('get_currency_exposure', options.scope, step.args, budget.grantedTier) };
                    case 'calculate_adaptive_portfolio':
                      return { kind: 'proposal' as const, value: await tools.dispatch('calculate_adaptive_portfolio', options.scope, step.args, budget.grantedTier) };
                    case 'simulate_stress_test':
                      return { kind: 'other' as const, value: await tools.dispatch('simulate_stress_test', options.scope, step.args, budget.grantedTier) };
                    case 'create_rebalance_proposal':
                      return { kind: 'other' as const, value: await tools.dispatch('create_rebalance_proposal', options.scope, step.args, budget.grantedTier) };
                    case 'execute_sandbox_trade':
                      return { kind: 'other' as const, value: await tools.dispatch('execute_sandbox_trade', options.scope, step.args, budget.grantedTier) };
                  }
                }),
              );
              if (dispatched.kind === 'cashflow') cashflow = dispatched.value;
              else if (dispatched.kind === 'proposal') proposal = dispatched.value;

              const payloadTokens = estimateTokens(JSON.stringify(dispatched.value));
              estimatedTokensUsed += payloadTokens;
              estimatedCostUsdMicros = estimateCostMicros(estimatedTokensUsed);

              toolTraces.push({ stepIndex: idx, tool: step.tool, durationMs: Date.now() - started, status: 'ok' });
            } catch (err) {
              const status = err instanceof CallTimeoutError ? 'timeout' : 'error';
              toolTraces.push({ stepIndex: idx, tool: step.tool, durationMs: Date.now() - started, status });
            }
          }

          if (!cashflow) {
            cashflow = await withSpan('tool.dispatch', { 'tool.name': 'get_cashflow_and_runway' }, () =>
              withTimeout('tool:get_cashflow_and_runway', budget.toolTimeoutMs, () =>
                tools.dispatch(
                  'get_cashflow_and_runway',
                  options.scope,
                  { householdMode },
                  budget.grantedTier,
                ),
              ),
            );
          }

          const llmContext: LlmContext = {
            message: sanitized.sanitizedText,
            locale,
            householdMode,
            cashflow,
            portfolio,
            proposalHoldings: proposal?.holdings ?? [],
          };

          let usedDeterministicFallback = false;
          let response: AdvisoryChatResponse;

          const overBudgetBeforeModel =
            estimatedTokensUsed >= budget.maxTokensBudget || estimatedCostUsdMicros >= budget.maxCostUsdMicros;

          if (overBudgetBeforeModel) {
            usedDeterministicFallback = true;
            recordGuardrailTrigger('deterministic_fallback');
            response = await withSpan('llm.generate', { 'llm.provider': 'mock', fallback: true }, () =>
              gateway.chat('mock', llmContext),
            );
          } else {
            try {
              response = await withSpan('llm.generate', { 'llm.provider': options.provider, fallback: false }, () =>
                withTimeout(`model:${options.provider}`, budget.modelTimeoutMs, () =>
                  gateway.chat(options.provider, llmContext),
                ),
              );
              const replyTokens = estimateTokens(response.reply);
              estimatedTokensUsed += replyTokens;
              estimatedCostUsdMicros = estimateCostMicros(estimatedTokensUsed);
            } catch (err) {
              if (!budget.fallbackOnModelError) {
                throw err;
              }
              usedDeterministicFallback = true;
              recordGuardrailTrigger('deterministic_fallback');
              response = await withSpan('llm.generate', { 'llm.provider': 'mock', fallback: true }, () =>
                gateway.chat('mock', llmContext),
              );
            }
          }

          recordLlmUsage(usedDeterministicFallback ? 'mock' : options.provider, estimatedTokensUsed, estimatedCostUsdMicros);

          const finalResponse: AdvisoryChatResponse =
            proposal !== null
              ? response
              : {
                  ...response,
                  actionCards: [
                    ...response.actionCards,
                    {
                      cardType: 'NOTICE',
                      payload: {
                        code: 'PROPOSAL_UNAVAILABLE',
                        message: 'The optimizer could not build a proposal for this portfolio; allocations below are unavailable.',
                      },
                    },
                  ],
                };

          return {
            response: finalResponse,
            telemetry: {
              stepsExecuted: toolTraces.length,
              maxSteps: budget.maxSteps,
              estimatedTokensUsed,
              maxTokensBudget: budget.maxTokensBudget,
              estimatedCostUsdMicros,
              maxCostUsdMicros: budget.maxCostUsdMicros,
              usedDeterministicFallback,
              piiRedacted: sanitized.piiRedacted,
              injectionDetected: sanitized.injectionDetected,
              matchedInjectionPatterns: sanitized.matchedPatterns,
              toolTraces,
            },
          };
        },
      );
    },
  };
}
