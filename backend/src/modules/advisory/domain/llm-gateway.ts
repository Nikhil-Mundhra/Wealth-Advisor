import type {
  ActionCardDto,
  AdvisoryChatResponse,
  AllocatedHoldingDto,
  CashflowSummaryResponse,
  PortfolioResponse,
} from '@wealth-advisor/contracts';
import type { HouseholdMode, LlmProvider, Locale } from '@wealth-advisor/rules';
import { type HttpClient, createHttpClient } from '#core/http-client/http-client.ts';
import { AdvisoryErrors } from './errors/advisory-errors.ts';
import { factNumbers, shieldText } from './calculation-shield.ts';

export interface LlmContext {
  message: string;
  locale: Locale;
  householdMode: HouseholdMode;
  cashflow: CashflowSummaryResponse;
  portfolio: PortfolioResponse;
  proposalHoldings: AllocatedHoldingDto[];
}

export interface LlmAdapter {
  chat(context: LlmContext): Promise<AdvisoryChatResponse>;
}

// Optimizer target mix by security type, shared by the mock reply and the live-model prompts.
export function summarizeProposal(holdings: readonly { symbol: string; securityType: string; weight: number }[]): {
  stockPct: number;
  bondPct: number;
  etfPct: number;
  topSymbol: string;
  topWeightPct: number;
} {
  const weightOf = (securityType: string) =>
    holdings.filter((h) => h.securityType === securityType).reduce((sum, h) => sum + h.weight, 0);
  const stockPct = Math.round(weightOf('STOCK') * 100);
  const bondPct = Math.round(weightOf('BOND') * 100);
  const top = [...holdings].sort((a, b) => b.weight - a.weight)[0];
  return {
    stockPct,
    bondPct,
    etfPct: Math.min(100, Math.max(0, 100 - stockPct - bondPct)), // derived so the three shares always sum to 100
    topSymbol: top?.symbol ?? 'CSPX.LSE',
    topWeightPct: top ? Math.round(top.weight * 100) : 0,
  };
}

export class MockLlmAdapter implements LlmAdapter {
  async chat(context: LlmContext): Promise<AdvisoryChatResponse> {
    const { locale, householdMode, cashflow, portfolio, proposalHoldings } = context;

    const burnMonths = cashflow.runwayMonths;
    const isFamily = householdMode === 'FAMILY_HOUSEHOLD';

    // Find key asset allocations dynamically
    const currentWeights: Record<string, number> = {};
    let equityWeight = 0;
    let targetEquityWeight = 0;
    // The proposal top holding is the single source: the optimizer mix, not the legacy sleeves.
    const { stockPct, bondPct, etfPct, topSymbol: topHoldingSymbol } = summarizeProposal(proposalHoldings);

    for (const h of portfolio.holdings) {
      currentWeights[h.assetSymbol] = h.currentWeight;
      if (h.assetClass.startsWith('EQUITY')) {
        equityWeight += h.currentWeight;
        targetEquityWeight += h.targetWeight;
      }
    }

    // Optimizer targets by security type; the proposal card carries the full per-holding mix.
    const proposalTargets: Record<string, number> = {};
    for (const h of proposalHoldings) proposalTargets[h.symbol] = h.weight;

    const hasHoldings = Object.keys(currentWeights).length > 0;
    const equityPct = hasHoldings ? Math.round(equityWeight * 100) : 60;
    const targetEquityPct = hasHoldings ? Math.round(targetEquityWeight * 100) : 40;
    const targetRunway = isFamily ? 6.0 : 3.0;
    const mixLine: Record<Locale, string> =
      proposalHoldings.length > 0
        ? {
            en: ` Optimizer targets across ${proposalHoldings.length} holdings: ${stockPct}% stocks, ${bondPct}% bonds, ${etfPct}% ETFs.`,
            'zh-CN': `优化器在${proposalHoldings.length}项持仓中配置：股票${stockPct}%、债券${bondPct}%、ETF${etfPct}%。`,
            'zh-HK': `優化器在${proposalHoldings.length}項持倉中配置：股票${stockPct}%、債券${bondPct}%、ETF${etfPct}%。`,
            de: ` Das Optimierungsziel über ${proposalHoldings.length} Positionen: ${stockPct} % Aktien, ${bondPct} % Anleihen, ${etfPct} % ETFs.`,
          }
        : { en: '', 'zh-CN': '', 'zh-HK': '', de: '' };

    const replies: Record<Locale, string> = {
      en: `Based on your ${isFamily ? 'family household' : 'individual'} profile, your current liquid runway stands at ${burnMonths.toFixed(1)} months. Because you maintain cross-border remittance commitments to East Asia, our deterministic optimizer recommends rebalancing ${equityPct > targetEquityPct ? `${equityPct - targetEquityPct}% of your equities (principally ${topHoldingSymbol})` : 'your portfolio allocations'} into high-yield sovereign bonds and short-term EUR liquidity buffers to absorb FX currency fluctuations.${mixLine.en}`,
      'zh-CN': `根据您的${isFamily ? '家庭' : '个人'}财务规划，当前流动资金储备周期为 ${burnMonths.toFixed(1)} 个月。鉴于您需要定期向东亚进行跨境汇款，我们的确定性计算引擎建议将股票资产（尤其是 ${topHoldingSymbol}）再平衡至短期欧元流动性与高收益主权债券，以抵御汇率波动风险。${mixLine['zh-CN']}`,
      'zh-HK': `根據您的${isFamily ? '家庭' : '個人'}財務規劃，當前流動資金儲備週期為 ${burnMonths.toFixed(1)} 個月。鑑於您需要定期向東亞進行跨境匯款，我們的確定性計算引擎建議將股票資產（尤其是 ${topHoldingSymbol}）再平衡至短期歐元流動性與高收益主權債券，以抵禦匯率波動風險。${mixLine['zh-HK']}`,
      de: `Basierend auf Ihrem ${isFamily ? 'Familienhaushalt' : 'Einzelhaushalt'} beträgt Ihre liquide Notfallreserve ${burnMonths.toFixed(1)} Monate. Angesichts Ihrer regelmäßigen Auslandsüberweisungen nach Ostasien empfiehlt unser finanzmathematischer Optimierer, Teile Ihrer Aktien (${topHoldingSymbol}) in kurzfristige EUR-Liquidität und Staatsanleihen umzuschichten.${mixLine.de}`,
    };

    const disclaimers: Record<Locale, string> = {
      en: 'Syntropy AI operates under advisor sandbox mode. Recommendations are deterministic simulations and do not constitute formal investment solicitation.',
      'zh-CN': 'Syntropy AI 运行于沙盒顾问模式。所有策略均为确定性算法推演，不构成正式投资要约。',
      'zh-HK': 'Syntropy AI 運行於沙盒顧問模式。所有策略均為確定性演算法推演，不構成正式投資要約。',
      de: 'Syntropy AI agiert im Berater-Sandbox-Modus. Empfehlungen sind mathematische Simulationen und stellen keine Anlageberatung dar.',
    };

    const rationales: Record<
      Locale,
      { personalFinance: string; crossBorder: string; wealthStrategy: string }
    > = {
      en: {
        personalFinance: `Monthly net burn is €${(cashflow.netCashflowBase / 100).toFixed(0)}. Family buffer is restored from ${burnMonths.toFixed(1)} to ${targetRunway.toFixed(1)} months.`,
        crossBorder: 'Shields EUR/CNY and GBP/SGD family remittance obligations against currency volatility.',
        wealthStrategy: `Shifts portfolio from ${equityPct}% equities down to ${targetEquityPct}% target weight to match recalibrated risk tolerance.${mixLine.en}`,
      },
      'zh-CN': {
        personalFinance: `每月净现金流为 €${(cashflow.netCashflowBase / 100).toFixed(0)}。家庭流动资金储备从 ${burnMonths.toFixed(1)} 个月恢复至 ${targetRunway.toFixed(1)} 个月。`,
        crossBorder: '防范欧元/人民币与英镑/新币汇率下行风险，保障家庭定期汇款安全。',
        wealthStrategy: `将股票仓位由 ${equityPct}% 动态下调至 ${targetEquityPct}%，与当前风险承受能力精准匹配。${mixLine['zh-CN']}`,
      },
      'zh-HK': {
        personalFinance: `每月淨現金流為 €${(cashflow.netCashflowBase / 100).toFixed(0)}。家庭流動資金儲備從 ${burnMonths.toFixed(1)} 個月恢復至 ${targetRunway.toFixed(1)} 個月。`,
        crossBorder: '防範歐元/人民幣與英鎊/新幣匯率下行風險，保障家庭定期匯款安全。',
        wealthStrategy: `將股票倉位由 ${equityPct}% 動態下調至 ${targetEquityPct}%，與當前風險承受能力精準匹配。${mixLine['zh-HK']}`,
      },
      de: {
        personalFinance: `Monatlicher Netto-Cashflow beträgt €${(cashflow.netCashflowBase / 100).toFixed(0)}. Haushaltsreserve wird von ${burnMonths.toFixed(1)} auf ${targetRunway.toFixed(1)} Monate aufgestockt.`,
        crossBorder: 'Absicherung von EUR/CNY- und GBP/SGD-Überweisungskorridoren gegen Währungsschwankungen.',
        wealthStrategy: `Aktienquote wird von ${equityPct} % auf ${targetEquityPct} % gesenkt, um das Risikoprofil auszugleichen.${mixLine.de}`,
      },
    };

    const actionCards: ActionCardDto[] = [
      {
        cardType: 'PROPOSAL',
        payload: {
          holdings: proposalHoldings.map((h) => ({
            symbol: h.symbol,
            name: h.name,
            securityType: h.securityType,
            assetClass: h.assetClass,
            weight: h.weight,
          })),
          currentWeights: hasHoldings ? currentWeights : {},
          targetWeights: proposalTargets, // holdings ARE the proposal; never the legacy sleeves
          valuationTotalBase: portfolio.totalValuationBase,
        },
      },
      {
        cardType: 'RUNWAY_ALERT',
        payload: {
          runwayMonths: burnMonths,
          householdMode,
          status: cashflow.runwayBand,
        },
      },
    ];

    return {
      reply: replies[locale] ?? replies.en,
      threePillarRationale: rationales[locale] ?? rationales.en,
      actionCards,
      complianceDisclaimer: disclaimers[locale] ?? disclaimers.en,
    };
  }
}

function parseJsonSafe(raw: string): Record<string, unknown> {
  const clean = raw.trim();
  try {
    return JSON.parse(clean);
  } catch {
    const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch?.[1]) {
      return JSON.parse(codeBlockMatch[1]);
    }
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch?.[0]) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Unable to extract valid JSON from model response');
  }
}

// The model replaces only the narrative fields, each only with text whose numbers the engines produced.
function narrate(base: AdvisoryChatResponse, parsed: Record<string, unknown>, prompt: string): AdvisoryChatResponse {
  const pillars = base.threePillarRationale;
  const facts = factNumbers(prompt, base.reply, pillars.personalFinance, pillars.crossBorder, pillars.wealthStrategy);
  return {
    ...base,
    reply: shieldText(parsed.reply, base.reply, facts),
    threePillarRationale: {
      personalFinance: shieldText(parsed.personalFinance, pillars.personalFinance, facts),
      crossBorder: shieldText(parsed.crossBorder, pillars.crossBorder, facts),
      wealthStrategy: shieldText(parsed.wealthStrategy, pillars.wealthStrategy, facts),
    },
  };
}

const ADVISORY_HTTP_TIMEOUT_MS = 25000;

export type ApiKeyResolver = string | (() => Promise<string | undefined> | string | undefined);

export class GeminiLlmAdapter implements LlmAdapter {
  private readonly apiKey: ApiKeyResolver | undefined;
  private readonly fallback: LlmAdapter;
  private readonly http: HttpClient;

  constructor(apiKey?: ApiKeyResolver, fallback: LlmAdapter = new MockLlmAdapter(), http: HttpClient = createHttpClient()) {
    this.apiKey = apiKey;
    this.fallback = fallback;
    this.http = http;
  }

  async chat(context: LlmContext): Promise<AdvisoryChatResponse> {
    const key = typeof this.apiKey === 'function' ? await this.apiKey() : this.apiKey;
    if (!key) throw AdvisoryErrors.gatewayUnavailable('Gemini API key is not configured');
    const base = await this.fallback.chat(context);
    const mix = summarizeProposal(context.proposalHoldings);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const systemPrompt = `You are a cross-border expat private wealth and cashflow advisory assistant for Syntropy AI.
Current Portfolio:
- Valuation: €${(context.portfolio.totalValuationBase / 100).toFixed(0)}
- Runway: ${context.cashflow.runwayMonths.toFixed(1)} months (${context.cashflow.runwayBand})
- Net Cashflow: €${(context.cashflow.netCashflowBase / 100).toFixed(0)}
- Household Mode: ${context.householdMode}
- Preferred Locale: ${context.locale}
- Optimizer Targets (${context.proposalHoldings.length} holdings): ${mix.stockPct}% stocks, ${mix.bondPct}% bonds, ${mix.etfPct}% ETFs; top holding ${mix.topSymbol} at ${mix.topWeightPct}%

Respond ONLY in valid JSON with these keys:
{
  "reply": "Clear, professional advisory message addressing the user",
  "personalFinance": "One sentence summary on runway, cashflow, and emergency buffer",
  "crossBorder": "One sentence on currency corridors, remittance obligations, and FX risk",
  "wealthStrategy": "One sentence on portfolio weights and asset reallocation"
}
Do not use numbered lists (such as 1., 2., 3.); use concise prose or unordered bullet points.`;

    let data: any;
    try {
      data = (await this.http.postJson(
        url,
        {
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Question: ${context.message}` }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        },
        { timeoutMs: ADVISORY_HTTP_TIMEOUT_MS },
      )) as any;
    } catch (err: unknown) {
      throw AdvisoryErrors.gatewayUnavailable(
        `Gemini request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw AdvisoryErrors.gatewayUnavailable('Gemini returned an empty completion');

    try {
      return narrate(base, JSON.parse(rawText) as Record<string, unknown>, systemPrompt);
    } catch (err: unknown) {
      throw AdvisoryErrors.gatewayUnavailable(
        `Gemini response could not be parsed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

export class OpenAiLlmAdapter implements LlmAdapter {
  private readonly apiKey: ApiKeyResolver | undefined;
  private readonly fallback: LlmAdapter;
  private readonly http: HttpClient;

  constructor(apiKey?: ApiKeyResolver, fallback: LlmAdapter = new MockLlmAdapter(), http: HttpClient = createHttpClient()) {
    this.apiKey = apiKey;
    this.fallback = fallback;
    this.http = http;
  }

  async chat(context: LlmContext): Promise<AdvisoryChatResponse> {
    const key = typeof this.apiKey === 'function' ? await this.apiKey() : this.apiKey;
    if (!key) throw AdvisoryErrors.gatewayUnavailable('OpenAI API key is not configured');
    const base = await this.fallback.chat(context);
    const mix = summarizeProposal(context.proposalHoldings);
    const systemPrompt = `You are an expat wealth advisor for Syntropy AI. Runway: ${context.cashflow.runwayMonths} months. Portfolio: €${(context.portfolio.totalValuationBase / 100).toFixed(0)}. Net Cashflow: €${(context.cashflow.netCashflowBase / 100).toFixed(0)}. Household Mode: ${context.householdMode}. Preferred Locale: ${context.locale}. Optimizer targets (${context.proposalHoldings.length} holdings): ${mix.stockPct}% stocks, ${mix.bondPct}% bonds, ${mix.etfPct}% ETFs; top holding ${mix.topSymbol} at ${mix.topWeightPct}%. Respond in JSON with "reply", "personalFinance", "crossBorder", and "wealthStrategy". Do not use numbered lists (such as 1., 2., 3.); use concise prose or unordered bullet points.`;

    let data: any;
    try {
      data = (await this.http.postJson(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            { role: 'user', content: context.message },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        },
        {
          timeoutMs: ADVISORY_HTTP_TIMEOUT_MS,
          headers: {
            authorization: `Bearer ${key}`,
          },
        },
      )) as any;
    } catch (err: unknown) {
      throw AdvisoryErrors.gatewayUnavailable(
        `OpenAI request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw AdvisoryErrors.gatewayUnavailable('OpenAI returned an empty completion');
    try {
      return narrate(base, JSON.parse(content) as Record<string, unknown>, systemPrompt);
    } catch (err: unknown) {
      throw AdvisoryErrors.gatewayUnavailable(
        `OpenAI response could not be parsed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

export class ClaudeLlmAdapter implements LlmAdapter {
  private readonly apiKey: ApiKeyResolver | undefined;
  private readonly fallback: LlmAdapter;
  private readonly http: HttpClient;

  constructor(apiKey?: ApiKeyResolver, fallback: LlmAdapter = new MockLlmAdapter(), http: HttpClient = createHttpClient()) {
    this.apiKey = apiKey;
    this.fallback = fallback;
    this.http = http;
  }

  async chat(context: LlmContext): Promise<AdvisoryChatResponse> {
    const key = typeof this.apiKey === 'function' ? await this.apiKey() : this.apiKey;
    if (!key) throw AdvisoryErrors.gatewayUnavailable('Anthropic API key is not configured');
    const base = await this.fallback.chat(context);
    const systemPrompt = `You are an expat wealth advisor for Syntropy AI. Runway: ${context.cashflow.runwayMonths} months. Portfolio: €${(context.portfolio.totalValuationBase / 100).toFixed(0)}. Net Cashflow: €${(context.cashflow.netCashflowBase / 100).toFixed(0)}. Household Mode: ${context.householdMode}. Preferred Locale: ${context.locale}. Respond in JSON with "reply", "personalFinance", "crossBorder", and "wealthStrategy". Do not use numbered lists (such as 1., 2., 3.); use concise prose or unordered bullet points.`;

    let data: any;
    try {
      data = (await this.http.postJson(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: 'user', content: context.message }],
        },
        {
          timeoutMs: ADVISORY_HTTP_TIMEOUT_MS,
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
        },
      )) as any;
    } catch (err: unknown) {
      throw AdvisoryErrors.gatewayUnavailable(
        `Anthropic request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const block = (data?.content ?? []).find((part: any) => part?.type === 'text');
    if (!block?.text) throw AdvisoryErrors.gatewayUnavailable('Anthropic returned an empty completion');
    try {
      return narrate(base, JSON.parse(block.text) as Record<string, unknown>, systemPrompt);
    } catch (err: unknown) {
      throw AdvisoryErrors.gatewayUnavailable(
        `Anthropic response could not be parsed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

export class OpenRouterLlmAdapter implements LlmAdapter {
  private readonly apiKey: ApiKeyResolver | undefined;
  private readonly fallback: LlmAdapter;
  private readonly http: HttpClient;
  private readonly model: string;

  constructor(
    apiKey?: ApiKeyResolver,
    fallback: LlmAdapter = new MockLlmAdapter(),
    http: HttpClient = createHttpClient(),
    model: string = 'openrouter/free',
  ) {
    this.apiKey = apiKey;
    this.fallback = fallback;
    this.http = http;
    this.model = model;
  }

  async chat(context: LlmContext): Promise<AdvisoryChatResponse> {
    const key = typeof this.apiKey === 'function' ? await this.apiKey() : this.apiKey;
    if (!key) throw AdvisoryErrors.gatewayUnavailable('OpenRouter API key is not configured');
    const base = await this.fallback.chat(context);
    const mix = summarizeProposal(context.proposalHoldings);
    const systemPrompt = `You are a cross-border private wealth and cashflow advisor for Syntropy AI.
Client Financial Position:
- Liquid Runway: ${context.cashflow.runwayMonths.toFixed(1)} months (${context.cashflow.runwayBand})
- Net Monthly Burn / Outflow: €${(context.cashflow.netCashflowBase / 100).toFixed(0)}
- Total Portfolio Valuation: €${(context.portfolio.totalValuationBase / 100).toFixed(0)}
- Household Mode: ${context.householdMode}
- Preferred Locale: ${context.locale}
- Target Allocations (${context.proposalHoldings.length} holdings): ${mix.stockPct}% stocks, ${mix.bondPct}% bonds, ${mix.etfPct}% ETFs; top holding ${mix.topSymbol} at ${mix.topWeightPct}%

Instructions:
1. Directly answer the user's specific life event or question in "reply" with actionable, personalized fiduciary guidance.
2. Fiduciary Calculation Shield: If citing any numbers, figures, or percentages, strictly use ONLY the verified engine figures provided above (Runway: ${context.cashflow.runwayMonths.toFixed(1)}, Monthly Burn: €${(context.cashflow.netCashflowBase / 100).toFixed(0)}, Portfolio: €${(context.portfolio.totalValuationBase / 100).toFixed(0)}, Targets: ${mix.stockPct}%, ${mix.bondPct}%, ${mix.etfPct}%). Never invent new numbers, unverified percentages, or step numbers (such as 1., 2., 3.); explain spending cuts or rebalancing in descriptive prose.

Respond ONLY in valid JSON with these keys:
{
  "reply": "Direct, empathetic, personalized guidance answering the user inquiry",
  "personalFinance": "One sentence on liquid runway, monthly burn, and emergency buffer",
  "crossBorder": "One sentence on currency corridors and remittance obligations",
  "wealthStrategy": "One sentence on asset reallocation and portfolio safety"
}`;
    const fullPrompt = `${systemPrompt}\nUser Inquiry: ${context.message}`;

    const candidateModels = [
      this.model,
      'minimax/minimax-m3.1-flash:free',
      'google/gemma-4-26b-a4b-it:free',
      'openrouter/free',
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    let lastError: unknown = null;
    for (const modelToTry of candidateModels) {
      try {
        const data = (await this.http.postJson(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: modelToTry,
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              { role: 'user', content: context.message },
            ],
            temperature: 0.2,
          },
          {
            timeoutMs: 10000,
            headers: {
              authorization: `Bearer ${key}`,
              'http-referer': 'https://syntropy.finance',
              'x-title': 'Syntropy Wealth Advisor',
            },
          },
        )) as any;

        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return narrate(base, parseJsonSafe(content), fullPrompt);
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw AdvisoryErrors.gatewayUnavailable(
      `OpenRouter request failed across candidate models: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    );
  }
}

export interface LlmGatewayConfig {
  geminiApiKey?: ApiKeyResolver;
  openaiApiKey?: ApiKeyResolver;
  anthropicApiKey?: ApiKeyResolver;
  openrouterApiKey?: ApiKeyResolver;
  http?: HttpClient;
}

export class LlmGateway {
  private readonly adapters: Record<LlmProvider, LlmAdapter>;

  constructor(config?: LlmGatewayConfig | string) {
    const geminiKey = typeof config === 'string' ? config : config?.geminiApiKey;
    const openaiKey = typeof config === 'object' ? config.openaiApiKey : undefined;
    const anthropicKey = typeof config === 'object' ? config.anthropicApiKey : undefined;
    const openrouterKey = typeof config === 'object' ? config.openrouterApiKey : undefined;
    const http = (typeof config === 'object' ? config.http : undefined) ?? createHttpClient();

    const mock = new MockLlmAdapter();
    this.adapters = {
      mock,
      gemini: new GeminiLlmAdapter(geminiKey, mock, http),
      claude: new ClaudeLlmAdapter(anthropicKey, mock, http),
      openai: new OpenAiLlmAdapter(openaiKey, mock, http),
      openrouter: new OpenRouterLlmAdapter(openrouterKey, mock, http),
    };
  }

  async chat(provider: LlmProvider, context: LlmContext): Promise<AdvisoryChatResponse> {
    const adapter = this.adapters[provider] ?? this.adapters.mock;
    return adapter.chat(context);
  }
}
