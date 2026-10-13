import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';
import { renderWithProviders } from './test/render';

describe('<App />', () => {
  it('renders the landing page with the navbar at /', () => {
    renderWithProviders(<App />, { route: '/' });

    expect(screen.getByRole('heading', { level: 1, name: 'GiftLink' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('renders the not-found page for unknown routes', () => {
    renderWithProviders(<App />, { route: '/definitely/not/here' });

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse gifts' })).toHaveAttribute('href', '/app');
  });

  it.each(['/app/new', '/app/profile'])('sends anonymous visitors of %s to login', (route) => {
    renderWithProviders(<App />, { route });

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/app/login');
  });
});
