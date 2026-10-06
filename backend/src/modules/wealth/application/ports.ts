import type { AssetProductDocument } from '../infrastructure/db/documents/asset-product.document.ts';
import type { PortfolioDocument } from '../infrastructure/db/documents/portfolio.document.ts';
import type { SandboxLedgerDocument } from '../infrastructure/db/documents/sandbox-ledger.document.ts';

export interface AssetProductRepository {
  findAll(): Promise<AssetProductDocument[]>;
  findBySymbol(symbol: string): Promise<AssetProductDocument | null>;
}

export interface PortfolioRepository {
  findByUser(tenantId: string, userId: string): Promise<PortfolioDocument | null>;
  save(portfolio: PortfolioDocument): Promise<void>;
}

export interface SandboxLedgerRepository {
  findAllByUser(tenantId: string, userId: string): Promise<SandboxLedgerDocument[]>;
  append(entry: Omit<SandboxLedgerDocument, '_id'>): Promise<SandboxLedgerDocument>;
}
