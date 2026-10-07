import type {
  ActionCardDto,
  AdvisoryChatResponse,
  CashflowSummaryResponse,
  PortfolioResponse,
} from '@wealth-advisor/contracts';
import type { HouseholdMode, LlmProvider, Locale } from '@wealth-advisor/rules';

export interface LlmContext {
  message: string;
  locale: Locale;
  householdMode: HouseholdMode;
  cashflow: CashflowSummaryResponse;
  portfolio: PortfolioResponse;
}

export interface LlmAdapter {
  chat(context: LlmContext): Promise<AdvisoryChatResponse>;
}

export class MockLlmAdapter implements LlmAdapter {
  async chat(context: LlmContext): Promise<AdvisoryChatResponse> {
    const { locale, householdMode, cashflow, portfolio } = context;

    const burnMonths = cashflow.runwayMonths;
    const isFamily = householdMode === 'FAMILY_HOUSEHOLD';

    // Find key asset allocations dynamically
    const currentWeights: Record<string, number> = {};
    const targetWeights: Record<string, number> = {};
    let equityWeight = 0;
    let targetEquityWeight = 0;
    let topHoldingSymbol = 'CSPX.LSE';
    let maxWeight = 0;

    for (const h of portfolio.holdings) {
      currentWeights[h.assetSymbol] = h.currentWeight;
      targetWeights[h.assetSymbol] = h.targetWeight;
      if (h.assetClass === 'EQUITY_GLOBAL' || h.assetClass === 'EQUITY_US') {
        equityWeight += h.currentWeight;
        targetEquityWeight += h.targetWeight;
      }
      if (h.currentWeight > maxWeight) {
        maxWeight = h.currentWeight;
        topHoldingSymbol = h.assetSymbol;
      }
    }

    const hasHoldings = Object.keys(currentWeights).length > 0;
    const equityPct = Math.round((equityWeight || 0.6) * 100);
    const targetEquityPct = Math.round((targetEquityWeight || 0.4) * 100);
    const targetRunway = isFamily ? 6.0 : 3.0;

    const replies: Record<Locale, string> = {
      en: `Based on your ${isFamily ? 'family household' : 'individual'} profile, your current liquid runway stands at ${burnMonths.toFixed(1)} months. Because you maintain cross-border remittance commitments to East Asia, our deterministic optimizer recommends rebalancing ${equityPct > targetEquityPct ? `${equityPct - targetEquityPct}% of your equities (principally ${topHoldingSymbol})` : 'your portfolio allocations'} into high-yield sovereign bonds and short-term EUR liquidity buffers to absorb FX currency fluctuations.`,
      'zh-CN': `根据您的${isFamily ? '家庭' : '个人'}财务规划，当前流动资金储备周期为 ${burnMonths.toFixed(1)} 个月。鉴于您需要定期向东亚进行跨境汇款，我们的确定性计算引擎建议将股票资产（尤其是 ${topHoldingSymbol}）再平衡至短期欧元流动性与政府债券，以抵御汇率波动风险。`,
      'zh-HK': `根據您的${isFamily ? '家庭' : '個人'}財務規劃，當前流動資金儲備週期為 ${burnMonths.toFixed(1)} 個月。鑑於您需要定期向東亞進行跨境匯款，我們的確定性計算引擎建議將股票資產（尤其是 ${topHoldingSymbol}）再平衡至短期歐元流動性與政府債券，以抵御匯率波動風險。`,
      de: `Basierend auf Ihrem ${isFamily ? 'Familienhaushalt' : 'Einzelhaushalt'} beträgt Ihre liquide Notfallreserve ${burnMonths.toFixed(1)} Monate. Angesichts Ihrer regelmäßigen Auslandsüberweisungen nach Ostasien empfiehlt unser finanzmathematischer Optimierer, Teile Ihrer Aktien (${topHoldingSymbol}) in kurzfristige EUR-Liquidität und Staatsanleihen umzuschichten.`,
    };

    const disclaimers: Record<Locale, string> = {
      en: 'DEWA operates under sandbox advisory mode. Recommendations are deterministic simulations and do not constitute formal investment solicitation.',
      'zh-CN': 'DEWA 运行于沙盒顾问模式。所有策略均为确定性算法推演，不构成正式投资要约。',
      'zh-HK': 'DEWA 運行於沙盒顧問模式。所有策略均為確定性演算法推演，不構成正式投資要約。',
      de: 'DEWA agiert im Sandbox-Beratungsmodus. Empfehlungen sind mathematische Simulationen und stellen keine Anlageberatung dar.',
    };

    const rationales: Record<
      Locale,
      { personalFinance: string; crossBorder: string; wealthStrategy: string }
    > = {
      en: {
        personalFinance: `Monthly net burn is €${(cashflow.netCashflowBase / 100).toFixed(0)}. Family buffer is restored from ${burnMonths.toFixed(1)} to ${targetRunway.toFixed(1)} months.`,
        crossBorder: 'Shields EUR/CNY and GBP/SGD family remittance obligations against currency volatility.',
        wealthStrategy: `Shifts portfolio from ${equityPct}% equities down to ${targetEquityPct}% target weight to match recalibrated risk tolerance.`,
      },
      'zh-CN': {
        personalFinance: `每月净现金流为 €${(cashflow.netCashflowBase / 100).toFixed(0)}。家庭流动资金储备从 ${burnMonths.toFixed(1)} 个月恢复至 ${targetRunway.toFixed(1)} 个月。`,
        crossBorder: '防范欧元/人民币与英镑/新币汇率下行风险，保障家庭定期汇款安全。',
        wealthStrategy: `将股票仓位由 ${equityPct}% 动态下调至 ${targetEquityPct}%，与当前风险承受能力精准匹配。`,
      },
      'zh-HK': {
        personalFinance: `每月淨現金流為 €${(cashflow.netCashflowBase / 100).toFixed(0)}。家庭流動資金儲備從 ${burnMonths.toFixed(1)} 個月恢復至 ${targetRunway.toFixed(1)} 個月。`,
        crossBorder: '防範歐元/人民幣與英鎊/新幣匯率下行風險，保障家庭定期匯款安全。',
        wealthStrategy: `將股票倉位由 ${equityPct}% 動態下調至 ${targetEquityPct}%，與當前風險承受能力精準匹配。`,
      },
      de: {
        personalFinance: `Monatlicher Netto-Cashflow beträgt €${(cashflow.netCashflowBase / 100).toFixed(0)}. Haushaltsreserve wird von ${burnMonths.toFixed(1)} auf ${targetRunway.toFixed(1)} Monate aufgestockt.`,
        crossBorder: 'Absicherung von EUR/CNY- und GBP/SGD-Überweisungskorridoren gegen Währungsschwankungen.',
        wealthStrategy: `Aktienquote wird von ${equityPct} % auf ${targetEquityPct} % gesenkt, um das Risikoprofil auszugleichen.`,
      },
    };

    const actionCards: ActionCardDto[] = [
      {
        cardType: 'PROPOSAL',
        payload: {
          currentWeights: hasHoldings
            ? currentWeights
            : { 'CSPX.LSE': 0.6, 'IEAC.LSE': 0.25, 'XEON.XETRA': 0.15 },
          targetWeights: hasHoldings
            ? targetWeights
            : { 'CSPX.LSE': 0.4, 'IEAC.LSE': 0.35, 'XEON.XETRA': 0.25 },
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

export class GeminiLlmAdapter implements LlmAdapter {
  private readonly apiKey: string | undefined;
  private readonly fallback: LlmAdapter;

  constructor(apiKey?: string, fallback: LlmAdapter = new MockLlmAdapter()) {
    this.apiKey = apiKey;
    this.fallback = fallback;
  }

  async chat(context: LlmContext): Promise<AdvisoryChatResponse> {
    if (!this.apiKey) return this.fallback.chat(context);
    try {
      const base = await this.fallback.chat(context);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const systemPrompt = `You are a cross-border expat private wealth and cashflow advisory assistant for DEWA.
Current Portfolio:
- Valuation: €${(context.portfolio.totalValuationBase / 100).toFixed(0)}
- Runway: ${context.cashflow.runwayMonths.toFixed(1)} months (${context.cashflow.runwayBand})
- Net Cashflow: €${(context.cashflow.netCashflowBase / 100).toFixed(0)}
- Household Mode: ${context.householdMode}
- Preferred Locale: ${context.locale}

Respond ONLY in valid JSON with these keys:
{
  "reply": "Clear, professional advisory message addressing the user",
  "personalFinance": "One sentence summary on runway, cashflow, and emergency buffer",
  "crossBorder": "One sentence on currency corridors, remittance obligations, and FX risk",
  "wealthStrategy": "One sentence on portfolio weights and asset reallocation"
}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Question: ${context.message}` }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) return base;
      const data = (await response.json()) as any;
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return base;

      const parsed = JSON.parse(rawText);
      return {
        ...base,
        reply: typeof parsed.reply === 'string' && parsed.reply ? parsed.reply : base.reply,
        threePillarRationale: {
          personalFinance:
            typeof parsed.personalFinance === 'string' && parsed.personalFinance
              ? parsed.personalFinance
              : base.threePillarRationale.personalFinance,
          crossBorder:
            typeof parsed.crossBorder === 'string' && parsed.crossBorder
              ? parsed.crossBorder
              : base.threePillarRationale.crossBorder,
          wealthStrategy:
            typeof parsed.wealthStrategy === 'string' && parsed.wealthStrategy
              ? parsed.wealthStrategy
              : base.threePillarRationale.wealthStrategy,
        },
      };
    } catch {
      return this.fallback.chat(context);
    }
  }
}

export class OpenAiLlmAdapter implements LlmAdapter {
  private readonly apiKey: string | undefined;
  private readonly fallback: LlmAdapter;

  constructor(apiKey?: string, fallback: LlmAdapter = new MockLlmAdapter()) {
    this.apiKey = apiKey;
    this.fallback = fallback;
  }

  async chat(context: LlmContext): Promise<AdvisoryChatResponse> {
    if (!this.apiKey) return this.fallback.chat(context);
    try {
      const base = await this.fallback.chat(context);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expat wealth advisor for DEWA. Runway: ${context.cashflow.runwayMonths} months. Portfolio: €${(context.portfolio.totalValuationBase / 100).toFixed(0)}. Respond in JSON with "reply", "personalFinance", "crossBorder", and "wealthStrategy".`,
            },
            { role: 'user', content: context.message },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });
      if (!response.ok) return base;
      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return base;
      const parsed = JSON.parse(content);
      return {
        ...base,
        reply: parsed.reply || base.reply,
        threePillarRationale: {
          personalFinance: parsed.personalFinance || base.threePillarRationale.personalFinance,
          crossBorder: parsed.crossBorder || base.threePillarRationale.crossBorder,
          wealthStrategy: parsed.wealthStrategy || base.threePillarRationale.wealthStrategy,
        },
      };
    } catch {
      return this.fallback.chat(context);
    }
  }
}

export interface LlmGatewayConfig {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

export class LlmGateway {
  private readonly adapters: Record<LlmProvider, LlmAdapter>;

  constructor(config?: LlmGatewayConfig | string) {
    const geminiKey = typeof config === 'string' ? config : config?.geminiApiKey;
    const openaiKey = typeof config === 'object' ? config.openaiApiKey : undefined;

    const mock = new MockLlmAdapter();
    this.adapters = {
      mock,
      gemini: new GeminiLlmAdapter(geminiKey, mock),
      claude: mock, // Claude gracefully falls back to deterministic mock until SDK wiring
      openai: new OpenAiLlmAdapter(openaiKey, mock),
    };
  }

  async chat(provider: LlmProvider, context: LlmContext): Promise<AdvisoryChatResponse> {
    const adapter = this.adapters[provider] ?? this.adapters.mock;
    return adapter.chat(context);
  }
}
