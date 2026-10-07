import type { ProviderType, User } from '../../domain/entities/user.entity.ts';

export type InsertUserOutcome = 'INSERTED' | 'DUPLICATE_IDENTITY';

export interface UserRepositoryPort {
  // DUPLICATE_IDENTITY when another active user already holds this email or one of this user's provider links.
  insert(user: User): Promise<InsertUserOutcome>;
  findActiveByProvider(type: ProviderType, subject: string): Promise<User | null>;
  findActiveById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  deleteById(id: string): Promise<boolean>;
}
