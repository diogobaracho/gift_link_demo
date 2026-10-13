import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SESSION_KEY } from '../../context/AuthContext';
import { makeAuthResult } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';

import Navbar from './Navbar';

describe('<Navbar />', () => {
  it('shows the main links and highlights the current page', () => {
    renderWithProviders(<Navbar />, { route: '/app/search' });
    const nav = screen.getByRole('navigation', { name: 'Main' });

    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: 'Gifts' })).toHaveAttribute('href', '/app');
    expect(within(nav).getByRole('link', { name: 'Search' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Gifts' })).not.toHaveAttribute('aria-current');
  });

  it('offers Login and Register to anonymous visitors', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/app/login');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/app/register');
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('greets a logged-in user and offers profile, posting and logout', () => {
    renderWithProviders(<Navbar />, { session: makeAuthResult({ firstName: 'Ana' }) });

    expect(screen.getByRole('link', { name: 'Welcome, Ana' })).toHaveAttribute(
      'href',
      '/app/profile',
    );
    expect(screen.getByRole('link', { name: 'Post a gift' })).toHaveAttribute('href', '/app/new');
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
  });

  it('logs out, clears the session and redirects to login', async () => {
    const { user } = renderWithProviders(<Navbar />, { session: makeAuthResult() });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/app/login');
  });

  it('has an accessible menu toggle for small screens', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('button', { name: /toggle navigation/i })).toHaveAttribute(
      'aria-controls',
      'main-navigation',
    );
  });
});
