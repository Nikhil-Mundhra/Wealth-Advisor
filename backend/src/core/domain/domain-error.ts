// A rule the domain refused, named by a stable code. The HTTP status is decided at the edge (core/errors/error-catalog.ts).
export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
