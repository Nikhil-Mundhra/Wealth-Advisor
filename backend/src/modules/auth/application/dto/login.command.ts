import type { ClientType } from '../../domain/entities/session.entity.ts';

export interface LoginCommand {
  readonly email: string;
  readonly password: string;
  readonly clientType: ClientType;
  readonly rememberMe: boolean;
}
