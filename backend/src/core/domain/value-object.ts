import { isDeepStrictEqual } from 'node:util';

// Same construction rule as BaseEntity: finalize() validates, then freezes. Freezing inside the constructor
// would make subclass field initializers throw.
export abstract class ValueObject<V> {
  readonly value: V;

  protected constructor(value: V) {
    this.value = value;
  }

  protected static finalize<T extends ValueObject<unknown>>(valueObject: T): T {
    valueObject.postInit();
    Object.freeze(valueObject);
    return valueObject;
  }

  // Override to validate; throw to reject the value.
  protected postInit(): void {}

  equals(other: ValueObject<V>): boolean {
    return other.constructor === this.constructor && isDeepStrictEqual(other.value, this.value);
  }

  toString(): string {
    return String(this.value);
  }
}
