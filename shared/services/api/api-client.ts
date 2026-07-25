import { logger } from '@/shared/services/observability/logger';
import { apiRateLimiter, waitForRateLimit } from '@/shared/services/rate-limit/rate-limiter';
import {
  secureStorageService,
  SecureStorageKeys,
} from '@/shared/services/storage/secure-storage.service';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestConfig extends Omit<RequestInit, 'method' | 'body'> {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
  rateLimitKey?: string;
  /**
   * How to log HTTP/network failures.
   * Use `warn` or `silent` for optional provider probes that have a fallback.
   */
  failureLog?: 'error' | 'warn' | 'silent';
}

export interface ApiErrorBody {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: ApiErrorBody;

  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code;
    this.body = body;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.tradevision.ai/v1';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1_000;

function buildUrl(path: string, params?: ApiRequestConfig['params']): string {
  const url = path.startsWith('http')
    ? path
    : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  if (!params) return url;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
}

async function getAuthToken(): Promise<string | null> {
  return secureStorageService.getItem(SecureStorageKeys.AUTH_TOKEN);
}

function isRetryable(status: number, method: HttpMethod): boolean {
  if (method !== 'GET') return false;
  return status === 408 || status === 429 || status >= 500;
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | undefined> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return undefined;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function logApiFailure(
  failureLog: NonNullable<ApiRequestConfig['failureLog']>,
  error: unknown,
  context: { method: string; path: string; status?: number },
): void {
  if (failureLog === 'silent') return;
  if (failureLog === 'warn') {
    logger.warn('api.request_failed', context);
    return;
  }
  logger.error('api.request_failed', error, context);
}

export async function apiRequest<T>(path: string, config: ApiRequestConfig = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    params,
    headers,
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    skipAuth = false,
    rateLimitKey = 'default',
    failureLog = 'error',
    ...rest
  } = config;

  const rateLimit = apiRateLimiter.check(rateLimitKey);
  if (!rateLimit.allowed) {
    await waitForRateLimit(rateLimit.retryAfterMs);
  }

  const url = buildUrl(path, params);
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetchWithTimeout(
        url,
        { method, headers: requestHeaders, body: requestBody, ...rest },
        timeout,
      );

      if (!response.ok) {
        const errorBody = await parseErrorBody(response);
        const error = new ApiError(
          errorBody?.message ?? `Request failed with status ${response.status}`,
          response.status,
          errorBody,
        );

        if (attempt < retries && isRetryable(response.status, method)) {
          logger.warn('api.retry_scheduled', {
            method,
            path,
            status: response.status,
            attempt: attempt + 1,
          });
          lastError = error;
          attempt += 1;
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
          continue;
        }

        logApiFailure(failureLog, error, { method, path, status: response.status });
        throw error;
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      lastError = error instanceof Error ? error : new Error('Unknown request error');

      if (attempt < retries) {
        logger.warn('api.network_retry_scheduled', { method, path, attempt: attempt + 1 });
        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
    }
  }

  const terminalError = lastError ?? new Error('Request failed');
  logApiFailure(failureLog, terminalError, { method, path });
  throw terminalError;
}

export const apiClient = {
  get: <T>(path: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...config, method: 'GET' }),

  post: <T>(path: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...config, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...config, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...config, method: 'PATCH', body }),

  delete: <T>(path: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...config, method: 'DELETE' }),
};
