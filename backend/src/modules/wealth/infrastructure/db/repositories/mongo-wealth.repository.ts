import { type Collection, ObjectId } from 'mongodb';
import type {
  AssetProductRepository,
  PortfolioRepository,
  SandboxLedgerRepository,
} from '../../../application/ports.ts';
import { type AssetProductDocument, ASSET_PRODUCTS_COLLECTION } from '../documents/asset-product.document.ts';
import { type PortfolioDocument, PORTFOLIOS_COLLECTION } from '../documents/portfolio.document.ts';
import { type SandboxLedgerDocument, SANDBOX_LEDGERS_COLLECTION } from '../documents/sandbox-ledger.document.ts';

export class MongoAssetProductRepository implements AssetProductRepository {
  private readonly col: () => Promise<Collection<AssetProductDocument>>;

  constructor(col: () => Promise<Collection<AssetProductDocument>>) {
    this.col = col;
  }

  async findAll(): Promise<AssetProductDocument[]> {
    return (await this.col()).find({}).toArray();
  }

  async findBySymbol(symbol: string): Promise<AssetProductDocument | null> {
    return (await this.col()).findOne({ symbol });
  }
}

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

export class MongoPortfolioRepository implements PortfolioRepository {
  private readonly col: () => Promise<Collection<PortfolioDocument>>;

  constructor(col: () => Promise<Collection<PortfolioDocument>>) {
    this.col = col;
  }

  async findByUser(tenantId: string, userId: string): Promise<PortfolioDocument | null> {
    const tId = resolveTenantObjectId(tenantId);
    const uId = resolveUserObjectId(userId);
    if (!tId || !uId) return null;
    return (await this.col()).findOne({ tenantId: tId, userId: uId });
  }

  async save(portfolio: PortfolioDocument): Promise<void> {
    await (await this.col()).replaceOne({ _id: portfolio._id }, portfolio, { upsert: true });
  }
}

export class MongoSandboxLedgerRepository implements SandboxLedgerRepository {
  private readonly col: () => Promise<Collection<SandboxLedgerDocument>>;

  constructor(col: () => Promise<Collection<SandboxLedgerDocument>>) {
    this.col = col;
  }

  async findAllByUser(tenantId: string, userId: string): Promise<SandboxLedgerDocument[]> {
    const tId = resolveTenantObjectId(tenantId);
    const uId = resolveUserObjectId(userId);
    if (!tId || !uId) return [];
    return (await this.col())
      .find({ tenantId: tId, userId: uId })
      .sort({ timestamp: -1 })
      .toArray();
  }

  async append(entry: Omit<SandboxLedgerDocument, '_id'>): Promise<SandboxLedgerDocument> {
    const id = new ObjectId();
    const doc: SandboxLedgerDocument = { ...entry, _id: id };
    await (await this.col()).insertOne(doc as any);
    return doc;
  }
}
