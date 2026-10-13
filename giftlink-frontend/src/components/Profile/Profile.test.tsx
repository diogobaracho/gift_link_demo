import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { SESSION_KEY } from '../../context/AuthContext';
import { makeAuthResult, makeUser } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';

import Profile from './Profile';

const options = () => ({ route: '/app/profile', path: '/app/profile', session: makeAuthResult() });

describe('<Profile />', () => {
  it('shows the current user', () => {
    renderWithProviders(<Profile />, options());

    expect(screen.getByRole('heading', { name: 'Hi, Ana' })).toBeInTheDocument();
    expect(screen.getByText('Ana Lee')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('renders nothing without a session (guarded by ProtectedRoute)', () => {
    const { container } = renderWithProviders(<Profile />, {
      route: '/app/profile',
      path: '/app/profile',
    });
    expect(container.querySelector('.auth-card')).toBeNull();
  });

  it('edits the name, sends the token and refreshes the cached user', async () => {
    let auth: string | null = null;
    let body: unknown;
    server.use(
      http.put('/api/auth/update', async ({ request }) => {
        auth = request.headers.get('authorization');
        body = await request.json();
        return HttpResponse.json({ user: makeUser({ firstName: 'Anabel' }) });
      }),
    );
    const { user } = renderWithProviders(<Profile />, options());

    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    expect(screen.getByLabelText('Email')).toBeDisabled();
    const first = screen.getByLabelText('First name');
    await user.clear(first);
    await user.type(first, ' Anabel ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Profile updated!');
    expect(screen.getByRole('heading', { name: 'Hi, Anabel' })).toBeInTheDocument();
    expect(body).toEqual({ firstName: 'Anabel', lastName: 'Lee' });
    expect(auth).toMatch(/^Bearer /);
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!).user.firstName).toBe('Anabel');
  });

  it('validates required names and supports cancel', async () => {
    const { user } = renderWithProviders(<Profile />, options());

    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    await user.clear(screen.getByLabelText('Last name'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Last name is required')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Edit profile' })).toBeInTheDocument();
  });

  it('shows API errors', async () => {
    server.use(
      http.put('/api/auth/update', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Try later' } },
          { status: 500 },
        ),
      ),
    );
    const { user } = renderWithProviders(<Profile />, options());

    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Try later');
  });

  it('logs out and redirects when the session is rejected', async () => {
    server.use(
      http.put('/api/auth/update', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
          { status: 401 },
        ),
      ),
    );
    const { user } = renderWithProviders(<Profile />, options());

    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('/app/login')).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
