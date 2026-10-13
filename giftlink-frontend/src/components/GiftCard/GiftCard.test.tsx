import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeGift } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';

import GiftCard from './GiftCard';

describe('<GiftCard />', () => {
  it('shows image, name, condition, date and a details link', () => {
    renderWithProviders(
      <GiftCard gift={makeGift({ id: '875', name: 'Lamp', condition: 'New' })} />,
    );

    expect(screen.getByRole('img', { name: 'Lamp' })).toHaveAttribute('src', '/images/lamp.jpeg');
    expect(screen.getByRole('heading', { name: 'Lamp' })).toBeInTheDocument();
    expect(screen.getByText('New')).toHaveClass('condition-new');
    expect(screen.getByText('Added Aug 29, 2023')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View details of Lamp' })).toHaveAttribute(
      'href',
      '/app/product/875',
    );
  });

  it('shows a placeholder when there is no image and flags used items', () => {
    renderWithProviders(<GiftCard gift={makeGift({ image: null, condition: 'Older' })} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('No Image Available')).toBeInTheDocument();
    expect(screen.getByText('Older')).toHaveClass('condition-used');
  });
});
