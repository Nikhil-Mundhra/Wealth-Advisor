import { BaseEntity, type EntityProps } from '#core/domain/base-entity.ts';
import { AuthErrors } from '../errors/auth-errors.ts';
import type { Email } from '../value-objects/email.vo.ts';
import { DEFAULT_ROLES, type Role } from '../value-objects/role.vo.ts';

export const PROVIDER_TYPES = ['EMAIL'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const USER_STATUSES = ['ACTIVE', 'WITHDRAWN'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

const MAX_PROVIDERS = 5;

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
  email: Email;
  passwordHash: string;
  displayName: string | null;
  now: Date;
}

// The account root. Login methods, roles, consents and withdrawal are embedded, so creating a user is one write.
export class User extends BaseEntity<UserProps> {
  static registerWithEmail(input: RegisterWithEmailInput): User {
    return BaseEntity.finalize(
      new User({
        id: input.id,
        createdAt: input.now,
        updatedAt: input.now,
        email: input.email,
        emailVerifiedAt: null,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
        status: 'ACTIVE',
        roles: [...DEFAULT_ROLES],
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
    const { roles, providers, status, withdrawal, passwordHash } = this.props;
    if (!roles.includes('USER')) throw AuthErrors.invariantViolated('every user holds the USER role');
    if (providers.length > MAX_PROVIDERS) throw AuthErrors.invariantViolated(`at most ${MAX_PROVIDERS} providers`);
    if (status === 'ACTIVE' && providers.length === 0) throw AuthErrors.invariantViolated('an active user needs a provider');
    if (status === 'WITHDRAWN' && !withdrawal) throw AuthErrors.invariantViolated('a withdrawn user needs a withdrawal record');
    const keys = new Set(providers.map((provider) => `${provider.type}:${provider.subject}`));
    if (keys.size !== providers.length) throw AuthErrors.invariantViolated('duplicate provider link');
    if (providers.some((provider) => provider.type === 'EMAIL') && !passwordHash) {
      throw AuthErrors.invariantViolated('an EMAIL provider requires a password hash');
    }
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
  }

  // Full state for the persistence mapper; a copy, so callers cannot mutate the entity through it.
  toSnapshot(): UserProps {
    return { ...this.props, roles: [...this.props.roles], providers: this.props.providers.map((p) => ({ ...p })) };
  }
}
