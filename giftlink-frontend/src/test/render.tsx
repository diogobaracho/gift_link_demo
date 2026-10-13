/**
 * Renders a component inside the same providers the real app uses.
 *
 *   renderWithProviders(<DetailsPage />, {
 *     route: '/app/product/1', path: '/app/product/:productId', session: makeAuthResult(),
 *   });
 */
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import { AuthProvider, SESSION_KEY } from '../context/AuthContext';
import type { AuthResult } from '../types';

interface Options {
  /** Initial URL. */
  route?: string;
  /** Route pattern the component is mounted on (for useParams). */
  path?: string;
  /** Pre-existing logged-in session. */
  session?: AuthResult;
  /** History state of the initial entry (e.g. ProtectedRoute's `{ from }`). */
  state?: unknown;
}

/** Renders the current location so tests can assert on navigation. */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path = '*', session, state }: Options = {},
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  const result = render(
    <MemoryRouter initialEntries={[state === undefined ? route : { pathname: route, state }]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={ui} />
          {path !== '*' && <Route path="*" element={null} />}
        </Routes>
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );
  return { ...result, user: userEvent.setup() };
}
