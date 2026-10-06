import type { Currency } from '@wealth-advisor/rules';
import { invariant } from '#core/domain/invariant.ts';
import { ValueObject } from '#core/domain/value-object.ts';
import { isIsoDate } from '#core/time/calendar-date.ts';
import { MarketErrors } from './errors/market-errors.ts';

// One published rate, a raw fact: `rate` units of quote per one unit of base on `date`; stored once per
// (base, quote, date) and never updated.
export interface FxRateValue {
  readonly base: Currency;
  readonly quote: Currency;
  readonly date: string;
  readonly rate: number;
  readonly source: string;
}

const broken = (detail: string) => () => MarketErrors.invariantViolated(`fx rate ${detail}`);

export class FxRate extends ValueObject<FxRateValue> {
  static of(value: FxRateValue): FxRate {
    return ValueObject.fromStored({ ...value }, (v) => new FxRate(v));
  }

  get base(): Currency {
    return this.value.base;
  }

  get quote(): Currency {
    return this.value.quote;
  }

  get date(): string {
    return this.value.date;
  }

  get rate(): number {
    return this.value.rate;
  }

  get source(): string {
    return this.value.source;
  }

  protected override postInit(): void {
    const { base, quote, date, rate, source } = this.value;
    invariant(base !== quote, broken(`${base}/${quote} quotes a currency against itself`));
    invariant(isIsoDate(date), broken(`date "${date}" is not YYYY-MM-DD`));
    invariant(Number.isFinite(rate) && rate > 0, broken(`${base}/${quote} ${date} is not a positive number`));
    invariant(source.length > 0, broken('has no source'));
  }
}
