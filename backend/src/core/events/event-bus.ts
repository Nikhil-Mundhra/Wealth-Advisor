import type { DomainEvent } from '#core/domain/domain-event.ts';

export type EventHandler = (event: DomainEvent) => Promise<void> | void;

export interface EventSubscription {
  readonly eventName: string;
  readonly handler: EventHandler;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: string, handler: EventHandler): void;
}

// Runs handlers in-process, in order, after the publisher's own writes. A failing handler is logged and never
// fails the caller. A durable outbox can replace this class behind the same interface.
export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe(eventName: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventName) ?? [];
    this.handlers.set(eventName, [...existing, handler]);
  }

  async publish(event: DomainEvent): Promise<void> {
    for (const handler of this.handlers.get(event.name) ?? []) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[event-bus] handler for ${event.name} failed`, error);
      }
    }
  }
}
