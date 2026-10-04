import type { Session } from '../entities/session.entity.ts';

export type RotationDecision =
  | { readonly kind: 'ROTATE' }
  | { readonly kind: 'ALREADY_ROTATED' }
  | { readonly kind: 'REUSE_DETECTED'; readonly familyId: string }
  | { readonly kind: 'INVALID' };

// What a refresh request presenting this session's token should do. Pure: no I/O, time is passed in.
// A token rotated within the grace window is treated as a client retry (409, family kept); after the window
// it is treated as theft (revoke the whole family, 401).
export function decideRotation(session: Session | null, now: Date, reuseGraceSeconds: number): RotationDecision {
  if (!session) return { kind: 'INVALID' };
  if (session.revokeReason === 'ROTATED' && session.revokedAt) {
    const sinceRotation = now.getTime() - session.revokedAt.getTime();
    return sinceRotation <= reuseGraceSeconds * 1000
      ? { kind: 'ALREADY_ROTATED' }
      : { kind: 'REUSE_DETECTED', familyId: session.familyId };
  }
  if (!session.isActive(now)) return { kind: 'INVALID' };
  return { kind: 'ROTATE' };
}
