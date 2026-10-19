import { ObjectId } from 'mongodb';
import { DEFAULT_TENANT_ID } from '#core/db/document-id.ts';
import type {
  AdminUserFilters,
  AdminUserRecord,
  AdminUserRepository,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from '../../../application/ports.ts';
import { type UserDoc, toAdminUserRecord } from '../repositories/mongo-admin-user.repository.ts';

export class MemoryAdminUserRepository implements AdminUserRepository {
  private readonly documents: Map<string, UserDoc>;

  constructor(documents?: Map<string, UserDoc>) {
    this.documents = documents ?? new Map<string, UserDoc>();
    if (!documents && this.documents.size === 0) {
      const now = new Date();
      const demoId = new ObjectId('507f1f77bcf86cd799439011');
      const tenantId = new ObjectId(DEFAULT_TENANT_ID);
      this.documents.set(demoId.toHexString(), {
        _id: demoId,
        tenantId,
        email: 'testing@example.com',
        displayName: 'Demo Advisor',
        status: 'ACTIVE',
        roles: ['USER', 'ADMIN'],
        emailVerifiedAt: now,
        passwordHash: 'scrypt$131072$8$1$c2FsdA==$a2V5',
        providers: [
          {
            type: 'EMAIL',
            subject: 'testing@example.com',
            email: 'testing@example.com',
            linkedAt: now,
            lastLoginAt: now,
          },
        ],
        consents: [],
        withdrawal: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async findAll(filters?: AdminUserFilters): Promise<AdminUserRecord[]> {
    let docs = Array.from(this.documents.values());

    if (filters?.role && filters.role !== 'ALL') {
      docs = docs.filter((d) => d.roles.includes(filters.role!));
    }

    if (filters?.status && filters.status !== 'ALL') {
      docs = docs.filter((d) => d.status === filters.status);
    }

    if (filters?.tenantId && filters.tenantId !== 'ALL') {
      docs = docs.filter((d) => d.tenantId?.toHexString() === filters.tenantId);
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      docs = docs.filter(
        (d) =>
          d.email.toLowerCase().includes(q) ||
          (d.displayName && d.displayName.toLowerCase().includes(q)),
      );
    }

    docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return docs.map(toAdminUserRecord);
  }

  async findById(id: string): Promise<AdminUserRecord | null> {
    const doc = this.documents.get(id);
    return doc ? toAdminUserRecord(doc) : null;
  }

  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    const normalized = email.toLowerCase().trim();
    for (const doc of this.documents.values()) {
      if (doc.email.toLowerCase().trim() === normalized) {
        return toAdminUserRecord(doc);
      }
    }
    return null;
  }

  async create(input: CreateAdminUserInput): Promise<AdminUserRecord> {
    const id = new ObjectId();
    const now = new Date();
    const normalizedEmail = input.email.toLowerCase().trim();
    const tenantObjectId = input.tenantId ? new ObjectId(input.tenantId) : null;

    const doc: UserDoc = {
      _id: id,
      tenantId: tenantObjectId,
      email: normalizedEmail,
      displayName: input.displayName ?? null,
      passwordHash: input.passwordHash,
      status: 'ACTIVE',
      roles: input.roles,
      emailVerifiedAt: null,
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

    this.documents.set(id.toHexString(), doc);
    return toAdminUserRecord(doc);
  }

  async update(id: string, input: UpdateAdminUserInput): Promise<AdminUserRecord | null> {
    const doc = this.documents.get(id);
    if (!doc) return null;

    if (input.displayName !== undefined) {
      doc.displayName = input.displayName;
    }
    if (input.roles !== undefined) {
      doc.roles = input.roles;
    }
    if (input.status !== undefined) {
      doc.status = input.status;
      if (input.status === 'WITHDRAWN') {
        doc.withdrawal = { at: new Date(), reason: 'Admin console withdrawal' };
      } else {
        doc.withdrawal = null;
      }
    }
    if (input.tenantId !== undefined) {
      doc.tenantId = input.tenantId ? new ObjectId(input.tenantId) : null;
    }
    if (input.emailVerified !== undefined) {
      doc.emailVerifiedAt = input.emailVerified ? new Date() : null;
    }
    doc.updatedAt = new Date();

    return toAdminUserRecord(doc);
  }

  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;
    doc.passwordHash = passwordHash;
    doc.updatedAt = new Date();
    return true;
  }

  async delete(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }
}
