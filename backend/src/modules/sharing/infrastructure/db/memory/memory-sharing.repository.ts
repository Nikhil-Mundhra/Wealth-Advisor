import { ObjectId } from 'mongodb';
import { DEFAULT_TENANT_ID, DEFAULT_USER_ID } from '#core/db/document-id.ts';
import type { SharedPlanRepository } from '../../../application/ports.ts';
import type { SharedPlanDocument } from '../documents/shared-plan.document.ts';

export class MemorySharedPlanRepository implements SharedPlanRepository {
  private readonly plans = new Map<string, SharedPlanDocument>();

  constructor() {
    // Seed default shareable plan for testing
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 3600000);
    const demoPlan: SharedPlanDocument = {
      _id: new ObjectId(),
      shareToken: 'dewa_sec_789f',
      tenantId: new ObjectId(DEFAULT_TENANT_ID),
      userId: new ObjectId(DEFAULT_USER_ID),
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
      expiresAt,
      createdAt: now,
    };
    this.plans.set(demoPlan.shareToken, demoPlan);
  }

  async findByToken(token: string): Promise<SharedPlanDocument | null> {
    return this.plans.get(token) ?? null;
  }

  async create(plan: Omit<SharedPlanDocument, '_id'>): Promise<SharedPlanDocument> {
    const id = new ObjectId();
    const doc: SharedPlanDocument = { ...plan, _id: id };
    this.plans.set(doc.shareToken, doc);
    return doc;
  }
}
