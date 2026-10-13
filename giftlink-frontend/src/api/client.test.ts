import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../test/server';
import { makeGift } from '../test/fixtures';

import { ApiError, api, toQueryString } from './client';

describe('toQueryString', () => {
  it('skips empty and undefined values', () => {
    expect(toQueryString({ name: 'desk', category: '', age_years: undefined, page: 2 })).toBe(
      '?name=desk&page=2',
    );
  });

  it('returns an empty string when nothing is set', () => {
    expect(toQueryString({ a: undefined })).toBe('');
  });
});

describe('api client', () => {
  it('GETs JSON with query parameters', async () => {
    let url = '';
    server.use(
      http.get('/api/gifts', ({ request }) => {
        url = request.url;
        return HttpResponse.json({
          items: [makeGift()],
          page: 2,
          limit: 6,
          total: 7,
          totalPages: 2,
        });
      }),
    );

    const page = await api.listGifts(2, 6);

    expect(new URL(url).search).toBe('?page=2&limit=6');
    expect(page.items).toHaveLength(1);
  });

  it('sends JSON bodies and the bearer token', async () => {
    let auth: string | null = null;
    let body: unknown;
    server.use(
      http.post('/api/gifts/:id/comments', async ({ request }) => {
        auth = request.headers.get('authorization');
        body = await request.json();
        return HttpResponse.json({ id: 'c1' }, { status: 201 });
      }),
    );

    await api.postComment('g1', { text: 'Hi' }, 'tok-123');

    expect(auth).toBe('Bearer tok-123');
    expect(body).toEqual({ text: 'Hi' });
  });

  it('encodes path segments', async () => {
    let path = '';
    server.use(
      http.get('/api/gifts/:id', ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json(makeGift());
      }),
    );

    await api.getGift('a/b');
    expect(path).toBe('/api/gifts/a%2Fb');
  });

  it('resolves to undefined for 204 No Content', async () => {
    server.use(http.delete('/api/gifts/:id', () => new HttpResponse(null, { status: 204 })));
    await expect(api.deleteGift('g1', 'tok')).resolves.toBeUndefined();
  });

  it('maps API errors to ApiError with code and message', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
          { status: 401 },
        ),
      ),
    );

    const error = await api.login({ email: 'a@b.co', password: 'x' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password',
    });
  });

  it('falls back to a generic error for non-JSON failures', async () => {
    server.use(http.get('/api/search', () => new HttpResponse('Bad gateway', { status: 502 })));

    await expect(api.searchGifts({})).rejects.toMatchObject({
      status: 502,
      code: 'HTTP_ERROR',
      message: 'Request failed with status 502',
    });
  });

  it('reports network failures as NETWORK_ERROR', async () => {
    server.use(http.get('/api/gifts/:id', () => HttpResponse.error()));

    await expect(api.getGift('x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('rethrows aborts untouched so callers can ignore them', async () => {
    server.use(http.get('/api/gifts', () => HttpResponse.json({})));
    const controller = new AbortController();
    controller.abort();

    await expect(api.listGifts(1, 12, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
