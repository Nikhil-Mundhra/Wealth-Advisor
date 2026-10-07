import { DEFAULT_ROLES, DISPLAY_NAME_MAX_LENGTH, type Role } from '@wealth-advisor/rules';
import { BaseEntity, type EntityProps } from '#core/domain/base-entity.ts';
import { invariant } from '#core/domain/invariant.ts';
import { AuthErrors } from '../errors/auth-errors.ts';
import type { Email } from '../value-objects/email.vo.ts';

export const PROVIDER_TYPES = ['EMAIL'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const USER_STATUSES = ['ACTIVE', 'WITHDRAWN'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const MAX_PROVIDERS = 5;

export interface LinkedProvider {
  type: ProviderType;
  subject: string;
  email: string | null;
  linkedAt: Date;
  lastLoginAt: Date | null;
}

export interface Consent {
  termsType: string;
  version: string;
  locale: string;
  agreed: boolean;
  decidedAt: Date;
}

export interface Withdrawal {
  at: Date;
  reason: string | null;
}

export interface UserProps extends EntityProps {
  tenantId: string | null;
  email: Email;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
  displayName: string | null;
  status: UserStatus;
  roles: Role[];
  providers: LinkedProvider[];
  consents: Consent[];
  withdrawal: Withdrawal | null;
}

interface RegisterWithEmailInput {
  id: string;
  tenantId?: string | null;
  email: Email;
  passwordHash: string;
  displayName: string | null;
  now: Date;
  roles?: Role[];
}

// The account root. Login methods, roles, consents and withdrawal are embedded, so creating a user is one write.
export class User extends BaseEntity<UserProps> {
  static registerWithEmail(input: RegisterWithEmailInput): User {
    return BaseEntity.finalize(
      new User({
        id: input.id,
        tenantId: input.tenantId ?? null,
        createdAt: input.now,
        updatedAt: input.now,
        email: input.email,
        emailVerifiedAt: null,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
        status: 'ACTIVE',
        roles: input.roles ? [...input.roles] : [...DEFAULT_ROLES],
        providers: [{ type: 'EMAIL', subject: input.email.value, email: input.email.value, linkedAt: input.now, lastLoginAt: null }],
        consents: [],
        withdrawal: null,
      }),
    );
  }

  static restore(props: UserProps): User {
    return BaseEntity.finalize(new User(props));
  }

  protected override postInit(): void {
    const { roles, providers, status, withdrawal, passwordHash, displayName } = this.props;
    const violated = (detail: string) => () => AuthErrors.invariantViolated(detail);
    invariant(roles.includes('USER'), violated('every user holds the USER role'));
    invariant(providers.length <= MAX_PROVIDERS, violated(`at most ${MAX_PROVIDERS} providers`));
    invariant(status !== 'ACTIVE' || providers.length > 0, violated('an active user needs a provider'));
    invariant(status !== 'WITHDRAWN' || withdrawal !== null, violated('a withdrawn user needs a withdrawal record'));
    invariant(new Set(providers.map((p) => `${p.type}:${p.subject}`)).size === providers.length, violated('duplicate provider link'));
    invariant(!providers.some((p) => p.type === 'EMAIL') || passwordHash !== null, violated('an EMAIL provider requires a password hash'));
    invariant(displayName === null || (displayName.length > 0 && displayName.length <= DISPLAY_NAME_MAX_LENGTH), violated('display name length'));
  }

  get tenantId(): string | null {
    return this.props.tenantId;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string | null {
    return this.props.passwordHash;
  }

  get displayName(): string | null {
    return this.props.displayName;
  }

  get roles(): readonly Role[] {
    return this.props.roles;
  }

  get isEmailVerified(): boolean {
    return this.props.emailVerifiedAt !== null;
  }

  recordLogin(type: ProviderType, now: Date): void {
    const provider = this.props.providers.find((candidate) => candidate.type === type);
    if (!provider) throw AuthErrors.invariantViolated(`user has no ${type} provider`);
    provider.lastLoginAt = now;
    this.props.updatedAt = now;
    this.assertInvariants();
  }

  // Full state for the persistence mapper; a copy, so callers cannot mutate the entity through it.
  toSnapshot(): UserProps {
    return { ...this.props, roles: [...this.props.roles], providers: this.props.providers.map((p) => ({ ...p })) };
  }
}
