import type { UseCase } from '#core/application/use-case.ts';
import type { DeleteAccountCommand } from '../dto/delete-account.command.ts';
import type { SessionRepositoryPort } from '../ports/session-repository.port.ts';
import type { UserRepositoryPort } from '../ports/user-repository.port.ts';

interface DeleteAccountDeps {
  readonly users: UserRepositoryPort;
  readonly sessions: SessionRepositoryPort;
}

// Drops all active and revoked sessions and the user record itself so the identifier cannot be reused.
export class DeleteAccountUseCase implements UseCase<DeleteAccountCommand, void> {
  private readonly deps: DeleteAccountDeps;

  constructor(deps: DeleteAccountDeps) {
    this.deps = deps;
  }

  async execute(command: DeleteAccountCommand): Promise<void> {
    await this.deps.sessions.deleteAllForUser(command.userId);
    await this.deps.users.deleteById(command.userId);
  }
}
