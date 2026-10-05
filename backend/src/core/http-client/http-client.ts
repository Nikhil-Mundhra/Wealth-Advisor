// transient: worth retrying later (network, timeout, 408, 429, 5xx); fatal: retrying the same request fails again.
export type HttpFailureKind = 'transient' | 'fatal';

// Messages name only origin + path: provider keys travel in the query string, and errors end up in logs.
export class HttpClientError extends Error {
  readonly kind: HttpFailureKind;
  readonly status: number | null;

  constructor(kind: HttpFailureKind, message: string, status: number | null = null) {
    super(message);
    this.name = 'HttpClientError';
    this.kind = kind;
    this.status = status;
  }
}

export interface GetJsonOptions {
  readonly timeoutMs: number;
}

export interface HttpClient {
  getJson(url: string, options: GetJsonOptions): Promise<unknown>;
}

type Fetch = (input: string, init: RequestInit) => Promise<Response>;

export function createHttpClient(fetchImpl: Fetch = (input, init) => fetch(input, init)): HttpClient {
  return {
    async getJson(url, { timeoutMs }) {
      const target = describeUrl(url);
      const signal = AbortSignal.timeout(timeoutMs);
      const response = await fetchImpl(url, { headers: { accept: 'application/json' }, signal }).catch((error: unknown) => {
        throw new HttpClientError('transient', `GET ${target} failed: ${failureName(error)}`);
      });
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        throw new HttpClientError(statusKind(response.status), `GET ${target} answered ${response.status}`, response.status);
      }
      return response.json().catch((error: unknown) => {
        const kind = isTimeout(error) ? 'transient' : 'fatal';
        throw new HttpClientError(kind, `GET ${target} body unreadable: ${failureName(error)}`, response.status);
      });
    },
  };
}

function statusKind(status: number): HttpFailureKind {
  return status >= 500 || status === 429 || status === 408 ? 'transient' : 'fatal';
}

function describeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    throw new HttpClientError('fatal', 'GET with an invalid URL');
  }
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
}

// The error's own message is left out: undici and DOMException messages can quote the request URL.
function failureName(error: unknown): string {
  if (isTimeout(error)) return 'timeout';
  const cause = error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined;
  if (typeof cause?.code === 'string') return cause.code;
  return error instanceof Error ? error.name : 'unknown error';
}
