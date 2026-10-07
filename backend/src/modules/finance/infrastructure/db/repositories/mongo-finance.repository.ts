import { type Collection, ObjectId } from 'mongodb';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID, toDocumentId, toScopeId } from '#core/db/document-id.ts';
import type { AccountRepository, TransactionRepository } from '../../../application/ports.ts';
import { type AccountDocument, ACCOUNTS_COLLECTION } from '../documents/account.document.ts';
import { type TransactionDocument, TRANSACTIONS_COLLECTION } from '../documents/transaction.document.ts';

export class MongoAccountRepository implements AccountRepository {
  private readonly col: () => Promise<Collection<AccountDocument>>;

  constructor(col: () => Promise<Collection<AccountDocument>>) {
    this.col = col;
  }

  async findByUser(tenantId: string, userId: string): Promise<AccountDocument[]> {
    const tId = toScopeId(tenantId, DEFAULT_TENANT_ID);
    const uId = toScopeId(userId, DEFAULT_USER_ID);
    if (!tId || !uId) return [];
    return (await this.col()).find({ tenantId: tId, userId: uId }).toArray();
  }

  async findById(id: string): Promise<AccountDocument | null> {
    const docId = toDocumentId(id);
    if (!docId) return null;
    return (await this.col()).findOne({ _id: docId });
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
    const tId = toScopeId(tenantId, DEFAULT_TENANT_ID);
    const uId = toScopeId(userId, DEFAULT_USER_ID);
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
