import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { makeAuthResult, makeGift } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';

import DetailsPage from './DetailsPage';

const route = { route: '/app/product/875', path: '/app/product/:productId' };

function mockGift(overrides = {}) {
  const gift = makeGift({
    id: '875',
    name: 'Lamp',
    category: 'Kitchen',
    condition: 'Like New',
    age_years: 1.1,
    description: 'Lights up the room.',
    posted_by: 'owner-1',
    ...overrides,
  });
  server.use(
    http.get('/api/gifts/:id', () => HttpResponse.json(gift)),
    http.get('/api/gifts/:id/comments', () => HttpResponse.json([])),
  );
  return gift;
}

describe('<DetailsPage />', () => {
  it('shows every detail of the gift and its comments section', async () => {
    mockGift();
    renderWithProviders(<DetailsPage />, route);

    expect(await screen.findByRole('heading', { level: 1, name: 'Lamp' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Lamp' })).toHaveClass('product-image-large');
    for (const text of [
      'Kitchen',
      'Like New',
      'Aug 29, 2023',
      '1.1 years',
      '94105',
      'Lights up the room.',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { name: /Comments/ })).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('shows a placeholder when the gift has no image', async () => {
    mockGift({ image: null });
    renderWithProviders(<DetailsPage />, route);
    expect(await screen.findByText('No Image Available')).toHaveClass('no-image-available-large');
  });

  it('shows "Gift not found" for an unknown id', async () => {
    server.use(
      http.get('/api/gifts/:id', () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Gift not found' } },
          { status: 404 },
        ),
      ),
    );
    const { user } = renderWithProviders(<DetailsPage />, route);

    expect(await screen.findByRole('heading', { name: 'Gift not found' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to gifts' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/app');
  });

  it('shows other errors with retry', async () => {
    server.use(http.get('/api/gifts/:id', () => HttpResponse.error()));
    renderWithProviders(<DetailsPage />, route);
    expect(
      await screen.findByText('Unable to reach GiftLink. Please try again.'),
    ).toBeInTheDocument();
  });

  it('goes back to the list when opened directly', async () => {
    mockGift();
    const { user } = renderWithProviders(<DetailsPage />, route);

    await user.click(await screen.findByRole('button', { name: '← Back' }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/app$/);
  });

  it('only shows Delete to the owner', async () => {
    mockGift({ posted_by: 'someone-else' });
    renderWithProviders(<DetailsPage />, { ...route, session: makeAuthResult({ id: 'owner-1' }) });

    await screen.findByRole('heading', { level: 1, name: 'Lamp' });
    expect(screen.queryByRole('button', { name: 'Delete gift' })).not.toBeInTheDocument();
  });

  it('lets the owner delete after confirming', async () => {
    mockGift();
    let deleted = false;
    server.use(
      http.delete('/api/gifts/:id', () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = renderWithProviders(<DetailsPage />, {
      ...route,
      session: makeAuthResult({ id: 'owner-1' }),
    });

    await user.click(await screen.findByRole('button', { name: 'Delete gift' }));

    expect(window.confirm).toHaveBeenCalledWith('Delete "Lamp"? This cannot be undone.');
    await vi.waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/app$/));
    expect(deleted).toBe(true);
  });

  it('does nothing when the owner cancels deletion, and reports API failures', async () => {
    mockGift();
    server.use(
      http.delete('/api/gifts/:id', () =>
        HttpResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Only the owner can delete this gift' } },
          { status: 403 },
        ),
      ),
    );
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const { user } = renderWithProviders(<DetailsPage />, {
      ...route,
      session: makeAuthResult({ id: 'owner-1' }),
    });

    const button = await screen.findByRole('button', { name: 'Delete gift' });
    await user.click(button);
    expect(screen.getByTestId('location')).toHaveTextContent('/app/product/875');

    await user.click(button);
    expect(await screen.findByText('Only the owner can delete this gift')).toBeInTheDocument();
    expect(confirm).toHaveBeenCalledTimes(2);
  });
});
