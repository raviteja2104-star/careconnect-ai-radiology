// @careconnect/api-client — Typed HTTP Client

// ─── Core Types ──────────────────────────────────────────────────────────────
export interface RequestConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  onTokenExpired?: () => Promise<string | null>;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, string[]>;
  requestId?: string;
  timestamp: string;
}

export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Error Classes ────────────────────────────────────────────────────────────
export class ApiClientError extends Error {
  constructor(
    public readonly apiError: ApiError,
    public readonly response?: Response,
  ) {
    super(apiError.message);
    this.name = 'ApiClientError';
  }

  get statusCode() { return this.apiError.statusCode; }
  get code() { return this.apiError.code; }
  get isUnauthorized() { return this.apiError.statusCode === 401; }
  get isForbidden() { return this.apiError.statusCode === 403; }
  get isNotFound() { return this.apiError.statusCode === 404; }
  get isValidationError() { return this.apiError.statusCode === 422; }
  get isServerError() { return this.apiError.statusCode >= 500; }
}

// ─── URL Builder ──────────────────────────────────────────────────────────────
function buildUrl(base: string, path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, base.endsWith('/') ? base : base + '/');
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

// ─── Retry Logic ──────────────────────────────────────────────────────────────
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

// ─── Core Client ──────────────────────────────────────────────────────────────
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultRetries: number;
  private defaultRetryDelay: number;
  private accessToken: string | null = null;
  private onTokenExpired?: () => Promise<string | null>;

  constructor(config: RequestConfig) {
    this.baseUrl = config.baseUrl ?? '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers,
    };
    this.defaultRetries = config.retries ?? 3;
    this.defaultRetryDelay = config.retryDelay ?? 1000;
    this.onTokenExpired = config.onTokenExpired;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async parseError(response: Response, requestId: string): Promise<ApiError> {
    try {
      const body = await response.json();
      return {
        code: body.code ?? 'UNKNOWN_ERROR',
        message: body.message ?? response.statusText,
        statusCode: response.status,
        details: body.details,
        requestId,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        code: 'PARSE_ERROR',
        message: response.statusText || 'Unknown error',
        statusCode: response.status,
        requestId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const {
      params, body, timeout = 30000, retries = this.defaultRetries,
      skipAuth = false, requestId = this.generateRequestId(), ...fetchOptions
    } = options;

    const url = buildUrl(this.baseUrl, path, params);
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'X-Request-ID': requestId,
    };

    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          ...fetchOptions,
        });

        clearTimeout(timeoutId);

        // Token refresh flow
        if (response.status === 401 && !skipAuth && this.onTokenExpired && attempt === 0) {
          const newToken = await this.onTokenExpired();
          if (newToken) {
            this.setAccessToken(newToken);
            headers['Authorization'] = `Bearer ${newToken}`;
            attempt++;
            continue;
          }
        }

        if (!response.ok) {
          const apiError = await this.parseError(response, requestId);
          if (isRetryable(response.status) && attempt < retries) {
            await sleep(this.defaultRetryDelay * Math.pow(2, attempt));
            attempt++;
            continue;
          }
          throw new ApiClientError(apiError, response);
        }

        // Handle 204 No Content
        if (response.status === 204) return undefined as T;

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return response.json() as Promise<T>;
        }
        return response.text() as Promise<T>;

      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof ApiClientError) throw error;
        if ((error as Error).name === 'AbortError') {
          throw new ApiClientError({
            code: 'REQUEST_TIMEOUT',
            message: `Request timed out after ${timeout}ms`,
            statusCode: 408,
            requestId,
            timestamp: new Date().toISOString(),
          });
        }
        lastError = error as Error;
        if (attempt < retries) {
          await sleep(this.defaultRetryDelay * Math.pow(2, attempt));
          attempt++;
          continue;
        }
        break;
      }
    }

    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: lastError?.message ?? 'Network request failed',
      statusCode: 0,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Convenience Methods ────────────────────────────────────────────────────
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, { ...options, body });
  }
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body });
  }
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, { ...options, body });
  }
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  // ─── Paginated Request ──────────────────────────────────────────────────────
  paginated<T>(path: string, pagination: PaginatedRequest, options?: RequestOptions): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(path, {
      ...options,
      params: {
        page: pagination.page ?? 1,
        pageSize: pagination.pageSize ?? 20,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        search: pagination.search,
        ...options?.params,
      },
    });
  }

  // ─── File Upload ────────────────────────────────────────────────────────────
  async upload<T>(path: string, file: File, metadata?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.entries(metadata).forEach(([k, v]) => formData.append(k, v));
    }

    const headers: Record<string, string> = { 'X-Request-ID': this.generateRequestId() };
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;

    const response = await fetch(buildUrl(this.baseUrl, path, {}), {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const apiError = await this.parseError(response, headers['X-Request-ID']);
      throw new ApiClientError(apiError, response);
    }
    return response.json() as Promise<T>;
  }

  // ─── SSE (Server-Sent Events) ───────────────────────────────────────────────
  sse(path: string, onMessage: (data: unknown) => void, onError?: (err: Event) => void): EventSource {
    const url = buildUrl(this.baseUrl, path, {});
    const source = new EventSource(url, { withCredentials: true });
    source.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch { onMessage(e.data); }
    };
    if (onError) source.onerror = onError;
    return source;
  }
}

// ─── Domain-Specific Clients ──────────────────────────────────────────────────
// These wrap the generic ApiClient with typed, path-specific methods

export function createApiClient(baseUrl: string, getToken?: () => Promise<string | null>): ApiClient {
  return new ApiClient({
    baseUrl,
    retries: 3,
    retryDelay: 1000,
    onTokenExpired: getToken,
  });
}
