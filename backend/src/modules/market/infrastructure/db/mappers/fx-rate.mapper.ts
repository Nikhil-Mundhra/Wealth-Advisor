import { FxRate } from '../../../domain/fx-rate.vo.ts';
import type { FxRateDocument } from '../documents/fx-rate.document.ts';
import { storedCurrency } from './stored-currency.ts';

export const fxRateMapper = {
  toDocument(rate: FxRate, createdAt: Date): FxRateDocument {
    return { ...rate.value, createdAt };
  },

  toDomain(document: FxRateDocument): FxRate {
    return FxRate.of({
      base: storedCurrency(document.base),
      quote: storedCurrency(document.quote),
      date: document.date,
      rate: document.rate,
      source: document.source,
    });
  },
};
