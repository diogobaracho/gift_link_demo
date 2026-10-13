import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { SESSION_KEY } from '../../context/AuthContext';
import { makeAuthResult, makeGift } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';

import NewGiftPage, { validateGift } from './NewGiftPage';

const options = () => ({ route: '/app/new', path: '/app/new', session: makeAuthResult() });

async function fillValidForm(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText('Name'), 'Reading Lamp');
  await user.selectOptions(screen.getByLabelText('Category'), 'Living');
  await user.selectOptions(screen.getByLabelText('Condition'), 'Like New');
  await user.type(screen.getByLabelText('Zip code'), '94105');
  await user.type(screen.getByLabelText('Age (years)'), '2');
  await user.type(screen.getByLabelText('Description'), 'Warm light.');
}

describe('validateGift', () => {
  const valid = {
    name: 'Lamp',
    category: 'Living',
    condition: 'New',
    zipcode: '94105',
    age_years: '1',
    description: 'ok',
    image: '',
  };

  it('accepts a valid gift, with or without an image', () => {
    expect(validateGift(valid)).toEqual({});
    expect(validateGift({ ...valid, image: '/images/lamp.jpeg' })).toEqual({});
    expect(validateGift({ ...valid, image: 'https://cdn.example/a.jpg' })).toEqual({});
  });

  it.each([
    ['zipcode', { zipcode: '9410' }, 'Enter a 5-digit zip code'],
    ['age_years', { age_years: '' }, 'Enter an age between 0 and 100 years'],
    ['age_years', { age_years: '101' }, 'Enter an age between 0 and 100 years'],
    ['image', { image: 'javascript:alert(1)' }, 'Use /images/<file> or an http(s) URL'],
    ['category', { category: '' }, 'Choose a category'],
  ])('flags %s', (field, override, message) => {
    expect(validateGift({ ...valid, ...override })).toEqual({ [field]: message });
  });
});

describe('<NewGiftPage />', () => {
  it('shows errors for an empty form without calling the API', async () => {
    const { user } = renderWithProviders(<NewGiftPage />, options());

    await user.click(screen.getByRole('button', { name: 'Post gift' }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Choose a category')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toHaveAttribute('aria-invalid', 'true');
  });

  it('posts the gift and opens its details page', async () => {
    let body: unknown;
    server.use(
      http.post('/api/gifts', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeGift({ id: 'new-1' }), { status: 201 });
      }),
    );
    const { user } = renderWithProviders(<NewGiftPage />, options());

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Post gift' }));

    expect(await screen.findByText('/app/product/new-1')).toBeInTheDocument();
    expect(body).toEqual({
      name: 'Reading Lamp',
      category: 'Living',
      condition: 'Like New',
      zipcode: '94105',
      age_years: 2,
      description: 'Warm light.',
    });
  });

  it('maps server validation errors onto fields', async () => {
    server.use(
      http.post('/api/gifts', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: [{ path: 'zipcode', message: 'must be a 5-digit zipcode' }],
            },
          },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<NewGiftPage />, options());

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Post gift' }));

    expect(await screen.findByText('must be a 5-digit zipcode')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Request validation failed');
  });

  it('sends the user to login when the session expired', async () => {
    server.use(
      http.post('/api/gifts', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
          { status: 401 },
        ),
      ),
    );
    const { user } = renderWithProviders(<NewGiftPage />, options());

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Post gift' }));

    expect(await screen.findByText('/app/login')).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('renders nothing without a session (guarded by ProtectedRoute)', () => {
    const { container } = renderWithProviders(<NewGiftPage />, {
      route: '/app/new',
      path: '/app/new',
    });
    expect(container.querySelector('form')).toBeNull();
  });
});
