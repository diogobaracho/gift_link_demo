import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../test/render';

import LandingPage from './LandingPage';

describe('<LandingPage />', () => {
  it('shows the title, subtitle and community quote', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'GiftLink' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Share Gifts and Joy!' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sharing is the essence of community/)).toBeInTheDocument();
  });

  it('sends visitors to the gift list on Get Started', async () => {
    const { user } = renderWithProviders(<LandingPage />, { route: '/', path: '/' });

    await user.click(screen.getByRole('link', { name: 'Get Started' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/app');
  });
});
