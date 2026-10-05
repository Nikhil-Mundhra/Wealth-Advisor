import { Money } from '../../../domain/money.vo.ts';
import { Price } from '../../../domain/price.vo.ts';
import type { MoneyDocument, PriceDocument } from '../documents/price.document.ts';
import { storedCurrency } from './stored-currency.ts';

// Facts carry no id or update time in the domain; createdAt is stamped by the repository on insert.
export const priceMapper = {
  toDocument(price: Price, createdAt: Date): PriceDocument {
    return {
      symbol: price.symbol,
      date: price.date,
      close: { ...price.close.value },
      adjClose: price.adjClose ? { ...price.adjClose.value } : null,
      source: price.source,
      createdAt,
    };
  },

  toDomain(document: PriceDocument): Price {
    return Price.of({
      symbol: document.symbol,
      date: document.date,
      close: restoreMoney(document.close),
      adjClose: document.adjClose ? restoreMoney(document.adjClose) : null,
      source: document.source,
    });
  },
};

function restoreMoney(document: MoneyDocument): Money {
  return Money.restore({ amount: document.amount, currency: storedCurrency(document.currency) });
}
