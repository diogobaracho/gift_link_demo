import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { SESSION_KEY } from '../../context/AuthContext';
import { makeAuthResult } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';

import RegisterPage from './RegisterPage';

const path = '/app/register';

async function fillForm(
  user: ReturnType<typeof renderWithProviders>['user'],
  password = 'Passw0rd!',
) {
  await user.type(screen.getByLabelText('First name'), 'Ana');
  await user.type(screen.getByLabelText('Last name'), 'Lee');
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Password'), password);
}

describe('<RegisterPage />', () => {
  it('shows field errors for an empty form', async () => {
    const { user } = renderWithProviders(<RegisterPage />, { route: path, path });

    await user.click(screen.getByRole('button', { name: 'Register' }));

    for (const message of [
      'First name is required',
      'Last name is required',
      'Email is required',
      'Password is required',
    ]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
  });

  it('requires a password of at least 8 characters', async () => {
    const { user } = renderWithProviders(<RegisterPage />, { route: path, path });
    await fillForm(user, 'short');
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('creates the account, logs in and goes to the gift list', async () => {
    let body: unknown;
    server.use(
      http.post('/api/auth/register', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeAuthResult(), { status: 201 });
      }),
    );
    const { user } = renderWithProviders(<RegisterPage />, { route: path, path });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(/^\/app$/);
    expect(body).toEqual({
      firstName: 'Ana',
      lastName: 'Lee',
      email: 'ana@example.com',
      password: 'Passw0rd!',
    });
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
  });

  it('explains when the email is already registered', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json(
          { error: { code: 'CONFLICT', message: 'Email is already registered' } },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderWithProviders(<RegisterPage />, { route: path, path });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered');
    expect(screen.getByTestId('location')).toHaveTextContent(path);
  });

  it('maps server-side field errors onto inputs', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: [{ path: 'email', message: 'must be a valid email address' }],
            },
          },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<RegisterPage />, { route: path, path });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('must be a valid email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('redirects users who are already logged in', () => {
    renderWithProviders(<RegisterPage />, { route: path, path, session: makeAuthResult() });
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/app$/);
  });
});
