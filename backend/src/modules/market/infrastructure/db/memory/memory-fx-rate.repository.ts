import type { FxRateRepository } from '../../../application/ports.ts';
import type { FxRate } from '../../../domain/fx-rate.vo.ts';

// FxRateRepository in process memory; the (base, quote, date) key mirrors the unique index, first write wins.
export class MemoryFxRateRepository implements FxRateRepository {
  private readonly rates = new Map<string, FxRate>();

  async append(rates: readonly FxRate[]): Promise<number> {
    let stored = 0;
    for (const rate of rates) {
      const key = `${rate.base}|${rate.quote}|${rate.date}`;
      if (this.rates.has(key)) continue;
      this.rates.set(key, rate);
      stored += 1;
    }
    return stored;
  }

  async latestDate(): Promise<string | null> {
    let latest: string | null = null;
    for (const rate of this.rates.values()) if (latest === null || rate.date > latest) latest = rate.date;
    return latest;
  }

  async between(from: string, to: string): Promise<FxRate[]> {
    return [...this.rates.values()].filter((rate) => rate.date >= from && rate.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  }
}
