import { invariant } from '#core/domain/invariant.ts';
import { ValueObject } from '#core/domain/value-object.ts';
import { isIsoDate } from '#core/time/calendar-date.ts';
import { MarketErrors } from './errors/market-errors.ts';
import type { Money } from './money.vo.ts';

export const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,14}$/;

// One end-of-day close, a raw fact: stored once per (symbol, date) and never updated. adjClose (split and dividend
// adjusted) is what returns are computed from; null when the provider sent none.
export interface PriceValue {
  readonly symbol: string;
  readonly date: string;
  readonly close: Money;
  readonly adjClose: Money | null;
  readonly source: string;
}

const broken = (detail: string) => () => MarketErrors.invariantViolated(`price ${detail}`);

export class Price extends ValueObject<PriceValue> {
  static of(value: PriceValue): Price {
    return ValueObject.fromStored({ ...value }, (v) => new Price(v));
  }

  get symbol(): string {
    return this.value.symbol;
  }

  get date(): string {
    return this.value.date;
  }

  get close(): Money {
    return this.value.close;
  }

  get adjClose(): Money | null {
    return this.value.adjClose;
  }

  get source(): string {
    return this.value.source;
  }

  protected override postInit(): void {
    const { symbol, date, close, adjClose, source } = this.value;
    invariant(SYMBOL_PATTERN.test(symbol), broken(`symbol "${symbol}" is malformed`));
    invariant(isIsoDate(date), broken(`date "${date}" is not YYYY-MM-DD`));
    invariant(close.amount > 0, broken(`${symbol} ${date} close is not positive`));
    invariant(adjClose === null || adjClose.amount > 0, broken(`${symbol} ${date} adjusted close is not positive`));
    invariant(adjClose === null || adjClose.currency === close.currency, broken(`${symbol} ${date} closes differ in currency`));
    invariant(source.length > 0, broken('has no source'));
  }
}
