/**
 * Authentication state shared across the app.
 *
 * The session (JWT + public user) is kept in `sessionStorage`, as in the course: it
 * survives a page reload but not closing the tab. Anything readable by JS is exposed to
 * XSS, so React's escaping and the backend's CSP headers matter. ADR-0005 discusses the
 * httpOnly-cookie alternative.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { msUntilExpiry } from '../lib/jwt';
import type { AuthResult, User } from '../types';

export const SESSION_KEY = 'giftlink.session';

interface Session {
  token: string;
  user: User;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** Stores the session returned by login/register. */
  login: (result: AuthResult) => void;
  logout: () => void;
  /** Replaces the cached user after a profile update. */
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Reads a stored session, discarding corrupted or expired ones. */
function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Partial<Session>;
    if (typeof session.token !== 'string' || !session.user) return null;
    if (msUntilExpiry(session.token) <= 0) return null;
    return session as Session;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null): void {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable (private mode / quota): keep the in-memory session only */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  const login = useCallback((result: AuthResult) => {
    const next = { token: result.token, user: result.user };
    writeSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const updateUser = useCallback((user: User) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, user };
      writeSession(next);
      return next;
    });
  }, []);

  // Log out automatically the moment the token expires.
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(logout, Math.max(msUntilExpiry(session.token), 0));
    return () => window.clearTimeout(timer);
  }, [session, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: session !== null,
      login,
      logout,
      updateUser,
    }),
    [session, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access auth state. Must be used inside `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
