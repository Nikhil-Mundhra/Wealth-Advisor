import type { UseCase } from '#core/application/use-case.ts';
import { AuthErrors } from '../../domain/errors/auth-errors.ts';
import type { GetMeQuery } from '../dto/get-me.query.ts';
import type { UserProfileResult } from '../dto/user-profile.result.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';

interface GetMeDeps {
  readonly users: UserRepositoryPort;
}

// The authenticated user's own profile. A withdrawn or missing user is treated as unauthenticated.
export class GetMeUseCase implements UseCase<GetMeQuery, UserProfileResult> {
  private readonly deps: GetMeDeps;

  constructor(deps: GetMeDeps) {
    this.deps = deps;
  }

  async execute(query: GetMeQuery): Promise<UserProfileResult> {
    const user = await this.deps.users.findActiveById(query.userId);
    if (!user) throw AuthErrors.unauthenticated();
    return {
      id: user.id,
      email: user.email.value,
      displayName: user.displayName,
      roles: [...user.roles],
      emailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }
}
