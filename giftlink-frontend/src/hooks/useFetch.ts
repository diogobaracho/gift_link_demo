/**
 * Data fetching with loading/error state, cancellation and manual reload.
 *
 * - The fetcher receives an AbortSignal. When the component unmounts or the fetcher
 *   changes (e.g. a new page number), the in-flight request is aborted, so a slow old
 *   response can never overwrite a newer one (a classic useEffect race condition).
 * - `loading` is derived rather than stored: each request gets an identity object, and we
 *   are loading until the latest result belongs to the latest request. This avoids
 *   synchronous setState inside the effect (react-hooks/set-state-in-effect).
 *
 * Callers memoize the fetcher with useCallback.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '../api/client';

export interface FetchState<T> {
  data: T | undefined;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

interface Settled<T> {
  request: object;
  data: T | undefined;
  error: ApiError | null;
}

function toApiError(err: unknown): ApiError {
  return err instanceof ApiError
    ? err
    : new ApiError(0, 'UNKNOWN', err instanceof Error ? err.message : 'Something went wrong');
}

export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>): FetchState<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  // A new identity per (fetcher, attempt) pair: "which request is current".
  const request = useMemo(() => ({ fetcher, attempt }), [fetcher, attempt]);

  useEffect(() => {
    const controller = new AbortController();
    request
      .fetcher(controller.signal)
      .then((data) => setSettled({ request, data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // superseded or unmounted: ignore
        setSettled({ request, data: undefined, error: toApiError(err) });
      });
    return () => controller.abort();
  }, [request]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const loading = settled?.request !== request;

  return {
    data: settled?.data,
    error: loading ? null : (settled?.error ?? null),
    loading,
    reload,
  };
}
