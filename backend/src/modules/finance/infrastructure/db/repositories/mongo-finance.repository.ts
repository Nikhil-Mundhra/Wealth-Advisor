import { type Collection, ObjectId } from 'mongodb';
import type { AccountRepository, TransactionRepository } from '../../../application/ports.ts';
import { type AccountDocument, ACCOUNTS_COLLECTION } from '../documents/account.document.ts';
import { type TransactionDocument, TRANSACTIONS_COLLECTION } from '../documents/transaction.document.ts';

const DEMO_TENANT_ID = '600000000000000000000001';
const DEMO_USER_ID = '500000000000000000000001';

function resolveTenantObjectId(id: string): ObjectId | null {
  if (id === 'default') return new ObjectId(DEMO_TENANT_ID);
  return ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;
}

function resolveUserObjectId(id: string): ObjectId | null {
  if (id === 'default') return new ObjectId(DEMO_USER_ID);
  return ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;
}

export class MongoAccountRepository implements AccountRepository {
  private readonly col: () => Promise<Collection<AccountDocument>>;

  constructor(col: () => Promise<Collection<AccountDocument>>) {
    this.col = col;
  }

  async findByUser(tenantId: string, userId: string): Promise<AccountDocument[]> {
    const tId = resolveTenantObjectId(tenantId);
    const uId = resolveUserObjectId(userId);
    if (!tId || !uId) return [];
    return (await this.col()).find({ tenantId: tId, userId: uId }).toArray();
  }

  async findById(id: string): Promise<AccountDocument | null> {
    if (!ObjectId.isValid(id) || id.length !== 24) return null;
    return (await this.col()).findOne({ _id: new ObjectId(id) });
  }

  async create(account: Omit<AccountDocument, '_id'>): Promise<AccountDocument> {
    const id = new ObjectId();
    const doc: AccountDocument = { ...account, _id: id };
    await (await this.col()).insertOne(doc as any);
    return doc;
  }
}

export class MongoTransactionRepository implements TransactionRepository {
  private readonly col: () => Promise<Collection<TransactionDocument>>;

  constructor(col: () => Promise<Collection<TransactionDocument>>) {
    this.col = col;
  }

  async findByUser(tenantId: string, userId: string): Promise<TransactionDocument[]> {
    const tId = resolveTenantObjectId(tenantId);
    const uId = resolveUserObjectId(userId);
    if (!tId || !uId) return [];
    return (await this.col())
      .find({ tenantId: tId, userId: uId })
      .sort({ timestamp: -1 })
      .toArray();
  }

  async create(tx: Omit<TransactionDocument, '_id'>): Promise<TransactionDocument> {
    const id = new ObjectId();
    const doc: TransactionDocument = { ...tx, _id: id };
    await (await this.col()).insertOne(doc as any);
    return doc;
  }
}
