import type {
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

    const replies: Record<Locale, string> = {
      en: `Based on your ${isFamily ? 'family household' : 'individual'} profile, your current liquid runway stands at ${burnMonths} months. Because you maintain cross-border remittance commitments to East Asia, our deterministic optimizer recommends rebalancing 20% of your US equity holdings into high-yield sovereign bonds and short-term EUR liquidity buffers to absorb FX currency fluctuations.`,
      'zh-CN': `根据您的${isFamily ? '家庭' : '个人'}财务规划，当前流动资金储备周期为 ${burnMonths} 个月。鉴于您需要定期向东亚进行跨境汇款，我们的确定性计算引擎建议将 20% 的美股资产再平衡至短期欧元流动性与政府债券，以抵御汇率波动风险。`,
      'zh-HK': `根據您的${isFamily ? '家庭' : '個人'}財務規劃，當前流動資金儲備週期為 ${burnMonths} 個月。鑑於您需要定期向東亞進行跨境匯款，我們的確定性計算引擎建議將 20% 的美股資產再平衡至短期歐元流動性與政府債券，以抵御匯率波動風險。`,
      de: `Basierend auf Ihrem ${isFamily ? 'Familienhaushalt' : 'Einzelhaushalt'} beträgt Ihre liquide Notfallreserve ${burnMonths} Monate. Angesichts Ihrer regelmäßigen Auslandsüberweisungen nach Ostasien empfiehlt unser finanzmathematischer Optimierer, 20 % Ihrer US-Aktien in kurzfristige EUR-Liquidität und Staatsanleihen umzuschichten.`,
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
        personalFinance: `Monthly net burn is €${(cashflow.netCashflowBase / 100).toFixed(0)}. Family buffer is restored from ${burnMonths} to 6.2 months.`,
        crossBorder: 'Shields EUR/CNY and GBP/SGD family remittance obligations against currency volatility.',
        wealthStrategy: 'Shifts portfolio from 60% equities down to 40% target weight to match recalibrated risk tolerance.',
      },
      'zh-CN': {
        personalFinance: `每月净现金流为 €${(cashflow.netCashflowBase / 100).toFixed(0)}。家庭流动资金储备从 ${burnMonths} 个月恢复至 6.2 个月。`,
        crossBorder: '防范欧元/人民币与英镑/新币汇率下行风险，保障家庭定期汇款安全。',
        wealthStrategy: '将股票仓位由 60% 动态下调至 40%，与当前风险承受能力精准匹配。',
      },
      'zh-HK': {
        personalFinance: `每月淨現金流為 €${(cashflow.netCashflowBase / 100).toFixed(0)}。家庭流動資金儲備從 ${burnMonths} 個月恢復至 6.2 個月。`,
        crossBorder: '防範歐元/人民幣與英鎊/新幣匯率下行風險，保障家庭定期匯款安全。',
        wealthStrategy: '將股票倉位由 60% 動態下調至 40%，與當前風險承受能力精準匹配。',
      },
      de: {
        personalFinance: `Monatlicher Netto-Cashflow beträgt €${(cashflow.netCashflowBase / 100).toFixed(0)}. Haushaltsreserve wird auf über 6 Monate aufgestockt.`,
        crossBorder: 'Absicherung von EUR/CNY- und GBP/SGD-Überweisungskorridoren gegen Währungsschwankungen.',
        wealthStrategy: 'Aktienquote wird von 60 % auf 40 % gesenkt, um das Risikoprofil auszugleichen.',
      },
    };

    return {
      reply: replies[locale] ?? replies.en,
      threePillarRationale: rationales[locale] ?? rationales.en,
      actionCards: [
        {
          cardType: 'PROPOSAL',
          payload: {
            currentWeights: { 'CSPX.LSE': 0.6, 'IEAC.LSE': 0.25, 'XEON.XETRA': 0.15 },
            targetWeights: { 'CSPX.LSE': 0.4, 'IEAC.LSE': 0.35, 'XEON.XETRA': 0.25 },
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
      ],
      complianceDisclaimer: disclaimers[locale] ?? disclaimers.en,
    };
  }
}

export class LlmGateway {
  private readonly adapters: Record<LlmProvider, LlmAdapter>;

  constructor() {
    this.adapters = {
      mock: new MockLlmAdapter(),
      gemini: new MockLlmAdapter(),
      claude: new MockLlmAdapter(),
      openai: new MockLlmAdapter(),
    };
  }

  async chat(provider: LlmProvider, context: LlmContext): Promise<AdvisoryChatResponse> {
    const adapter = this.adapters[provider] ?? this.adapters.mock;
    return adapter.chat(context);
  }
}
