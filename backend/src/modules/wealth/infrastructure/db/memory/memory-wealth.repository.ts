import { ObjectId } from 'mongodb';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID, toScopeId } from '#core/db/document-id.ts';
import type {
  AssetProductRepository,
  PortfolioRepository,
  SandboxLedgerRepository,
} from '../../../application/ports.ts';
import type { AssetProductDocument } from '../documents/asset-product.document.ts';
import type { PortfolioDocument } from '../documents/portfolio.document.ts';
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
