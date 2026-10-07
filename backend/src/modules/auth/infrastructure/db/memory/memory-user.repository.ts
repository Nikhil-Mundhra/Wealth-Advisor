import type { InsertUserOutcome, UserRepositoryPort } from '../../../application/ports/user-repository.port.ts';
import type { ProviderType, User } from '../../../domain/entities/user.entity.ts';
import type { UserDocument } from '../documents/user.document.ts';
import { userMapper } from '../mappers/user.mapper.ts';

// UserRepositoryPort in process memory for local runs without a database. Stores mapper output, so the same
// mapping and invariants apply as on MongoDB; active-provider uniqueness mirrors the partial unique index.
export class MemoryUserRepository implements UserRepositoryPort {
  private readonly documents = new Map<string, UserDocument>();

  async insert(user: User): Promise<InsertUserOutcome> {
    const document = userMapper.toDocument(user);
    const taken =
      [...this.documents.values()].some((other) => other.status === 'ACTIVE' && other.email === document.email) ||
      document.providers.some((provider) => this.findActiveDocument(provider.type, provider.subject));
    if (taken) return 'DUPLICATE_IDENTITY';
    this.documents.set(document._id.toHexString(), document);
    return 'INSERTED';
  }

  async findActiveByProvider(type: ProviderType, subject: string): Promise<User | null> {
    const document = this.findActiveDocument(type, subject);
    return document ? userMapper.toEntity(document) : null;
  }

  async findActiveById(id: string): Promise<User | null> {
    const document = this.documents.get(id);
    return document && document.status === 'ACTIVE' ? userMapper.toEntity(document) : null;
  }

  async save(user: User): Promise<void> {
    const document = userMapper.toDocument(user);
    this.documents.set(document._id.toHexString(), document);
  }

  async deleteById(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  private findActiveDocument(type: string, subject: string): UserDocument | undefined {
    for (const document of this.documents.values()) {
      if (document.status === 'ACTIVE' && document.providers.some((p) => p.type === type && p.subject === subject)) return document;
    }
    return undefined;
  }
}
