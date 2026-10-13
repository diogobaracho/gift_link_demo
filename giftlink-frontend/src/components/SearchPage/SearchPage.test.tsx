import { fireEvent, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { makeGift } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';

import SearchPage from './SearchPage';

let queries: string[];

beforeEach(() => {
  queries = [];
  server.use(
    http.get('/api/search', ({ request }) => {
      const params = new URL(request.url).searchParams;
      queries.push(params.toString());
      if (params.get('name') === 'nothing') return HttpResponse.json([]);
      return HttpResponse.json([
        makeGift({ id: 'd1', name: 'Office Desk', description: 'Solid oak desk.' }),
        makeGift({ id: 'c1', name: 'Desk Chair', image: null }),
      ]);
    }),
  );
});

const path = '/app/search';

describe('<SearchPage />', () => {
  it('shows the newest gifts before any filter is applied', async () => {
    renderWithProviders(<SearchPage />, { route: path, path });

    const results = await screen.findByRole('list', { name: 'Search results' });
    expect(within(results).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('2 results')).toBeInTheDocument();
    expect(queries).toEqual(['']);
  });

  it('generates dropdown options from the canonical lists', () => {
    renderWithProviders(<SearchPage />, { route: path, path });

    const category = screen.getByLabelText('Category');
    expect(
      within(category)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['All categories', 'Living', 'Bedroom', 'Bathroom', 'Kitchen', 'Office']);
    expect(within(screen.getByLabelText('Condition')).getAllByRole('option')).toHaveLength(4);
  });

  it('displays the selected age as the slider moves', () => {
    renderWithProviders(<SearchPage />, { route: path, path });
    const slider = screen.getByRole('slider');

    expect(screen.getByText('any')).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: '3' } });
    expect(screen.getByText('3 years')).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: '1' } });
    expect(screen.getByText('1 year')).toBeInTheDocument();
  });

  it('applies all filters on Search and reflects them in the URL', async () => {
    const { user } = renderWithProviders(<SearchPage />, { route: path, path });
    await screen.findByText('2 results');

    await user.type(screen.getByLabelText('Name'), ' desk ');
    await user.selectOptions(screen.getByLabelText('Category'), 'Office');
    await user.selectOptions(screen.getByLabelText('Condition'), 'Like New');
    fireEvent.change(screen.getByRole('slider'), { target: { value: '4' } });
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await screen.findByText('2 results');
    expect(queries.at(-1)).toBe('name=desk&category=Office&condition=Like+New&age_years=4');
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/app/search?name=desk&category=Office&condition=Like+New&age_years=4',
    );
  });

  it('restores filters from a shared URL', async () => {
    renderWithProviders(<SearchPage />, { route: `${path}?name=lamp&age_years=2`, path });

    await screen.findByText('2 results');
    expect(screen.getByLabelText('Name')).toHaveValue('lamp');
    expect(screen.getByText('2 years')).toBeInTheDocument();
    expect(queries).toEqual(['name=lamp&age_years=2']);
  });

  it('shows a helpful message when nothing matches', async () => {
    renderWithProviders(<SearchPage />, { route: `${path}?name=nothing`, path });
    expect(
      await screen.findByText('No gifts found, please revise your filters.'),
    ).toBeInTheDocument();
  });

  it('links each result to its details page', async () => {
    renderWithProviders(<SearchPage />, { route: path, path });
    expect(
      await screen.findByRole('link', { name: 'View details of Office Desk' }),
    ).toHaveAttribute('href', '/app/product/d1');
  });

  it('resets filters', async () => {
    const { user } = renderWithProviders(<SearchPage />, {
      route: `${path}?name=desk&category=Office`,
      path,
    });
    await screen.findByText('2 results');

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/app\/search$/);
  });

  it('surfaces API errors', async () => {
    server.use(
      http.get('/api/search', () =>
        HttpResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed' } },
          { status: 400 },
        ),
      ),
    );
    renderWithProviders(<SearchPage />, { route: path, path });
    expect(await screen.findByText('Request validation failed')).toBeInTheDocument();
  });
});
