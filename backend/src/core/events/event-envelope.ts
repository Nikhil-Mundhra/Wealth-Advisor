import { randomUUID } from 'node:crypto';

// A fact one module publishes and others consume. Consumers dedupe on `id` and branch on `version`, so the
// payload shape of a given (type, version) never changes; a breaking change publishes a new version.
export interface EventEnvelope<T extends string = string, P = unknown> {
  readonly id: string;
  readonly type: T;
  readonly version: number;
  readonly occurredAt: Date;
  // The id of the envelope that started the chain; a root event carries its own id.
  readonly correlationId: string;
  readonly payload: P;
}

interface EnvelopeInput<T extends string, P> {
  readonly type: T;
  readonly version: number;
  readonly occurredAt: Date;
  readonly payload: P;
  readonly id?: string;
  readonly correlationId?: string;
}

export function createEnvelope<T extends string, P>(input: EnvelopeInput<T, P>): EventEnvelope<T, P> {
  const id = input.id ?? randomUUID();
  return Object.freeze({
    id,
    type: input.type,
    version: input.version,
    occurredAt: input.occurredAt,
    correlationId: input.correlationId ?? id,
    payload: input.payload,
  });
}
