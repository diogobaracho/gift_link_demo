import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildGift, insertGifts } from '../helpers/fixtures.js';
import { createTestContext, type TestContext } from '../helpers/context.js';

const ids = (body: { id: string }[]) => body.map((g) => g.id).sort();

describe('GET /api/search', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    await insertGifts(ctx.db, [
      buildGift({
        id: 'desk',
        name: 'Office Desk',
        category: 'Office',
        condition: 'Like New',
        age_years: 2.5,
      }),
      buildGift({
        id: 'chair',
        name: 'Desk Chair',
        category: 'Office',
        condition: 'Older',
        age_years: 4,
      }),
      buildGift({
        id: 'lamp',
        name: 'Lamp',
        category: 'Kitchen',
        condition: 'New',
        age_years: 0.5,
      }),
      buildGift({
        id: 'bed',
        name: 'Bed Frame',
        category: 'Bedroom',
        condition: 'New',
        age_years: 1,
      }),
    ]);
  });
  afterAll(() => ctx.close());

  it('returns every gift when no filter is given', async () => {
    const res = await request(ctx.app).get('/api/search').expect(200);
    expect(res.body).toHaveLength(4);
  });

  it('matches partial names case-insensitively', async () => {
    const res = await request(ctx.app).get('/api/search?name=DESK').expect(200);
    expect(ids(res.body)).toEqual(['chair', 'desk']);
  });

  it('filters by category', async () => {
    const res = await request(ctx.app).get('/api/search?category=Office').expect(200);
    expect(ids(res.body)).toEqual(['chair', 'desk']);
  });

  it('filters by condition', async () => {
    const res = await request(ctx.app).get('/api/search?condition=New').expect(200);
    expect(ids(res.body)).toEqual(['bed', 'lamp']);
  });

  it('filters by maximum age in years', async () => {
    const res = await request(ctx.app).get('/api/search?age_years=1').expect(200);
    expect(ids(res.body)).toEqual(['bed', 'lamp']);
  });

  it('combines filters with AND semantics', async () => {
    const res = await request(ctx.app)
      .get('/api/search?name=desk&category=Office&condition=Older&age_years=5')
      .expect(200);
    expect(ids(res.body)).toEqual(['chair']);
  });

  it('ignores empty form fields', async () => {
    const res = await request(ctx.app)
      .get('/api/search?name=&category=&condition=&age_years=')
      .expect(200);
    expect(res.body).toHaveLength(4);
  });

  it('treats regex metacharacters literally instead of failing', async () => {
    const res = await request(ctx.app).get('/api/search?name=.*(').expect(200);
    expect(res.body).toEqual([]);
  });

  it('returns 400 for an unknown category', async () => {
    const res = await request(ctx.app).get('/api/search?category=Garage').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
