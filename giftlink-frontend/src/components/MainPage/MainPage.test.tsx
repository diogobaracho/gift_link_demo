import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeGift } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';
import type { Gift, Page } from '../../types';

import MainPage from './MainPage';

function pageOf(items: Gift[], page = 1, total = items.length, limit = 12): Page<Gift> {
  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

describe('<MainPage />', () => {
  it('lists gifts from the API', async () => {
    server.use(
      http.get('/api/gifts', () =>
        HttpResponse.json(pageOf([makeGift({ name: 'Lamp' }), makeGift({ name: 'Couch' })])),
      ),
    );

    renderWithProviders(<MainPage />, { route: '/app', path: '/app' });

    expect(screen.getByRole('status')).toHaveTextContent('Loading gifts…');
    expect(await screen.findByRole('heading', { name: 'Lamp' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Couch' })).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Gift pages' })).not.toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    server.use(http.get('/api/gifts', () => HttpResponse.json(pageOf([]))));
    renderWithProviders(<MainPage />, { route: '/app', path: '/app' });

    expect(await screen.findByText(/No gifts here yet/)).toBeInTheDocument();
  });

  it('reads the page from the URL and paginates', async () => {
    const requested: (string | null)[] = [];
    server.use(
      http.get('/api/gifts', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        requested.push(String(page));
        return HttpResponse.json(pageOf([makeGift({ name: `Item on page ${page}` })], page, 30));
      }),
    );

    const { user } = renderWithProviders(<MainPage />, { route: '/app?page=2', path: '/app' });

    expect(await screen.findByRole('heading', { name: 'Item on page 2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('heading', { name: 'Item on page 3' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/app?page=3');

    await user.click(screen.getByRole('button', { name: '1' }));
    expect(await screen.findByRole('heading', { name: 'Item on page 1' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/app$/);
    expect(requested).toEqual(['2', '3', '1']);
  });

  it('shows an error with a working retry', async () => {
    let calls = 0;
    server.use(
      http.get('/api/gifts', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Database is down' } },
              { status: 500 },
            )
          : HttpResponse.json(pageOf([makeGift({ name: 'Recovered' })]));
      }),
    );

    const { user } = renderWithProviders(<MainPage />, { route: '/app', path: '/app' });

    expect(await screen.findByText('Database is down')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Recovered' })).toBeInTheDocument();
  });
});
