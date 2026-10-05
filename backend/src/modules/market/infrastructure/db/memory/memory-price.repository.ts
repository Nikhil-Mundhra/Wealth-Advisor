import type { PriceRepository } from '../../../application/ports.ts';
import type { Price } from '../../../domain/price.vo.ts';

// PriceRepository in process memory; the (symbol, date) key mirrors the unique index, first write wins.
export class MemoryPriceRepository implements PriceRepository {
  private readonly prices = new Map<string, Price>();

  async append(prices: readonly Price[]): Promise<number> {
    let stored = 0;
    for (const price of prices) {
      const key = `${price.symbol}|${price.date}`;
      if (this.prices.has(key)) continue;
      this.prices.set(key, price);
      stored += 1;
    }
    return stored;
  }

  async latestPerSymbol(symbols: readonly string[]): Promise<Price[]> {
    const latest = new Map<string, Price>();
    for (const price of this.prices.values()) {
      if (!symbols.includes(price.symbol)) continue;
      const current = latest.get(price.symbol);
      if (!current || price.date > current.date) latest.set(price.symbol, price);
    }
    return [...latest.values()];
  }

  async history(symbols: readonly string[], from: string, to: string): Promise<Price[]> {
    return [...this.prices.values()]
      .filter((price) => symbols.includes(price.symbol) && price.date >= from && price.date <= to)
      .sort((a, b) => a.symbol.localeCompare(b.symbol) || a.date.localeCompare(b.date));
  }
}
