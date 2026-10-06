import { type Collection, ObjectId } from 'mongodb';
import type { SharedPlanRepository } from '../../../application/ports.ts';
import { type SharedPlanDocument, SHARED_PLANS_COLLECTION } from '../documents/shared-plan.document.ts';

export class MongoSharedPlanRepository implements SharedPlanRepository {
  private readonly col: () => Promise<Collection<SharedPlanDocument>>;

  constructor(col: () => Promise<Collection<SharedPlanDocument>>) {
    this.col = col;
  }

  async findByToken(shareToken: string): Promise<SharedPlanDocument | null> {
    return (await this.col()).findOne({ shareToken });
  }

  async create(plan: Omit<SharedPlanDocument, '_id'>): Promise<SharedPlanDocument> {
    const id = new ObjectId();
    const doc: SharedPlanDocument = { ...plan, _id: id };
    await (await this.col()).insertOne(doc as any);
    return doc;
  }
}
