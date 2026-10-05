import type { Collection } from 'mongodb';
import { classifyDbError } from '#core/db/errors/classify-db-error.ts';
import type { Clock } from '#core/time/clock.ts';
import type { RequestBudget } from './request-budget.ts';
import { assertReservation, budgetMonth } from './request-budget-rules.ts';
import type { RequestBudgetDocument } from './request-budgets.schema.ts';

// The reservation is one conditional $inc: the filter { used ≤ limit − count } and the increment apply to the
// document atomically, so concurrent reserves can never push `used` past the limit (read-then-write could).
export class MongoRequestBudget implements RequestBudget {
  private readonly collection: () => Promise<Collection<RequestBudgetDocument>>;
  private readonly clock: Clock;

  constructor(collection: () => Promise<Collection<RequestBudgetDocument>>, clock: Clock) {
    this.collection = collection;
    this.clock = clock;
  }

  async reserve(provider: string, count: number, monthlyLimit: number): Promise<boolean> {
    assertReservation(count, monthlyLimit);
    if (count > monthlyLimit) return false;
    const now = this.clock.now();
    const month = budgetMonth(now);
    const _id = `${provider}:${month}`;
    const collection = await this.collection();
    await this.ensureCounter(collection, _id, { provider, month, used: 0, createdAt: now, updatedAt: now });
    const result = await collection.updateOne(
      { _id, used: { $lte: monthlyLimit - count } },
      { $inc: { used: count }, $set: { updatedAt: now } },
    );
    return result.matchedCount === 1;
  }

  // Kept apart from the $inc: an upsert whose filter also holds the `used` condition would try to insert a
  // second document for an exhausted month and fail on _id instead of answering false.
  private async ensureCounter(
    collection: Collection<RequestBudgetDocument>,
    _id: string,
    initial: Omit<RequestBudgetDocument, '_id'>,
  ): Promise<void> {
    try {
      await collection.updateOne({ _id }, { $setOnInsert: initial }, { upsert: true });
    } catch (error) {
      if (classifyDbError(error) !== 'duplicate-key') throw error;
    }
  }
}
