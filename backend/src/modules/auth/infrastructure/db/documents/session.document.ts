import type { ObjectId } from 'mongodb';

export const SESSIONS_COLLECTION = 'sessions';

// Stored shape of a refresh session. purgeAt drives the TTL index that deletes the row a while after expiry.
export interface SessionDocument {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  familyId: ObjectId;
  replacedBy: ObjectId | null;
  clientType: string;
  rememberMe: boolean;
  issuedAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  revokeReason: string | null;
  purgeAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
