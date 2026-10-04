// Keyed registry for interchangeable implementations (e.g. OAuth providers): add a strategy by registering it,
// without touching the code that resolves it.
export class StrategyRegistry<Key extends string, Strategy> {
  private readonly strategies = new Map<Key, Strategy>();
  private readonly kind: string;

  constructor(kind: string) {
    this.kind = kind;
  }

  register(key: Key, strategy: Strategy): this {
    if (this.strategies.has(key)) throw new Error(`${this.kind} "${key}" is already registered`);
    this.strategies.set(key, strategy);
    return this;
  }

  resolve(key: Key): Strategy {
    const strategy = this.strategies.get(key);
    if (!strategy) throw new Error(`no ${this.kind} registered for "${key}"`);
    return strategy;
  }

  keys(): Key[] {
    return [...this.strategies.keys()];
  }
}
