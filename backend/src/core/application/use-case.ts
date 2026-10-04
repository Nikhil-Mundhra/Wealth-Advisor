// One application operation: takes a command DTO, returns a result DTO, knows nothing about HTTP or storage.
export interface UseCase<Command, Result> {
  execute(command: Command): Promise<Result>;
}
