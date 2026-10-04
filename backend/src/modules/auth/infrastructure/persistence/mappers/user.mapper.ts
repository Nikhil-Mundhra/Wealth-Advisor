import { ObjectId } from 'mongodb';
import type { Mapper } from '#core/persistence/mapper.ts';
import { type ProviderType, User, type UserStatus } from '../../../domain/entities/user.entity.ts';
import { Email } from '../../../domain/value-objects/email.vo.ts';
import { isRole } from '../../../domain/value-objects/role.vo.ts';
import type { UserDocument } from '../documents/user.document.ts';

export const userMapper: Mapper<User, UserDocument> = {
  toEntity(document) {
    return User.restore({
      id: document._id.toHexString(),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      email: Email.of(document.email),
      emailVerifiedAt: document.emailVerifiedAt,
      passwordHash: document.passwordHash,
      displayName: document.displayName,
      status: document.status as UserStatus,
      roles: document.roles.filter(isRole),
      providers: document.providers.map((provider) => ({ ...provider, type: provider.type as ProviderType })),
      consents: document.consents.map((consent) => ({ ...consent })),
      withdrawal: document.withdrawal ? { ...document.withdrawal } : null,
    });
  },

  toDocument(user) {
    const snapshot = user.toSnapshot();
    return {
      _id: new ObjectId(snapshot.id),
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
