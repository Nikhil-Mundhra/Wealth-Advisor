import { Session } from '#modules/auth/domain/entities/session.entity.ts';
import { TokenHash } from '#modules/auth/domain/value-objects/token-hash.vo.ts';

export const T0 = new Date('2026-10-01T00:00:00.000Z');
export const DAY_SECONDS = 24 * 60 * 60;

export const hashOf = (char: string): TokenHash => TokenHash.of(char.repeat(64));

export const secondsAfter = (date: Date, seconds: number): Date => new Date(date.getTime() + seconds * 1000);

export function activeSession(overrides: { now?: Date; ttlSeconds?: number } = {}): Session {
  return Session.startFamily({
    id: 'session-1',
    familyId: 'family-1',
    userId: 'user-1',
    tokenHash: hashOf('a'),
    clientType: 'IOS',
    rememberMe: false,
    now: overrides.now ?? T0,
    ttlSeconds: overrides.ttlSeconds ?? 14 * DAY_SECONDS,
  });
}
