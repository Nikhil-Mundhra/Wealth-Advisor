import type { ObjectId } from 'mongodb';

export const USERS_COLLECTION = 'users';

// Stored shape of a user. Enum-like fields are plain strings here; the collection's $jsonSchema enforces them.
export interface UserDocument {
  _id: ObjectId;
  tenantId?: ObjectId | null;
  email: string;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
  displayName: string | null;
  status: string;
  roles: string[];
  providers: { type: string; subject: string; email: string | null; linkedAt: Date; lastLoginAt: Date | null }[];
  consents: { termsType: string; version: string; locale: string; agreed: boolean; decidedAt: Date }[];
  withdrawal: { at: Date; reason: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}
