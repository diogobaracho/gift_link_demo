import { ObjectId } from 'mongodb';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { SentimentClient } from '../../src/lib/sentiment-client.js';
import { bearer, registerUser, type RegisteredUser } from '../helpers/auth.js';
import { createTestContext, type TestContext } from '../helpers/context.js';
import { buildGift, insertGifts } from '../helpers/fixtures.js';

describe('/api/gifts/:id/comments', () => {
  let ctx: TestContext;
  let ana: RegisteredUser;
  const sentiment = { analyze: vi.fn<SentimentClient['analyze']>() };

  beforeAll(async () => {
    ctx = await createTestContext({ sentiment });
    await insertGifts(ctx.db, [buildGift({ id: 'lamp' }), buildGift({ id: 'sofa' })]);
    ana = await registerUser(ctx.app, { firstName: 'Ana', lastName: 'Lee' });
  });
  afterAll(() => ctx.close());

  const post = (giftId: string, body: object, token = ana.token) =>
    request(ctx.app).post(`/api/gifts/${giftId}/comments`).set(bearer(token)).send(body);

  it('returns an empty thread for a gift without comments', async () => {
    const res = await request(ctx.app).get('/api/gifts/sofa/comments').expect(200);
    expect(res.body).toEqual([]);
  });

  it('returns 404 for comments of an unknown gift', async () => {
    await request(ctx.app).get('/api/gifts/ghost/comments').expect(404);
    await post('ghost', { text: 'hi' }).expect(404);
  });

  it('creates a comment with author name and sentiment', async () => {
    sentiment.analyze.mockResolvedValueOnce({ label: 'positive', score: 0.9 });

    const res = await post('lamp', { text: '  I love this lamp!  ' }).expect(201);

    expect(res.body).toMatchObject({
      giftId: 'lamp',
      parentId: null,
      authorId: ana.user.id,
      authorName: 'Ana Lee',
      text: 'I love this lamp!',
      sentiment: { label: 'positive', score: 0.9 },
      replies: [],
    });
    expect(sentiment.analyze).toHaveBeenCalledWith('I love this lamp!');
  });

  it('still creates the comment when sentiment is unavailable (fail-open)', async () => {
    sentiment.analyze.mockResolvedValueOnce(null);
    const res = await post('lamp', { text: 'Is it still available?' }).expect(201);
    expect(res.body.sentiment).toBeNull();
  });

  it('nests replies and returns the thread oldest first', async () => {
    sentiment.analyze.mockResolvedValue(null);
    const bob = await registerUser(ctx.app, { firstName: 'Bob', lastName: 'Ray' });
    const parent = await post('sofa', { text: 'Is the sofa comfy?' }).expect(201);
    await post('sofa', { text: 'Very comfy!', parentId: parent.body.id }, bob.token).expect(201);
    await post('sofa', { text: 'Second question' }).expect(201);

    const res = await request(ctx.app).get('/api/gifts/sofa/comments').expect(200);

    expect(res.body.map((c: { text: string }) => c.text)).toEqual([
      'Is the sofa comfy?',
      'Second question',
    ]);
    expect(res.body[0].replies).toHaveLength(1);
    expect(res.body[0].replies[0]).toMatchObject({ text: 'Very comfy!', authorName: 'Bob Ray' });
  });

  it('rejects a parentId from another gift', async () => {
    const onLamp = await post('lamp', { text: 'Lamp comment' }).expect(201);
    const res = await post('sofa', { text: 'Cross-thread', parentId: onLamp.body.id }).expect(400);
    expect(res.body.error.message).toBe('parentId must reference a comment on this gift');
  });

  it('rejects a parentId that does not exist', async () => {
    await post('lamp', { text: 'x', parentId: new ObjectId().toHexString() }).expect(400);
  });

  it.each([
    ['empty text', { text: '   ' }],
    ['too long', { text: 'a'.repeat(501) }],
    ['malformed parentId', { text: 'x', parentId: 'nope' }],
    ['unknown field', { text: 'x', authorName: 'Spoofed' }],
  ])('validates input: %s', async (_case, body) => {
    const res = await post('lamp', body).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication to post', async () => {
    await request(ctx.app).post('/api/gifts/lamp/comments').send({ text: 'hi' }).expect(401);
  });

  it('rejects a valid token whose account was deleted', async () => {
    const ghost = await registerUser(ctx.app);
    await ctx.db.collection('users').deleteOne({ _id: new ObjectId(ghost.user.id) });
    await post('lamp', { text: 'boo' }, ghost.token).expect(401);
  });

  it('stores comment text verbatim (rendered escaped by the client)', async () => {
    const res = await post('lamp', { text: '<script>alert(1)</script>' }).expect(201);
    expect(res.body.text).toBe('<script>alert(1)</script>');
  });
});
