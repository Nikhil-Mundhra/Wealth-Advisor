import type { EventEnvelope } from './event-envelope.ts';

export type EventHandler = (event: EventEnvelope) => Promise<void> | void;

export interface EventSubscription {
  readonly eventType: string;
  readonly handler: EventHandler;
}

export interface EventBus {
  publish(event: EventEnvelope): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
}

// Runs handlers in-process, in order, after the publisher's own writes. A failing handler is logged and never
// fails the caller. A durable outbox can replace this class behind the same interface.
export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish(event: EventEnvelope): Promise<void> {
    for (const handler of this.handlers.get(event.type) ?? []) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[event-bus] handler for ${event.type} v${event.version} (${event.id}) failed`, error);
      }
    }
  }
}
