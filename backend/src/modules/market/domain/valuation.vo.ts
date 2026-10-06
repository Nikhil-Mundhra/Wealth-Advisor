import { invariant } from '#core/domain/invariant.ts';
import { ValueObject } from '#core/domain/value-object.ts';
import { MarketErrors } from './errors/market-errors.ts';
import type { Money } from './money.vo.ts';

export const CONVERSION_MODES = ['spot', 'historical', 'raw'] as const;
export type ConversionMode = (typeof CONVERSION_MODES)[number];

// A derived value with its provenance: which rate, published on which day, under which mode turned original
// into converted. rateDate is null when no rate was used (raw mode, or the same currency on both sides).
export interface ValuationValue {
  readonly original: Money;
  readonly converted: Money;
  readonly rate: number;
  readonly rateDate: string | null;
  readonly mode: ConversionMode;
}

const broken = (detail: string) => () => MarketErrors.invariantViolated(`valuation ${detail}`);

export class Valuation extends ValueObject<ValuationValue> {
  static of(value: ValuationValue): Valuation {
    return ValueObject.fromStored({ ...value }, (v) => new Valuation(v));
  }

  get original(): Money {
    return this.value.original;
  }

  get converted(): Money {
    return this.value.converted;
  }

  get rate(): number {
    return this.value.rate;
  }

  get rateDate(): string | null {
    return this.value.rateDate;
  }

  get mode(): ConversionMode {
    return this.value.mode;
  }

  protected override postInit(): void {
    const { original, converted, rate, rateDate, mode } = this.value;
    invariant(Number.isFinite(rate) && rate > 0, broken('rate is not a positive number'));
    const unconverted = original.currency === converted.currency;
    invariant(!unconverted || (rate === 1 && converted.equals(original)), broken('same currency must keep the amount at rate 1'));
    invariant(mode !== 'raw' || unconverted, broken('raw mode must not convert'));
    invariant(unconverted === (rateDate === null), broken('rateDate is set exactly when a rate was used'));
  }
}
