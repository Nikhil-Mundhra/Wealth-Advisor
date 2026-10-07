import { ObjectId } from 'mongodb';
import { ROLES } from '@wealth-advisor/rules';
import { parseMember } from '#core/domain/parse-member.ts';
import type { Mapper } from '#core/db/mapping/mapper.ts';
import { PROVIDER_TYPES, User, USER_STATUSES } from '../../../domain/entities/user.entity.ts';
import { AuthErrors } from '../../../domain/errors/auth-errors.ts';
import { Email } from '../../../domain/value-objects/email.vo.ts';
import type { UserDocument } from '../documents/user.document.ts';

// Stored values outside the known lists are corruption (500), never silently dropped or cast.
const corrupt = (field: string) => () => AuthErrors.invariantViolated(`stored user has an unknown ${field}`);

export const userMapper: Mapper<User, UserDocument> = {
  toEntity(document) {
    return User.restore({
      id: document._id.toHexString(),
      tenantId: document.tenantId ? document.tenantId.toHexString() : null,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      email: Email.restore(document.email),
      emailVerifiedAt: document.emailVerifiedAt,
      passwordHash: document.passwordHash,
      displayName: document.displayName,
      status: parseMember(USER_STATUSES, document.status, corrupt('status')),
      roles: document.roles.map((role) => parseMember(ROLES, role, corrupt('role'))),
      providers: document.providers.map((provider) => ({ ...provider, type: parseMember(PROVIDER_TYPES, provider.type, corrupt('provider type')) })),
      consents: document.consents.map((consent) => ({ ...consent })),
      withdrawal: document.withdrawal ? { ...document.withdrawal } : null,
    });
  },

  toDocument(user) {
    const snapshot = user.toSnapshot();
    return {
      _id: new ObjectId(snapshot.id),
      tenantId: snapshot.tenantId ? new ObjectId(snapshot.tenantId) : null,
      email: snapshot.email.value,
      emailVerifiedAt: snapshot.emailVerifiedAt,
      passwordHash: snapshot.passwordHash,
      displayName: snapshot.displayName,
      status: snapshot.status,
      roles: [...snapshot.roles],
      providers: snapshot.providers.map((provider) => ({ ...provider })),
      consents: snapshot.consents.map((consent) => ({ ...consent })),
      withdrawal: snapshot.withdrawal ? { ...snapshot.withdrawal } : null,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    };
  },
};
