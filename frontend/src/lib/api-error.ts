import { ErrorResponse } from '@wealth-advisor/contracts';

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

// A failed API call, carrying the error contract's code so callers can branch on it.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const parsed = ErrorResponse.safeParse(await response.json().catch(() => null));
    return parsed.success
      ? new ApiError(response.status, parsed.data.code, parsed.data.message)
      : new ApiError(response.status, `HTTP_${response.status}`, response.statusText || 'request failed');
  }
}
