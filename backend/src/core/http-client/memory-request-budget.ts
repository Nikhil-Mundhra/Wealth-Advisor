import type { Clock } from '#core/time/clock.ts';
import type { RequestBudget } from './request-budget.ts';
import { assertReservation, budgetMonth } from './request-budget-rules.ts';

// Check and increment run with no await in between, so a reservation is atomic on the single JS thread.
export class MemoryRequestBudget implements RequestBudget {
  private readonly used = new Map<string, number>();
  private readonly clock: Clock;

  constructor(clock: Clock) {
    this.clock = clock;
  }

  async reserve(provider: string, count: number, monthlyLimit: number): Promise<boolean> {
    assertReservation(count, monthlyLimit);
    const key = `${provider}:${budgetMonth(this.clock.now())}`;
    const used = this.used.get(key) ?? 0;
    if (used + count > monthlyLimit) return false;
    this.used.set(key, used + count);
    return true;
  }
}
