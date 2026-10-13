import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestContext, type TestContext } from '../helpers/context.js';

describe('application shell', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('GET /health reports liveness', async () => {
    const res = await request(ctx.app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /ready pings MongoDB', async () => {
    const res = await request(ctx.app).get('/ready').expect(200);
    expect(res.body).toEqual({ status: 'ready', mongo: true });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(ctx.app).get('/api/nope').expect(404);
    expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: 'Route GET /api/nope not found' });
  });

  it('rejects malformed JSON bodies with 400', async () => {
    const res = await request(ctx.app)
      .post('/api/anything')
      .set('Content-Type', 'application/json')
      .send('{"broken":')
      .expect(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('sets security headers and a request id', async () => {
    const res = await request(ctx.app).get('/health').set('x-request-id', 'abc-123');

    expect(res.headers['x-request-id']).toBe('abc-123');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('answers CORS preflight only for allowed origins', async () => {
    const allowed = await request(ctx.app)
      .options('/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const denied = await request(ctx.app)
      .options('/health')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
