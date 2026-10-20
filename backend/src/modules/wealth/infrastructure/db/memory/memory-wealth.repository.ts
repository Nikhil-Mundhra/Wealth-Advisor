import { ObjectId } from 'mongodb';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID, toScopeId } from '#core/db/document-id.ts';
import type {
  AssetProductRepository,
  PortfolioRepository,
  RiskProfileRepository,
  SandboxLedgerRepository,
} from '../../../application/ports.ts';
import type { AssetProductDocument } from '../documents/asset-product.document.ts';
import type { PortfolioDocument } from '../documents/portfolio.document.ts';
import type { RiskProfileDocument } from '../documents/risk-profile.document.ts';
import type { SandboxLedgerDocument } from '../documents/sandbox-ledger.document.ts';

export class MemoryAssetProductRepository implements AssetProductRepository {
  private readonly products = new Map<string, AssetProductDocument>();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const now = new Date();
    const items: Omit<AssetProductDocument, '_id'>[] = [
      {
        symbol: 'CSPX.LSE',
        name: 'iShares Core S&P 500 UCITS ETF',
        assetClass: 'EQUITY_US',
        securityType: 'MUTUAL_FUND_ETF',
        denominationCurrency: 'USD',
        riskRating: 7,
        expenseRatio: 0.0007,
        annualizedYield: 0.013,
        threeYearReturn: 0.32,
        fiveYearReturn: 0.78,
        domicileCountry: 'IE',
        description: 'Physical accumulation ETF tracking the S&P 500 index.',
        isActive: true,
        updatedAt: now,
      },
      {
        symbol: 'IEAC.LSE',
        name: 'iShares Core EUR Corp Bond UCITS ETF',
        assetClass: 'FIXED_INCOME_GOV',
        securityType: 'MUTUAL_FUND_ETF',
        denominationCurrency: 'EUR',
        riskRating: 4,
        expenseRatio: 0.002,
        annualizedYield: 0.035,
        threeYearReturn: 0.08,
        fiveYearReturn: 0.12,
        domicileCountry: 'IE',
        description: 'Investment grade corporate bond exposure in EUR.',
        isActive: true,
        updatedAt: now,
      },
      {
        symbol: 'XEON.XETRA',
        name: 'Xtrackers EUR Overnight Rate Swap UCITS ETF',
        assetClass: 'MONEY_MARKET',
        securityType: 'MUTUAL_FUND_ETF',
        denominationCurrency: 'EUR',
        riskRating: 1,
        expenseRatio: 0.001,
        annualizedYield: 0.038,
        threeYearReturn: 0.06,
        fiveYearReturn: 0.07,
        domicileCountry: 'LU',
        description: 'Overnight interest rate tracker offering capital preservation.',
        isActive: true,
        updatedAt: now,
      },
      {
        symbol: 'VWRL.AS',
        name: 'Vanguard FTSE All-World UCITS ETF',
        assetClass: 'EQUITY_GLOBAL',
        securityType: 'MUTUAL_FUND_ETF',
        denominationCurrency: 'EUR',
        riskRating: 6,
        expenseRatio: 0.0022,
        annualizedYield: 0.018,
        threeYearReturn: 0.24,
        fiveYearReturn: 0.58,
        domicileCountry: 'IE',
        description: 'Global equity basket tracking developed and emerging markets.',
        isActive: true,
        updatedAt: now,
      },
      {
        symbol: 'INFY.NSE',
        name: 'Infosys Ltd (NSE)',
        assetClass: 'EQUITY_INDIA',
        securityType: 'STOCK',
        denominationCurrency: 'INR',
        riskRating: 7,
        expenseRatio: 0,
        annualizedYield: 0.025,
        threeYearReturn: 0.42,
        fiveYearReturn: 1.1,
        domicileCountry: 'IN',
        description: 'Indian large-cap technology services equity, reference-priced.',
        isActive: true,
        updatedAt: now,
      },
      {
        symbol: 'EMAAR.DFM',
        name: 'Emaar Properties PJSC (DFM)',
        assetClass: 'EQUITY_UAE',
        securityType: 'STOCK',
        denominationCurrency: 'AED',
        riskRating: 7,
        expenseRatio: 0,
        annualizedYield: 0.048,
        threeYearReturn: 0.65,
        fiveYearReturn: 1.35,
        domicileCountry: 'AE',
        description: 'UAE real estate developer equity, Sharia-compliant, reference-priced.',
        isActive: true,
        updatedAt: now,
      },
      {
        symbol: 'UAE_SOV_SUKUK_2029',
        name: 'UAE Federal Sovereign Sukuk 5.10% 2029',
        assetClass: 'SUKUK_SOVEREIGN',
        securityType: 'BOND',
        denominationCurrency: 'USD',
        riskRating: 3,
        expenseRatio: 0,
        annualizedYield: 0.051,
        threeYearReturn: 0.1,
        fiveYearReturn: 0.18,
        domicileCountry: 'AE',
        description: 'UAE federal sovereign sukuk, reference-priced at face plus evaluated yield.',
        isActive: true,
        updatedAt: now,
      },
      {
        symbol: 'FAB_SUKUK_2030',
        name: 'First Abu Dhabi Bank Green Sukuk 5.45% 2030',
        assetClass: 'SUKUK_CORP',
        securityType: 'BOND',
        denominationCurrency: 'USD',
        riskRating: 4,
        expenseRatio: 0,
        annualizedYield: 0.0545,
        threeYearReturn: 0.11,
        fiveYearReturn: 0.2,
        domicileCountry: 'AE',
        description: 'FAB green corporate sukuk, reference-priced at face plus evaluated yield.',
        isActive: true,
        updatedAt: now,
      },
      {
        symbol: 'IN_GSEC_718_2033',
        name: '7.18% GS 2033 Sovereign Benchmark Bond',
        assetClass: 'FIXED_INCOME_GOV',
        securityType: 'BOND',
        denominationCurrency: 'INR',
        riskRating: 3,
        expenseRatio: 0,
        annualizedYield: 0.0708,
        threeYearReturn: 0.22,
        fiveYearReturn: 0.38,
        domicileCountry: 'IN',
        description: 'Indian government benchmark bond, reference-priced at face plus evaluated yield.',
        isActive: true,
        updatedAt: now,
      },
    ];

    for (const item of items) {
      const id = new ObjectId();
      this.products.set(item.symbol, { ...item, _id: id });
    }
  }

  async findAll(): Promise<AssetProductDocument[]> {
    return Array.from(this.products.values());
  }

  async findBySymbol(symbol: string): Promise<AssetProductDocument | null> {
    return this.products.get(symbol) ?? null;
  }
}

export class MemoryPortfolioRepository implements PortfolioRepository {
  private portfolio: PortfolioDocument | null = null;

  constructor() {
    this.seedDefault();
  }

  private seedDefault() {
    const now = new Date();
    const demoTenantId = new ObjectId(DEFAULT_TENANT_ID);
    const demoUserId = new ObjectId(DEFAULT_USER_ID);

    this.portfolio = {
      _id: new ObjectId(),
      tenantId: demoTenantId,
      userId: demoUserId,
      baseCurrency: 'EUR',
      totalValuationBase: 9500000, // €95,000 in cents
      baseRiskScore: 7.0,
      effectiveRiskScore: 4.0,
      burnRateRunwayMonths: 3.2,
      lastRebalancedAt: null,
      updatedAt: now,
      holdings: [
        {
          assetSymbol: 'CSPX.LSE',
          assetName: 'iShares Core S&P 500',
          assetClass: 'EQUITY_US',
          currency: 'USD',
          quantity: 110,
          averageCostBasis: 48000,
          currentPrice: 51800,
          marketValueBase: 5700000, // 60%
          currentWeight: 0.6,
          targetWeight: 0.4,
        },
        {
          assetSymbol: 'IEAC.LSE',
          assetName: 'iShares Core EUR Corp Bond',
          assetClass: 'FIXED_INCOME_GOV',
          currency: 'EUR',
          quantity: 190,
          averageCostBasis: 12500,
          currentPrice: 12500,
          marketValueBase: 2375000, // 25%
          currentWeight: 0.25,
          targetWeight: 0.35,
        },
        {
          assetSymbol: 'XEON.XETRA',
          assetName: 'Xtrackers EUR Overnight MMF',
          assetClass: 'MONEY_MARKET',
          currency: 'EUR',
          quantity: 100,
          averageCostBasis: 14250,
          currentPrice: 14250,
          marketValueBase: 1425000, // 15%
          currentWeight: 0.15,
          targetWeight: 0.25,
        },
      ],
    };
  }

  // The portfolio is a single row per user, so an unmatched scope reads nothing rather than the demo portfolio.
  async findByUser(tenantId: string, userId: string): Promise<PortfolioDocument | null> {
    const owned = this.portfolio && belongsTo(this.portfolio, tenantId, userId);
    return owned ? this.portfolio : null;
  }

  async save(portfolio: PortfolioDocument): Promise<void> {
    this.portfolio = portfolio;
  }
}

export class MemorySandboxLedgerRepository implements SandboxLedgerRepository {
  private readonly entries: SandboxLedgerDocument[] = [];

  async findAllByUser(tenantId: string, userId: string): Promise<SandboxLedgerDocument[]> {
    return this.entries.filter((entry) => belongsTo(entry, tenantId, userId));
  }

  async append(entry: Omit<SandboxLedgerDocument, '_id'>): Promise<SandboxLedgerDocument> {
    const id = new ObjectId();
    const doc: SandboxLedgerDocument = { ...entry, _id: id };
    this.entries.push(doc);
    return doc;
  }
}

export class MemoryRiskProfileRepository implements RiskProfileRepository {
  private readonly profiles = new Map<string, RiskProfileDocument>();

  constructor() {
    this.seedDefault();
  }

  private seedDefault() {
    const now = new Date();
    const demoTenantId = new ObjectId(DEFAULT_TENANT_ID);
    const demoUserId = new ObjectId(DEFAULT_USER_ID);

    const doc: RiskProfileDocument = {
      _id: new ObjectId(),
      tenantId: demoTenantId,
      userId: demoUserId,
      answers: {
        psychology: ['STEADY_GROWTH', 'MAX_GROWTH'],
        countries: {
          residence: 'DE',
          incomeSources: ['DE', 'GB'],
          remittanceDestinations: ['CN', 'SG'],
        },
        instruments: [
          'GLOBAL_EQUITIES',
          'TECH_GROWTH_EQUITIES',
          'GOVERNMENT_CORPORATE_BONDS',
          'MONEY_MARKET_CASH',
        ],
        holdings: {
          cashSavings: { amount: 15000, currency: 'EUR' },
          brokerageStocks: { amount: 57000, currency: 'EUR' },
          retirementPension: { amount: 23000, currency: 'EUR' },
          otherAssets: { amount: 0, currency: 'EUR' },
        },
        age: 31,
        goals: {
          tags: ['FAMILY_SUPPORT', 'EMERGENCY_BUFFER'],
          notes: 'Support parents in Shanghai and maintain family liquid runway.',
        },
        stressResponse: 'STAY_INVESTED',
      },
      summary: {
        baseRiskScore: 7.0,
        effectiveRiskBand: 'moderate',
        timeHorizonYears: 30,
        corridorCurrencies: ['EUR', 'GBP', 'CNY', 'SGD'],
        completedAt: now.toISOString(),
      },
      createdAt: now,
      updatedAt: now,
    };

    const key = `${demoTenantId.toHexString()}:${demoUserId.toHexString()}`;
    this.profiles.set(key, doc);
  }

  async findByUser(tenantId: string, userId: string): Promise<RiskProfileDocument | null> {
    const tenant = toScopeId(tenantId, DEFAULT_TENANT_ID);
    const user = toScopeId(userId, DEFAULT_USER_ID);
    if (!tenant || !user) return null;
    const key = `${tenant.toHexString()}:${user.toHexString()}`;
    return this.profiles.get(key) ?? null;
  }

  async save(profile: RiskProfileDocument): Promise<void> {
    const key = `${profile.tenantId.toHexString()}:${profile.userId.toHexString()}`;
    this.profiles.set(key, profile);
  }
}

// The same scope the Mongo repositories apply: an unusable scope id reads nothing rather than everything.
function belongsTo(
  document: { readonly tenantId: ObjectId; readonly userId: ObjectId },
  tenantId: string,
  userId: string,
): boolean {
  const tenant = toScopeId(tenantId, DEFAULT_TENANT_ID);
  const user = toScopeId(userId, DEFAULT_USER_ID);
  if (!tenant || !user) return false;
  return document.tenantId.toHexString() === tenant.toHexString() && document.userId.toHexString() === user.toHexString();
}
