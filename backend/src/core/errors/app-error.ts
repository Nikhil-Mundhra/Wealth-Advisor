import type { ErrorIssue } from '@wealth-advisor/contracts';

// An error raised at the HTTP edge with its status already known (bad JSON, failed contract, missing database).
// Domain rules raise DomainError instead; their status comes from the error catalog.
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues: readonly ErrorIssue[] | undefined;

  constructor(status: number, code: string, message: string, issues?: readonly ErrorIssue[]) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}
