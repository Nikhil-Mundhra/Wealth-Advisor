import { CURRENCY_MINOR_UNITS, type Currency, isCurrency } from '@wealth-advisor/rules';
import { invariant } from '#core/domain/invariant.ts';
import { ValueObject } from '#core/domain/value-object.ts';
import type { ValueRule } from '#core/domain/value-rule.ts';
import { type Ratio, ratioOf, roundHalfEven, scaleByPowerOfTen } from './decimal.ts';
import { MarketErrors } from './errors/market-errors.ts';

export interface MoneyValue {
  readonly amount: number; // integer, minor units of the currency
  readonly currency: Currency;
}

const MONEY_RULE: ValueRule<MoneyValue> = {
  check: (value) => Number.isSafeInteger(value.amount) && isCurrency(value.currency),
  reject: () => MarketErrors.invariantViolated('money needs a safe integer amount and a known currency'),
};

export class Money extends ValueObject<MoneyValue> {
  static of(amount: number, currency: Currency): Money {
    return ValueObject.fromInput(MONEY_RULE, { amount, currency }, (value) => new Money(value));
  }

  // A decimal in major units (12.345 USD) → minor units, rounded half to even.
  static fromMajor(major: number, currency: Currency): Money {
    return Money.fromRatio(ratioOf(major), currency);
  }

  static fromRatio(major: Ratio, currency: Currency): Money {
    const minor = roundHalfEven(scaleByPowerOfTen(major, CURRENCY_MINOR_UNITS[currency]));
    if (minor > BigInt(Number.MAX_SAFE_INTEGER) || minor < BigInt(Number.MIN_SAFE_INTEGER)) {
      throw MarketErrors.invariantViolated('money amount exceeds the safe integer range');
    }
    return Money.of(Number(minor), currency);
  }

  static restore(stored: MoneyValue): Money {
    return ValueObject.fromStored({ amount: stored.amount, currency: stored.currency }, (value) => new Money(value));
  }

  get amount(): number {
    return this.value.amount;
  }

  get currency(): Currency {
    return this.value.currency;
  }

  // The amount as an exact ratio of major units (1234 cents → 1234/100).
  toMajorRatio(): Ratio {
    return scaleByPowerOfTen({ num: BigInt(this.amount), den: 1n }, -CURRENCY_MINOR_UNITS[this.currency]);
  }

  protected override postInit(): void {
    invariant(Number.isSafeInteger(this.amount), () => MarketErrors.invariantViolated('money amount is not an integer'));
    invariant(isCurrency(this.currency), () => MarketErrors.invariantViolated(`unknown currency ${this.currency}`));
  }
}
