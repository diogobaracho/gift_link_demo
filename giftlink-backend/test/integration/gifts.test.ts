import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, registerUser } from '../helpers/auth.js';
import { buildGift, insertGifts } from '../helpers/fixtures.js';
import { createTestContext, type TestContext } from '../helpers/context.js';

describe('GET /api/gifts', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    // 15 gifts with increasing date_added: gift index 14 is the newest.
    await insertGifts(
      ctx.db,
      Array.from({ length: 15 }, (_, i) => buildGift({ id: `g${i}`, date_added: 1_000 + i })),
    );
  });
  afterAll(() => ctx.close());

  it('returns the first page (12 items) newest first with pagination metadata', async () => {
    const res = await request(ctx.app).get('/api/gifts').expect(200);

    expect(res.body).toMatchObject({ page: 1, limit: 12, total: 15, totalPages: 2 });
    expect(res.body.items).toHaveLength(12);
    expect(res.body.items[0].id).toBe('g14');
    expect(res.body.items[11].id).toBe('g3');
  });

  it('returns the remaining items on the next page', async () => {
    const res = await request(ctx.app).get('/api/gifts?page=2').expect(200);
    expect(res.body.items.map((g: { id: string }) => g.id)).toEqual(['g2', 'g1', 'g0']);
  });

  it('returns an empty page past the end, keeping the total', async () => {
    const res = await request(ctx.app).get('/api/gifts?page=9').expect(200);
    expect(res.body).toMatchObject({ items: [], total: 15, page: 9 });
  });

  it.each([
    ['0', 1],
    ['500', 50],
    ['5', 5],
  ])('clamps limit=%s to %i', async (limit, expected) => {
    const res = await request(ctx.app).get(`/api/gifts?limit=${limit}`).expect(200);
    expect(res.body.limit).toBe(expected);
  });

  it('rejects a non-numeric page with a validation error', async () => {
    const res = await request(ctx.app).get('/api/gifts?page=abc').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toBe('page');
  });

  it('never exposes the internal Mongo _id', async () => {
    const res = await request(ctx.app).get('/api/gifts').expect(200);
    expect(res.body.items.every((g: object) => !('_id' in g))).toBe(true);
  });
});

describe('GET /api/gifts/:id', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    await insertGifts(ctx.db, [buildGift({ id: '875', name: 'Lamp', category: 'Kitchen' })]);
  });
  afterAll(() => ctx.close());

  it('returns the gift by public id', async () => {
    const res = await request(ctx.app).get('/api/gifts/875').expect(200);

    expect(res.body).toMatchObject({ id: '875', name: 'Lamp', category: 'Kitchen' });
    expect(res.body).not.toHaveProperty('_id');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(ctx.app).get('/api/gifts/does-not-exist').expect(404);
    expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: 'Gift not found' });
  });
});

describe('POST /api/gifts', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  const validGift = {
    name: 'Reading Lamp',
    category: 'Living',
    condition: 'Like New',
    zipcode: '94105',
    age_years: 2,
    description: 'Warm light, works perfectly.',
  };

  it('creates a gift owned by the caller with server-controlled fields', async () => {
    const { token, user } = await registerUser(ctx.app);
    const before = Math.floor(Date.now() / 1000);

    const res = await request(ctx.app)
      .post('/api/gifts')
      .set(bearer(token))
      .send(validGift)
      .expect(201);

    expect(res.body).toMatchObject({
      ...validGift,
      posted_by: user.id,
      age_days: 730,
      image: null,
    });
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.date_added).toBeGreaterThanOrEqual(before);
    expect(res.body).not.toHaveProperty('_id');
    expect(res.headers.location).toBe(`/api/gifts/${res.body.id}`);

    await request(ctx.app).get(`/api/gifts/${res.body.id}`).expect(200);
  });

  it('accepts a bundled image path or an https URL', async () => {
    const { token } = await registerUser(ctx.app);
    for (const image of ['/images/lamp.jpeg', 'https://example.com/a.jpg']) {
      const res = await request(ctx.app)
        .post('/api/gifts')
        .set(bearer(token))
        .send({ ...validGift, image })
        .expect(201);
      expect(res.body.image).toBe(image);
    }
  });

  it('requires authentication', async () => {
    await request(ctx.app).post('/api/gifts').send(validGift).expect(401);
  });

  it.each([
    ['unknown category', { category: 'Garage' }],
    ['bad zipcode', { zipcode: 'ABCDE' }],
    ['negative age', { age_years: -1 }],
    ['javascript: image', { image: 'javascript:alert(1)' }],
    ['server-controlled field', { posted_by: 'someone-else' }],
  ])('rejects %s with 400', async (_case, override) => {
    const { token } = await registerUser(ctx.app);
    const res = await request(ctx.app)
      .post('/api/gifts')
      .set(bearer(token))
      .send({ ...validGift, ...override })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/gifts/:id', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('lets the owner delete the gift and its comments', async () => {
    const owner = await registerUser(ctx.app);
    await insertGifts(ctx.db, [buildGift({ id: 'mine', posted_by: owner.user.id })]);
    await ctx.db.collection('comments').insertOne({ giftId: 'mine', text: 'hi' });

    await request(ctx.app).delete('/api/gifts/mine').set(bearer(owner.token)).expect(204);

    await request(ctx.app).get('/api/gifts/mine').expect(404);
    expect(await ctx.db.collection('comments').countDocuments({ giftId: 'mine' })).toBe(0);
  });

  it('forbids other users', async () => {
    const owner = await registerUser(ctx.app);
    const stranger = await registerUser(ctx.app);
    await insertGifts(ctx.db, [buildGift({ id: 'theirs', posted_by: owner.user.id })]);

    const res = await request(ctx.app)
      .delete('/api/gifts/theirs')
      .set(bearer(stranger.token))
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
    await request(ctx.app).get('/api/gifts/theirs').expect(200);
  });

  it('returns 404 for an unknown gift and 401 without a token', async () => {
    const { token } = await registerUser(ctx.app);
    await request(ctx.app).delete('/api/gifts/ghost').set(bearer(token)).expect(404);
    await request(ctx.app).delete('/api/gifts/ghost').expect(401);
  });
});
