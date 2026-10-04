import type { DomainEvent } from '#core/domain/domain-event.ts';

export const USER_SIGNED_UP = 'auth.user_signed_up';

export type UserSignedUp = DomainEvent<typeof USER_SIGNED_UP, { readonly userId: string }>;

export function userSignedUp(userId: string, occurredAt: Date): UserSignedUp {
  return { name: USER_SIGNED_UP, occurredAt, payload: { userId } };
}
