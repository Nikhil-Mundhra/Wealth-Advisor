import { ObjectId } from 'mongodb';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID, toScopeId } from '#core/db/document-id.ts';
import type { AccountRepository, TransactionRepository } from '../../../application/ports.ts';
import type { AccountDocument } from '../documents/account.document.ts';
import type { TransactionDocument } from '../documents/transaction.document.ts';

export class MemoryAccountRepository implements AccountRepository {
  private readonly accounts = new Map<string, AccountDocument>();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const now = new Date();
    const demoTenantId = new ObjectId(DEFAULT_TENANT_ID);
    const demoUserId = new ObjectId(DEFAULT_USER_ID);

    const seeds: Omit<AccountDocument, '_id'>[] = [
      {
        tenantId: demoTenantId,
        userId: demoUserId,
        householdMode: 'FAMILY_HOUSEHOLD',
        institutionName: 'Deutsche Bank Germany',
        accountType: 'CHECKING',
        currency: 'EUR',
        balance: 1500000, // €15,000 in cents
        lastSyncedAt: now,
        isPrimaryLiquidity: true,
        createdAt: now,
      },
      {
        tenantId: demoTenantId,
        userId: demoUserId,
        householdMode: 'FAMILY_HOUSEHOLD',
        institutionName: 'Barclays UK',
        accountType: 'CHECKING',
        currency: 'GBP',
        balance: 600000, // £6,000 in pence
        lastSyncedAt: now,
        isPrimaryLiquidity: false,
        createdAt: now,
      },
      {
        tenantId: demoTenantId,
        userId: demoUserId,
        householdMode: 'FAMILY_HOUSEHOLD',
        institutionName: 'DBS Multi-Currency Singapore',
        accountType: 'MULTI_CURRENCY_WALLET',
        currency: 'SGD',
        balance: 500000, // S$5,000 in cents
        lastSyncedAt: now,
        isPrimaryLiquidity: false,
        createdAt: now,
      },
    ];

    for (const s of seeds) {
      const id = new ObjectId();
      this.accounts.set(id.toHexString(), { ...s, _id: id });
    }
  }

  async findByUser(tenantId: string, userId: string): Promise<AccountDocument[]> {
    return scopedTo(this.accounts.values(), tenantId, userId);
  }

  async findById(id: string): Promise<AccountDocument | null> {
    return this.accounts.get(id) ?? null;
  }

  async create(account: Omit<AccountDocument, '_id'>): Promise<AccountDocument> {
    const id = new ObjectId();
    const doc: AccountDocument = { ...account, _id: id };
    this.accounts.set(id.toHexString(), doc);
    return doc;
  }
}

export class MemoryTransactionRepository implements TransactionRepository {
  private readonly transactions = new Map<string, TransactionDocument>();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const now = new Date();
    const demoTenantId = new ObjectId(DEFAULT_TENANT_ID);
    const demoUserId = new ObjectId(DEFAULT_USER_ID);
    const dummyAccId = new ObjectId();

    const seeds: Omit<TransactionDocument, '_id'>[] = [
      {
        tenantId: demoTenantId,
        userId: demoUserId,
        accountId: dummyAccId,
        category: 'INCOME_SALARY',
        amount: 750000, // €7,500
        currency: 'EUR',
        convertedBaseAmount: 750000,
        baseCurrency: 'EUR',
        timestamp: new Date(now.getTime() - 2 * 86400000),
        createdAt: now,
      },
      {
        tenantId: demoTenantId,
        userId: demoUserId,
        accountId: dummyAccId,
        category: 'INCOME_FREELANCE',
        amount: 300000, // £3,000
        currency: 'GBP',
        convertedBaseAmount: 350000, // ~€3,500
        baseCurrency: 'EUR',
        timestamp: new Date(now.getTime() - 5 * 86400000),
        createdAt: now,
      },
      {
        tenantId: demoTenantId,
        userId: demoUserId,
        accountId: dummyAccId,
        category: 'BILL_HOUSING',
        amount: 220000, // €2,200
        currency: 'EUR',
        convertedBaseAmount: 220000,
        baseCurrency: 'EUR',
        timestamp: new Date(now.getTime() - 10 * 86400000),
        createdAt: now,
      },
      {
        tenantId: demoTenantId,
        userId: demoUserId,
        accountId: dummyAccId,
        category: 'FAMILY_REMITTANCE',
        amount: 320000, // €3,200 equivalent
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
    ];

    for (const s of seeds) {
      const id = new ObjectId();
      this.transactions.set(id.toHexString(), { ...s, _id: id });
    }
  }

  async findByUser(tenantId: string, userId: string): Promise<TransactionDocument[]> {
    return scopedTo(this.transactions.values(), tenantId, userId);
  }

  async create(tx: Omit<TransactionDocument, '_id'>): Promise<TransactionDocument> {
    const id = new ObjectId();
    const doc: TransactionDocument = { ...tx, _id: id };
    this.transactions.set(id.toHexString(), doc);
    return doc;
  }
}

// The same scope the Mongo repositories apply: an unusable scope id reads nothing rather than everything.
function scopedTo<T extends { readonly tenantId: ObjectId; readonly userId: ObjectId }>(
  documents: Iterable<T>,
  tenantId: string,
  userId: string,
): T[] {
  const tenant = toScopeId(tenantId, DEFAULT_TENANT_ID);
  const user = toScopeId(userId, DEFAULT_USER_ID);
  if (!tenant || !user) return [];
  const id = (value: ObjectId) => value.toHexString();
  return Array.from(documents).filter((doc) => id(doc.tenantId) === id(tenant) && id(doc.userId) === id(user));
}
