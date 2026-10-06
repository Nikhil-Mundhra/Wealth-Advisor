import { ObjectId } from 'mongodb';
import { env } from '#core/config/env.ts';
import { closeMongoClient, getDb } from '#core/db/connection/mongo-client.ts';
import { objectIdGenerator } from '#core/db/ids/object-id-generator.ts';
import { systemClock } from '#core/time/clock.ts';
import { type TenantDocument, TENANTS_COLLECTION } from '#modules/admin/infrastructure/db/documents/tenant.document.ts';
import { ScryptPasswordHasher } from '#modules/auth/infrastructure/crypto/scrypt-password-hasher.ts';
import { type UserDocument, USERS_COLLECTION } from '#modules/auth/infrastructure/db/documents/user.document.ts';
import { MongoUserRepository } from '#modules/auth/infrastructure/db/repositories/mongo-user.repository.ts';
import { DEMO_EMAIL, seedDemoUser } from '#modules/auth/infrastructure/db/seed/demo-user.seed.ts';
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
const defaultTenantId = new ObjectId('600000000000000000000001');
const demoUserId = new ObjectId('500000000000000000000001');

// 1. Seed demo user
const users = new MongoUserRepository(async () => db.collection<UserDocument>(USERS_COLLECTION), systemClock);
const outcome = await seedDemoUser(users, new ScryptPasswordHasher(), objectIdGenerator, systemClock);
console.log(`demo account ${outcome === 'created' ? 'created' : 'already exists'}: ${DEMO_EMAIL}`);

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
  ]);
  console.log('demo asset products created');
}

// 6. Seed portfolio
const portfoliosCol = db.collection<PortfolioDocument>(PORTFOLIOS_COLLECTION);
if ((await portfoliosCol.countDocuments()) === 0) {
  await portfoliosCol.insertOne({
    _id: new ObjectId(),
    tenantId: defaultTenantId,
    userId: demoUserId,
    baseCurrency: 'EUR',
    totalValuationBase: 9500000,
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
  });
  console.log('demo portfolio created');
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
