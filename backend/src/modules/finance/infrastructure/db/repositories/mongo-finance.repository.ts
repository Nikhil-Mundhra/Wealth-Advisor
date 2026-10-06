import { type Collection, ObjectId } from 'mongodb';
import type { AccountRepository, TransactionRepository } from '../../../application/ports.ts';
import { type AccountDocument, ACCOUNTS_COLLECTION } from '../documents/account.document.ts';
import { type TransactionDocument, TRANSACTIONS_COLLECTION } from '../documents/transaction.document.ts';

export class MongoAccountRepository implements AccountRepository {
  private readonly col: () => Promise<Collection<AccountDocument>>;

  constructor(col: () => Promise<Collection<AccountDocument>>) {
    this.col = col;
  }

  async findByUser(tenantId: string, userId: string): Promise<AccountDocument[]> {
    try {
      return (await this.col()).find({ tenantId: new ObjectId(tenantId), userId: new ObjectId(userId) }).toArray();
    } catch {
      return (await this.col()).find({}).toArray();
    }
  }

  async findById(id: string): Promise<AccountDocument | null> {
    try {
      return (await this.col()).findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
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
    try {
      return (await this.col())
        .find({ tenantId: new ObjectId(tenantId), userId: new ObjectId(userId) })
        .sort({ timestamp: -1 })
        .toArray();
    } catch {
      return (await this.col()).find({}).sort({ timestamp: -1 }).toArray();
    }
  }

  async create(tx: Omit<TransactionDocument, '_id'>): Promise<TransactionDocument> {
    const id = new ObjectId();
    const doc: TransactionDocument = { ...tx, _id: id };
    await (await this.col()).insertOne(doc as any);
    return doc;
  }
}
