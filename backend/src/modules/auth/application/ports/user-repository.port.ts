import type { ProviderType, User } from '../../domain/entities/user.entity.ts';

export type InsertUserOutcome = 'INSERTED' | 'DUPLICATE_PROVIDER';

export interface UserRepositoryPort {
  // DUPLICATE_PROVIDER when another active user already owns one of this user's provider links.
  insert(user: User): Promise<InsertUserOutcome>;
  findActiveByProvider(type: ProviderType, subject: string): Promise<User | null>;
  findActiveById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  deleteById(id: string): Promise<boolean>;
}
