import { type Collection, ObjectId } from 'mongodb';
import { toDocumentId, toScopeId, DEFAULT_TENANT_ID } from '#core/db/document-id.ts';
import type {
  AdminUserFilters,
  AdminUserRecord,
  AdminUserRepository,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from '../../../application/ports.ts';

export interface UserDoc {
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

export function toAdminUserRecord(doc: UserDoc): AdminUserRecord {
  return {
    id: doc._id.toHexString(),
    tenantId: doc.tenantId ? doc.tenantId.toHexString() : null,
    email: doc.email,
    displayName: doc.displayName,
    status: (doc.status as any) ?? 'ACTIVE',
    roles: (doc.roles as any) ?? ['USER'],
    emailVerified: doc.emailVerifiedAt !== null,
    providers: (doc.providers ?? []).map((p) => ({
      type: p.type,
      subject: p.subject,
      email: p.email,
      linkedAt: p.linkedAt,
      lastLoginAt: p.lastLoginAt,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoAdminUserRepository implements AdminUserRepository {
  private readonly col: () => Promise<Collection<UserDoc>>;

  constructor(col: () => Promise<Collection<UserDoc>>) {
    this.col = col;
  }

  async findAll(filters?: AdminUserFilters): Promise<AdminUserRecord[]> {
    const query: Record<string, any> = {};

    if (filters?.role && filters.role !== 'ALL') {
      query.roles = filters.role;
    }

    if (filters?.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }

    if (filters?.tenantId && filters.tenantId !== 'ALL') {
      const tId = toScopeId(filters.tenantId, DEFAULT_TENANT_ID);
      if (tId) {
        query.tenantId = tId;
      }
    }

    if (filters?.query) {
      const q = filters.query.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [{ email: regex }, { displayName: regex }];
    }

    const docs = await (await this.col()).find(query).sort({ createdAt: -1 }).toArray();
    return docs.map(toAdminUserRecord);
  }

  async findById(id: string): Promise<AdminUserRecord | null> {
    const docId = toDocumentId(id);
    if (!docId) return null;
    const doc = await (await this.col()).findOne({ _id: docId });
    return doc ? toAdminUserRecord(doc) : null;
  }

  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    const normalized = email.toLowerCase().trim();
    const doc = await (await this.col()).findOne({ email: normalized });
    return doc ? toAdminUserRecord(doc) : null;
  }

  async create(input: CreateAdminUserInput): Promise<AdminUserRecord> {
    const id = new ObjectId();
    const now = new Date();
    const tenantObjectId = input.tenantId ? toScopeId(input.tenantId, DEFAULT_TENANT_ID) : null;
    const normalizedEmail = input.email.toLowerCase().trim();

    const doc: UserDoc = {
      _id: id,
      tenantId: tenantObjectId,
      email: normalizedEmail,
      emailVerifiedAt: null,
      passwordHash: input.passwordHash,
      displayName: input.displayName ?? null,
      status: 'ACTIVE',
      roles: input.roles,
      providers: [
        {
          type: 'EMAIL',
          subject: normalizedEmail,
          email: normalizedEmail,
          linkedAt: now,
          lastLoginAt: null,
        },
      ],
      consents: [],
      withdrawal: null,
      createdAt: now,
      updatedAt: now,
    };

    await (await this.col()).insertOne(doc as any);
    return toAdminUserRecord(doc);
  }

  async update(id: string, input: UpdateAdminUserInput): Promise<AdminUserRecord | null> {
    const docId = toDocumentId(id);
    if (!docId) return null;

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (input.displayName !== undefined) {
      updates.displayName = input.displayName;
    }
    if (input.roles !== undefined) {
      updates.roles = input.roles;
    }
    if (input.status !== undefined) {
      updates.status = input.status;
      if (input.status === 'WITHDRAWN') {
        updates.withdrawal = { at: new Date(), reason: 'Admin console withdrawal' };
      } else {
        updates.withdrawal = null;
      }
    }
    if (input.tenantId !== undefined) {
      updates.tenantId = input.tenantId ? toScopeId(input.tenantId, DEFAULT_TENANT_ID) : null;
    }
    if (input.emailVerified !== undefined) {
      updates.emailVerifiedAt = input.emailVerified ? new Date() : null;
    }

    const res = await (await this.col()).findOneAndUpdate(
      { _id: docId },
      { $set: updates },
      { returnDocument: 'after' },
    );
    return res ? toAdminUserRecord(res) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const docId = toDocumentId(id);
    if (!docId) return false;
    const res = await (await this.col()).updateOne(
      { _id: docId },
      { $set: { passwordHash, updatedAt: new Date() } },
    );
    return res.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const docId = toDocumentId(id);
    if (!docId) return false;
    const res = await (await this.col()).deleteOne({ _id: docId });
    return res.deletedCount === 1;
  }
}
