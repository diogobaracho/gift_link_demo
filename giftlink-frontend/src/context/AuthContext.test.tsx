import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeAuthResult, makeToken, makeUser } from '../test/fixtures';

import { AuthProvider, SESSION_KEY, useAuth } from './AuthContext';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  afterEach(() => vi.useRealTimers());

  it('starts logged out', () => {
    const { result } = renderHook(useAuth, { wrapper });
    expect(result.current).toMatchObject({ isAuthenticated: false, user: null, token: null });
  });

  it('logs in, persists the session, and logs out', () => {
    const { result } = renderHook(useAuth, { wrapper });
    const session = makeAuthResult();

    act(() => result.current.login(session));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.firstName).toBe('Ana');
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!)).toEqual(session);

    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('restores a valid session after a reload', () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(makeAuthResult()));
    const { result } = renderHook(useAuth, { wrapper });
    expect(result.current.user?.email).toBe('ana@example.com');
  });

  it.each([
    ['expired token', JSON.stringify({ token: makeToken(-5), user: makeUser() })],
    ['corrupted JSON', '{not json'],
    ['missing user', JSON.stringify({ token: makeToken() })],
  ])('ignores a stored session with %s', (_case, stored) => {
    sessionStorage.setItem(SESSION_KEY, stored);
    const { result } = renderHook(useAuth, { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('updates the cached user', () => {
    const { result } = renderHook(useAuth, { wrapper });
    act(() => result.current.login(makeAuthResult()));
    act(() => result.current.updateUser(makeUser({ firstName: 'Anabel' })));

    expect(result.current.user?.firstName).toBe('Anabel');
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!).user.firstName).toBe('Anabel');
  });

  it('ignores updateUser when logged out', () => {
    const { result } = renderHook(useAuth, { wrapper });
    act(() => result.current.updateUser(makeUser()));
    expect(result.current.user).toBeNull();
  });

  it('logs out automatically when the token expires', () => {
    vi.useFakeTimers();
    const { result } = renderHook(useAuth, { wrapper });
    act(() => result.current.login({ token: makeToken(30), user: makeUser() }));

    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('throws a helpful error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Orphan() {
      useAuth();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('useAuth must be used inside <AuthProvider>');
    expect(screen.queryByText('anything')).toBeNull();
  });
});
