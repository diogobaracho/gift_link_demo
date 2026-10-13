import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { SESSION_KEY } from '../../context/AuthContext';
import { makeAuthResult } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';

import LoginPage from './LoginPage';

const path = '/app/login';

describe('<LoginPage />', () => {
  it('validates fields before calling the API', async () => {
    const { user } = renderWithProviders(<LoginPage />, { route: path, path });

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('logs in, stores the session and goes to the gift list', async () => {
    let body: unknown;
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeAuthResult());
      }),
    );
    const { user } = renderWithProviders(<LoginPage />, { route: path, path });

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await screen.findByText(/^\/app$/);
    expect(body).toEqual({ email: 'ana@example.com', password: 'Passw0rd!' });
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!).user.firstName).toBe('Ana');
  });

  it('returns to the page that required login', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(makeAuthResult())));
    const { user } = renderWithProviders(<LoginPage />, {
      route: path,
      path,
      state: { from: '/app/profile' },
    });

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'x');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('/app/profile')).toBeInTheDocument();
  });

  it.each(['https://evil.example', '//evil.example'])(
    'ignores unsafe redirect target %s',
    async (from) => {
      server.use(http.post('/api/auth/login', () => HttpResponse.json(makeAuthResult())));
      const { user } = renderWithProviders(<LoginPage />, {
        route: path,
        path,
        state: { from },
      });

      await user.type(screen.getByLabelText('Email'), 'ana@example.com');
      await user.type(screen.getByLabelText('Password'), 'x');
      await user.click(screen.getByRole('button', { name: 'Login' }));

      expect(await screen.findByText(/^\/app$/)).toBeInTheDocument();
    },
  );

  it('shows the generic error from the API on bad credentials', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
          { status: 401 },
        ),
      ),
    );
    const { user } = renderWithProviders(<LoginPage />, { route: path, path });

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled();
  });

  it('redirects users who are already logged in', () => {
    renderWithProviders(<LoginPage />, { route: path, path, session: makeAuthResult() });
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/app$/);
  });

  it('links to registration', () => {
    renderWithProviders(<LoginPage />, { route: path, path });
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/app/register',
    );
  });
});
