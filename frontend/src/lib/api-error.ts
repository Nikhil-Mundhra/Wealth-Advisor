import { type ErrorIssue, ErrorResponse } from '@wealth-advisor/contracts';

// Codes raised by the client itself; server codes come from @wealth-advisor/rules.
export const CLIENT_ERROR_CODES = {
  network: 'NETWORK_ERROR',
  contractMismatch: 'CONTRACT_MISMATCH',
} as const;
export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[keyof typeof CLIENT_ERROR_CODES];

// A failed API call, carrying the error contract's code and field issues so callers can place each message.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues: readonly ErrorIssue[];

  constructor(status: number, code: string, message: string, issues: readonly ErrorIssue[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.issues = issues;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const parsed = ErrorResponse.safeParse(await response.json().catch(() => null));
    return parsed.success
      ? new ApiError(response.status, parsed.data.code, parsed.data.message, parsed.data.issues ?? [])
      : new ApiError(response.status, `HTTP_${response.status}`, response.statusText || 'request failed');
  }
}
