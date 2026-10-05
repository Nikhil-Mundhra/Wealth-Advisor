import { ObjectId } from 'mongodb';
import type { Clock } from '#core/time/clock.ts';
import { BaseRepository, type CollectionProvider } from '#core/db/repository/base-repository.ts';
import { classifyDbError } from '#core/db/errors/classify-db-error.ts';
import type { ProviderType, User } from '../../../domain/entities/user.entity.ts';
import type { InsertUserOutcome, UserRepositoryPort } from '../../../application/ports/user-repository.port.ts';
import type { UserDocument } from '../documents/user.document.ts';
import { userMapper } from '../mappers/user.mapper.ts';

export class MongoUserRepository extends BaseRepository<UserDocument> implements UserRepositoryPort {
  constructor(collection: CollectionProvider<UserDocument>, clock: Clock) {
    super(collection, clock);
  }

  async insert(user: User): Promise<InsertUserOutcome> {
    try {
      await this.insertDocument(userMapper.toDocument(user));
      return 'INSERTED';
    } catch (error) {
      if (classifyDbError(error) === 'duplicate-key') return 'DUPLICATE_PROVIDER'; // uk_users_active_provider
      throw error;
    }
  }

  async findActiveByProvider(type: ProviderType, subject: string): Promise<User | null> {
    const document = await this.findOneDocument({ status: 'ACTIVE', providers: { $elemMatch: { type, subject } } });
    return document ? userMapper.toEntity(document) : null;
  }

  async findActiveById(id: string): Promise<User | null> {
    if (!ObjectId.isValid(id)) return null;
    const document = await this.findOneDocument({ _id: new ObjectId(id), status: 'ACTIVE' });
    return document ? userMapper.toEntity(document) : null;
  }

  // Writes every field the domain can change; identity and createdAt never change.
  async save(user: User): Promise<void> {
    const { _id, createdAt, ...mutable } = userMapper.toDocument(user);
    await this.setOne({ _id }, mutable);
  }
}
