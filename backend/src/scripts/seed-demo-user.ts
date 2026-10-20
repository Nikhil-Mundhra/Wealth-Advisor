import { DEFAULT_TENANT_ID, DEFAULT_USER_ID } from '#core/db/document-id.ts';
import { ObjectId } from 'mongodb';
import { type Currency } from '@wealth-advisor/rules';
import { env } from '#core/config/env.ts';
import { closeMongoClient, getDb } from '#core/db/connection/mongo-client.ts';
import { objectIdGenerator } from '#core/db/ids/object-id-generator.ts';
import { systemClock } from '#core/time/clock.ts';
import { type TenantDocument, TENANTS_COLLECTION } from '#modules/admin/infrastructure/db/documents/tenant.document.ts';
import { ScryptPasswordHasher } from '#modules/auth/infrastructure/crypto/scrypt-password-hasher.ts';
import { type UserDocument, USERS_COLLECTION } from '#modules/auth/infrastructure/db/documents/user.document.ts';
import { MongoUserRepository } from '#modules/auth/infrastructure/db/repositories/mongo-user.repository.ts';
import { DEMO_ACCOUNTS, DEMO_EMAIL, seedDemoUser } from '#modules/auth/infrastructure/db/seed/demo-user.seed.ts';
import { type AccountDocument, ACCOUNTS_COLLECTION } from '#modules/finance/infrastructure/db/documents/account.document.ts';
import { type TransactionDocument, TRANSACTIONS_COLLECTION } from '#modules/finance/infrastructure/db/documents/transaction.document.ts';
import { type SharedPlanDocument, SHARED_PLANS_COLLECTION } from '#modules/sharing/infrastructure/db/documents/shared-plan.document.ts';
import { type AssetProductDocument, ASSET_PRODUCTS_COLLECTION } from '#modules/wealth/infrastructure/db/documents/asset-product.document.ts';
import { type PortfolioDocument, PORTFOLIOS_COLLECTION } from '#modules/wealth/infrastructure/db/documents/portfolio.document.ts';

if (env().NODE_ENV === 'production') {
  console.error('refusing to seed the demo account with NODE_ENV=production');
  process.exit(1);
}

const db = await getDb();
const now = systemClock.now();
const defaultTenantId = new ObjectId(DEFAULT_TENANT_ID);
const demoUserId = new ObjectId(DEFAULT_USER_ID);

// 1. Seed demo user accounts (Admin, Advisors, Clients)
const users = new MongoUserRepository(async () => db.collection<UserDocument>(USERS_COLLECTION), systemClock);
const outcome = await seedDemoUser(users, new ScryptPasswordHasher(), objectIdGenerator, systemClock);
console.log(`demo accounts ${outcome === 'created' ? 'created' : 'upserted'}:`);
for (const acc of DEMO_ACCOUNTS) {
  console.log(`  - [${acc.roles.join(', ')}] ${acc.displayName} <${acc.email}> : ${acc.password}`);
}

// 2. Seed demo tenant
const tenantsCol = db.collection<TenantDocument>(TENANTS_COLLECTION);
if ((await tenantsCol.countDocuments()) === 0) {
  await tenantsCol.insertOne({
    _id: defaultTenantId,
    slug: 'global-nomads',
    name: 'Global Nomads Wealth',
    plan: 'INSTITUTIONAL',
    status: 'ACTIVE',
    settings: {
      baselineCurrency: 'EUR',
      allowedCorridors: ['EUR_CNY', 'GBP_SGD', 'USD_CNY', 'EUR_SGD'],
      defaultLlmProvider: 'mock',
      maxMembers: 100,
      requirePasskeyForRebalance: true,
    },
    createdAt: now,
    updatedAt: now,
  });
  console.log('demo tenant created: global-nomads');
}

// 3. Seed accounts
const accountsCol = db.collection<AccountDocument>(ACCOUNTS_COLLECTION);
if ((await accountsCol.countDocuments()) === 0) {
  await accountsCol.insertMany([
    {
      _id: new ObjectId(),
      tenantId: defaultTenantId,
      userId: demoUserId,
      householdMode: 'FAMILY_HOUSEHOLD',
      institutionName: 'Deutsche Bank Germany',
      accountType: 'CHECKING',
      currency: 'EUR',
      balance: 1500000,
      lastSyncedAt: now,
      isPrimaryLiquidity: true,
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      tenantId: defaultTenantId,
      userId: demoUserId,
      householdMode: 'FAMILY_HOUSEHOLD',
      institutionName: 'Barclays UK',
      accountType: 'CHECKING',
      currency: 'GBP',
      balance: 600000,
      lastSyncedAt: now,
      isPrimaryLiquidity: false,
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      tenantId: defaultTenantId,
      userId: demoUserId,
      householdMode: 'FAMILY_HOUSEHOLD',
      institutionName: 'DBS Multi-Currency Singapore',
      accountType: 'MULTI_CURRENCY_WALLET',
      currency: 'SGD',
      balance: 500000,
      lastSyncedAt: now,
      isPrimaryLiquidity: false,
      createdAt: now,
    },
  ]);
  console.log('demo accounts created');
}

// 4. Seed transactions
const transactionsCol = db.collection<TransactionDocument>(TRANSACTIONS_COLLECTION);
if ((await transactionsCol.countDocuments()) === 0) {
  const dummyAccId = new ObjectId();
  await transactionsCol.insertMany([
    {
      _id: new ObjectId(),
      tenantId: defaultTenantId,
      userId: demoUserId,
      accountId: dummyAccId,
      category: 'INCOME_SALARY',
      amount: 750000,
      currency: 'EUR',
      convertedBaseAmount: 750000,
      baseCurrency: 'EUR',
      timestamp: new Date(now.getTime() - 2 * 86400000),
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      tenantId: defaultTenantId,
      userId: demoUserId,
      accountId: dummyAccId,
      category: 'INCOME_FREELANCE',
      amount: 300000,
      currency: 'GBP',
      convertedBaseAmount: 350000,
      baseCurrency: 'EUR',
      timestamp: new Date(now.getTime() - 5 * 86400000),
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      tenantId: defaultTenantId,
      userId: demoUserId,
      accountId: dummyAccId,
      category: 'BILL_HOUSING',
      amount: 220000,
      currency: 'EUR',
      convertedBaseAmount: 220000,
      baseCurrency: 'EUR',
      timestamp: new Date(now.getTime() - 10 * 86400000),
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      tenantId: defaultTenantId,
      userId: demoUserId,
      accountId: dummyAccId,
      category: 'FAMILY_REMITTANCE',
      amount: 320000,
      currency: 'EUR',
      convertedBaseAmount: 320000,
      baseCurrency: 'EUR',
      remittanceMetadata: {
        recipientCountry: 'CN',
        destinationCurrency: 'CNY',
        exchangeRateApplied: 7.82,
        feePaid: 1500,
      },
      timestamp: new Date(now.getTime() - 12 * 86400000),
      createdAt: now,
    },
  ]);
  console.log('demo transactions created');
}

// 5. Seed asset products
const productsCol = db.collection<AssetProductDocument>(ASSET_PRODUCTS_COLLECTION);
if ((await productsCol.countDocuments()) === 0) {
  await productsCol.insertMany([
    {
      _id: new ObjectId(),
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
      _id: new ObjectId(),
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
      _id: new ObjectId(),
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
      _id: new ObjectId(),
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
      _id: new ObjectId(),
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
      _id: new ObjectId(),
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
      _id: new ObjectId(),
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
      _id: new ObjectId(),
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
      _id: new ObjectId(),
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
  ]);
  console.log('demo asset products created');
}

// 6. Seed portfolios
const portfoliosCol = db.collection<PortfolioDocument>(PORTFOLIOS_COLLECTION);
const clientPortfolios = [
  {
    userId: demoUserId, // Elena Vance (500000000000000000000001)
    baseCurrency: 'EUR',
    totalValuationBase: 9500000,
    baseRiskScore: 7.0,
    effectiveRiskScore: 4.0,
    burnRateRunwayMonths: 3.2,
    holdings: [
      {
        assetSymbol: 'CSPX.LSE',
        assetName: 'iShares Core S&P 500',
        assetClass: 'EQUITY_US',
        currency: 'USD',
        quantity: 110,
        averageCostBasis: 48000,
        currentPrice: 51800,
        marketValueBase: 5700000,
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
        marketValueBase: 2375000,
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
        marketValueBase: 1425000,
        currentWeight: 0.15,
        targetWeight: 0.25,
      },
    ],
  },
  {
    userId: new ObjectId('500000000000000000000002'), // Marcus Vance
    baseCurrency: 'EUR',
    totalValuationBase: 3250000,
    baseRiskScore: 6.0,
    effectiveRiskScore: 5.0,
    burnRateRunwayMonths: 8.5,
    holdings: [
      {
        assetSymbol: 'VWRL.AS',
        assetName: 'Vanguard FTSE All-World',
        assetClass: 'EQUITY_GLOBAL',
        currency: 'EUR',
        quantity: 180,
        averageCostBasis: 10500,
        currentPrice: 11800,
        marketValueBase: 2125000,
        currentWeight: 0.65,
        targetWeight: 0.6,
      },
      {
        assetSymbol: 'IEAC.LSE',
        assetName: 'iShares Core EUR Corp Bond',
        assetClass: 'FIXED_INCOME_GOV',
        currency: 'EUR',
        quantity: 90,
        averageCostBasis: 12500,
        currentPrice: 12500,
        marketValueBase: 1125000,
        currentWeight: 0.35,
        targetWeight: 0.4,
      },
    ],
  },
  {
    userId: new ObjectId('500000000000000000000003'), // Mei-Ling Chen
    baseCurrency: 'USD',
    totalValuationBase: 4800000,
    baseRiskScore: 8.0,
    effectiveRiskScore: 6.5,
    burnRateRunwayMonths: 12.0,
    holdings: [
      {
        assetSymbol: 'CSPX.LSE',
        assetName: 'iShares Core S&P 500',
        assetClass: 'EQUITY_US',
        currency: 'USD',
        quantity: 75,
        averageCostBasis: 48000,
        currentPrice: 51800,
        marketValueBase: 3885000,
        currentWeight: 0.81,
        targetWeight: 0.65,
      },
      {
        assetSymbol: 'XEON.XETRA',
        assetName: 'Xtrackers EUR Overnight MMF',
        assetClass: 'MONEY_MARKET',
        currency: 'EUR',
        quantity: 64,
        averageCostBasis: 14250,
        currentPrice: 14250,
        marketValueBase: 915000,
        currentWeight: 0.19,
        targetWeight: 0.35,
      },
    ],
  },
  {
    userId: new ObjectId('500000000000000000000004'), // Rahul Sharma
    baseCurrency: 'EUR',
    totalValuationBase: 1150000,
    baseRiskScore: 3.0,
    effectiveRiskScore: 2.5,
    burnRateRunwayMonths: 18.0,
    holdings: [
      {
        assetSymbol: 'IEAC.LSE',
        assetName: 'iShares Core EUR Corp Bond',
        assetClass: 'FIXED_INCOME_GOV',
        currency: 'EUR',
        quantity: 55,
        averageCostBasis: 12500,
        currentPrice: 12500,
        marketValueBase: 687500,
        currentWeight: 0.6,
        targetWeight: 0.5,
      },
      {
        assetSymbol: 'XEON.XETRA',
        assetName: 'Xtrackers EUR Overnight MMF',
        assetClass: 'MONEY_MARKET',
        currency: 'EUR',
        quantity: 32,
        averageCostBasis: 14250,
        currentPrice: 14250,
        marketValueBase: 462500,
        currentWeight: 0.4,
        targetWeight: 0.5,
      },
    ],
  },
];

for (const p of clientPortfolios) {
  const existing = await portfoliosCol.findOne({ userId: p.userId });
  if (!existing) {
    await portfoliosCol.insertOne({
      _id: new ObjectId(),
      tenantId: defaultTenantId,
      userId: p.userId,
      baseCurrency: p.baseCurrency as Currency,
      totalValuationBase: p.totalValuationBase,
      baseRiskScore: p.baseRiskScore,
      effectiveRiskScore: p.effectiveRiskScore,
      burnRateRunwayMonths: p.burnRateRunwayMonths,
      lastRebalancedAt: null,
      updatedAt: now,
      holdings: p.holdings as any,
    });
    console.log(`demo portfolio created for user: ${p.userId}`);
  }
}

// 7. Seed shared plan
const sharedPlansCol = db.collection<SharedPlanDocument>(SHARED_PLANS_COLLECTION);
if ((await sharedPlansCol.countDocuments()) === 0) {
  await sharedPlansCol.insertOne({
    _id: new ObjectId(),
    shareToken: 'dewa_sec_789f',
    tenantId: defaultTenantId,
    userId: demoUserId,
    ownerDisplayName: 'Elena',
    privacyMasked: true,
    planSnapshot: {
      recommendedWeights: {
        'CSPX.LSE': 0.4,
        'IEAC.LSE': 0.35,
        'XEON.XETRA': 0.25,
      },
      currentWeights: {
        'CSPX.LSE': 0.6,
        'IEAC.LSE': 0.25,
        'XEON.XETRA': 0.15,
      },
      threePillarRationale: {
        personalFinance: 'Runway expanded to 6.4 months by buffering short-term liabilities.',
        crossBorder: 'Protected remittances against EUR/CNY exchange rate volatility.',
        wealthStrategy: 'Reduced US equity concentration risk from 60% to 40%.',
      },
      stressTestScenario: {
        fxShockPercent: -5.0,
        estimatedDrawdownPercent: 1.8,
      },
    },
    passphraseHash: null,
    expiresAt: new Date(now.getTime() + 72 * 3600000),
    createdAt: now,
  });
  console.log('demo shared plan created: dewa_sec_789f');
}

await closeMongoClient();
