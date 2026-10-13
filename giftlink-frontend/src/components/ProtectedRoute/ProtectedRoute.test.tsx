import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AuthProvider, SESSION_KEY } from '../../context/AuthContext';
import { makeAuthResult } from '../../test/fixtures';

import ProtectedRoute from './ProtectedRoute';

function LoginProbe() {
  const location = useLocation();
  return <p>login, from {(location.state as { from: string }).from}</p>;
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute>
                <p>secret profile</p>
              </ProtectedRoute>
            }
          />
          <Route path="/app/login" element={<LoginProbe />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('<ProtectedRoute />', () => {
  it('redirects anonymous users to login, remembering where they were going', () => {
    renderAt('/app/profile');
    expect(screen.getByText('login, from /app/profile')).toBeInTheDocument();
    expect(screen.queryByText('secret profile')).not.toBeInTheDocument();
  });

  it('renders the page for authenticated users', () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(makeAuthResult()));
    renderAt('/app/profile');
    expect(screen.getByText('secret profile')).toBeInTheDocument();
  });
});
