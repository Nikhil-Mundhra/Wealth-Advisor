import type { ClientType } from '@wealth-advisor/rules';
import { BaseEntity, type EntityProps } from '#core/domain/base-entity.ts';
import { invariant } from '#core/domain/invariant.ts';
import { AuthErrors } from '../errors/auth-errors.ts';
import type { TokenHash } from '../value-objects/token-hash.vo.ts';

export type { ClientType };

export const REVOKE_REASONS = ['ROTATED', 'LOGOUT', 'LOGOUT_ALL', 'REUSE_DETECTED', 'PASSWORD_CHANGED', 'USER_WITHDRAWN'] as const;
export type RevokeReason = (typeof REVOKE_REASONS)[number];

export interface SessionProps extends EntityProps {
  userId: string;
  tokenHash: TokenHash;
  familyId: string;
  replacedBy: string | null;
  clientType: ClientType;
  rememberMe: boolean;
  issuedAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  revokeReason: RevokeReason | null;
}

interface StartFamilyInput {
  id: string;
  familyId: string;
  userId: string;
  tokenHash: TokenHash;
  clientType: ClientType;
  rememberMe: boolean;
  now: Date;
  ttlSeconds: number;
}

interface RotateInput {
  childId: string;
  childTokenHash: TokenHash;
  now: Date;
  ttlSeconds: number;
}

const addSeconds = (date: Date, seconds: number): Date => new Date(date.getTime() + seconds * 1000);

// One refresh token's server-side state. Sessions created by rotating each other share a familyId.
export class Session extends BaseEntity<SessionProps> {
  static startFamily(input: StartFamilyInput): Session {
    return BaseEntity.finalize(
      new Session({
        id: input.id,
        createdAt: input.now,
        updatedAt: input.now,
        userId: input.userId,
        tokenHash: input.tokenHash,
        familyId: input.familyId,
        replacedBy: null,
        clientType: input.clientType,
        rememberMe: input.rememberMe,
        issuedAt: input.now,
        expiresAt: addSeconds(input.now, input.ttlSeconds),
        lastUsedAt: null,
        revokedAt: null,
        revokeReason: null,
      }),
    );
  }

  static restore(props: SessionProps): Session {
    return BaseEntity.finalize(new Session(props));
  }

  protected override postInit(): void {
    const { issuedAt, expiresAt, revokedAt, revokeReason, replacedBy } = this.props;
    const violated = (detail: string) => () => AuthErrors.invariantViolated(detail);
    invariant(expiresAt > issuedAt, violated('a session must expire after it is issued'));
    invariant((revokedAt === null) === (revokeReason === null), violated('revokedAt and revokeReason are set together'));
    invariant(replacedBy === null || revokeReason === 'ROTATED', violated('only a rotated session has a replacement'));
  }

  get userId(): string {
    return this.props.userId;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get clientType(): ClientType {
    return this.props.clientType;
  }

  get rememberMe(): boolean {
    return this.props.rememberMe;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  get revokeReason(): RevokeReason | null {
    return this.props.revokeReason;
  }

  isActive(now: Date): boolean {
    return this.props.revokedAt === null && this.props.expiresAt > now;
  }

  // Revokes this session as ROTATED and returns its child: same family, client and rememberMe, with a fresh
  // expiry. The family's lifetime therefore slides with each rotation.
  rotate(input: RotateInput): Session {
    if (!this.isActive(input.now)) throw AuthErrors.invariantViolated('only an active session can rotate');
    const child = BaseEntity.finalize(
      new Session({
        id: input.childId,
        createdAt: input.now,
        updatedAt: input.now,
        userId: this.props.userId,
        tokenHash: input.childTokenHash,
        familyId: this.props.familyId,
        replacedBy: null,
        clientType: this.props.clientType,
        rememberMe: this.props.rememberMe,
        issuedAt: input.now,
        expiresAt: addSeconds(input.now, input.ttlSeconds),
        lastUsedAt: null,
        revokedAt: null,
        revokeReason: null,
      }),
    );
    this.props.replacedBy = child.id;
    this.props.lastUsedAt = input.now;
    this.revoke('ROTATED', input.now);
    this.assertInvariants();
    return child;
  }

  // First revoke wins; later calls are no-ops and return false.
  revoke(reason: RevokeReason, now: Date): boolean {
    if (this.props.revokedAt !== null) return false;
    this.props.revokedAt = now;
    this.props.revokeReason = reason;
    this.props.updatedAt = now;
    this.assertInvariants();
    return true;
  }

  toSnapshot(): SessionProps {
    return { ...this.props };
  }
}
