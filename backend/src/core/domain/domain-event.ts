// Something that happened in a module, published after the change is persisted.
export interface DomainEvent<N extends string = string, P = unknown> {
  readonly name: N;
  readonly occurredAt: Date;
  readonly payload: P;
}
