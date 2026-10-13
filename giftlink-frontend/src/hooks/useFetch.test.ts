import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/client';

import { useFetch } from './useFetch';

describe('useFetch', () => {
  it('exposes loading, then data', async () => {
    const fetcher = vi.fn(() => Promise.resolve('hello'));
    const { result } = renderHook(() => useFetch(fetcher));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe('hello'));
    expect(result.current).toMatchObject({ loading: false, error: null });
  });

  it('exposes ApiErrors and wraps unknown errors', async () => {
    // Fetchers must be stable (memoized) — a new function per render means a new request.
    const apiError = new ApiError(500, 'INTERNAL_ERROR', 'Server exploded');
    const failApi = () => Promise.reject(apiError);
    const { result: api } = renderHook(() => useFetch(failApi));
    await waitFor(() => expect(api.current.error).toBe(apiError));

    const failOther = () => Promise.reject(new Error('boom'));
    const { result: other } = renderHook(() => useFetch(failOther));
    await waitFor(() =>
      expect(other.current.error).toMatchObject({ code: 'UNKNOWN', message: 'boom' }),
    );
  });

  it('refetches on reload', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const { result } = renderHook(() => useFetch<number>(fetcher));
    await waitFor(() => expect(result.current.data).toBe(1));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).toBe(2));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('aborts the in-flight request on unmount and ignores its outcome', async () => {
    let signal: AbortSignal | undefined;
    const fetcher = vi.fn((s: AbortSignal) => {
      signal = s;
      return new Promise<string>((_resolve, reject) => {
        s.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });
    const { result, unmount } = renderHook(() => useFetch(fetcher));

    unmount();

    await waitFor(() => expect(signal?.aborted).toBe(true));
    expect(result.current.error).toBeNull();
  });
});
