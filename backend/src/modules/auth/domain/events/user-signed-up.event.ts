import { createEnvelope, type EventEnvelope } from '#core/events/event-envelope.ts';

export const USER_SIGNED_UP = 'auth.user_signed_up';

export type UserSignedUp = EventEnvelope<typeof USER_SIGNED_UP, { readonly userId: string }>;

export function userSignedUp(userId: string, occurredAt: Date): UserSignedUp {
  return createEnvelope({ type: USER_SIGNED_UP, version: 1, occurredAt, payload: { userId } });
}
