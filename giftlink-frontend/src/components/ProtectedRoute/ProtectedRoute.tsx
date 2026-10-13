/**
 * Guards routes that need an account. Anonymous users are sent to the login page,
 * which returns them here after a successful login (`state.from`).
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/app/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
