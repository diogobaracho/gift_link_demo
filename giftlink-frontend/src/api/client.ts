/**
 * Typed HTTP client for the GiftLink API.
 *
 * - One `request` function owns headers, JSON (de)serialization and error mapping.
 *   Components never touch `fetch` directly.
 * - Failures always surface as `ApiError` with the server's machine-readable `code`, so
 *   UI code can branch on `err.status === 401` and show `err.message` to users.
 * - The base URL defaults to the page's own origin (`/api` is proxied by Vite in dev and
 *   nginx in prod). `VITE_BACKEND_URL` exists only for split-origin deployments.
 */
import type {
  ApiErrorBody,
  AuthResult,
  Comment,
  Gift,
  LoginInput,
  NewGift,
  Page,
  RegisterInput,
  SearchParams,
  User,
} from '../types';

export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

function baseUrl(): string {
  const configured = import.meta.env.VITE_BACKEND_URL?.trim();
  return configured ? configured.replace(/\/+$/, '') : window.location.origin;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // Let callers distinguish "cancelled on unmount" from real failures. Compare by name:
    // the DOMException may come from another realm (e.g. Node's fetch under jsdom).
    if ((err as Error | null)?.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach GiftLink. Please try again.');
  }

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as Partial<ApiErrorBody> | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? `Request failed with status ${response.status}`,
      error?.details,
    );
  }
  return data as T;
}

/** Builds `?a=1&b=2`, skipping empty values (unset form fields). */
export function toQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

export const api = {
  listGifts: (page = 1, limit = 12, signal?: AbortSignal) =>
    request<Page<Gift>>(`/api/gifts${toQueryString({ page, limit })}`, { signal }),

  getGift: (id: string, signal?: AbortSignal) =>
    request<Gift>(`/api/gifts/${encodeURIComponent(id)}`, { signal }),

  createGift: (gift: NewGift, token: string) =>
    request<Gift>('/api/gifts', { method: 'POST', body: gift, token }),

  deleteGift: (id: string, token: string) =>
    request<undefined>(`/api/gifts/${encodeURIComponent(id)}`, { method: 'DELETE', token }),

  searchGifts: (params: SearchParams, signal?: AbortSignal) =>
    request<Gift[]>(`/api/search${toQueryString({ ...params })}`, { signal }),

  getComments: (giftId: string, signal?: AbortSignal) =>
    request<Comment[]>(`/api/gifts/${encodeURIComponent(giftId)}/comments`, { signal }),

  postComment: (giftId: string, input: { text: string; parentId?: string }, token: string) =>
    request<Comment>(`/api/gifts/${encodeURIComponent(giftId)}/comments`, {
      method: 'POST',
      body: input,
      token,
    }),

  register: (input: RegisterInput) =>
    request<AuthResult>('/api/auth/register', { method: 'POST', body: input }),

  login: (input: LoginInput) =>
    request<AuthResult>('/api/auth/login', { method: 'POST', body: input }),

  updateProfile: (changes: Pick<User, 'firstName' | 'lastName'>, token: string) =>
    request<{ user: User }>('/api/auth/update', { method: 'PUT', body: changes, token }),
};
