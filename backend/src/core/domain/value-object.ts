import { isDeepStrictEqual } from 'node:util';
import type { ValueRule } from './value-rule.ts';

// Two ways in, each finishing in finalize() → postInit() → freeze (never in the constructor, where subclass
// fields do not exist yet and freezing would break their initializers):
// - fromInput: data from outside the system; the subclass's rule normalizes and checks it first.
// - fromStored: data the system wrote earlier; the creation rule may have tightened since, so only postInit runs.
export abstract class ValueObject<V> {
  readonly value: V;

  protected constructor(value: V) {
    this.value = value;
  }

  protected static fromInput<V, T extends ValueObject<V>>(rule: ValueRule<V>, raw: V, construct: (value: V) => T): T {
    const value = rule.normalize ? rule.normalize(raw) : raw;
    if (!rule.check(value)) throw rule.reject();
    return ValueObject.finalize(construct(value));
  }

  protected static fromStored<V, T extends ValueObject<V>>(stored: V, construct: (value: V) => T): T {
    return ValueObject.finalize(construct(stored));
  }

  protected static finalize<T extends ValueObject<unknown>>(valueObject: T): T {
    valueObject.postInit();
    Object.freeze(valueObject);
    return valueObject;
  }

  // Invariants that hold for every instance, including stored ones; throw to reject.
  protected postInit(): void {}

  equals(other: ValueObject<V>): boolean {
    return other.constructor === this.constructor && isDeepStrictEqual(other.value, this.value);
  }

  toString(): string {
    return String(this.value);
  }
}
