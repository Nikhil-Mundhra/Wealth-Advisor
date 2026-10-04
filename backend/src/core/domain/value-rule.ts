// What a value object enforces on input from outside the system.
export interface ValueRule<V> {
  readonly normalize?: (raw: V) => V;
  readonly check: (value: V) => boolean;
  readonly reject: () => Error;
}
