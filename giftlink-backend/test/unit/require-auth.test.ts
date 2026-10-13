import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { signToken } from '../../src/lib/jwt.js';
import { createLogger } from '../../src/lib/logger.js';
import { errorHandler } from '../../src/middleware/error-handler.js';
import { getAuthUser, requireAuth } from '../../src/middleware/require-auth.js';
import { pinoHttp } from 'pino-http';

const SECRET = 'middleware-secret-123';

function buildApp() {
  const app = express();
  app.use(pinoHttp({ logger: createLogger({ level: 'silent' }) }));
  app.get('/private', requireAuth(SECRET), (req, res) => {
    res.json(getAuthUser(req));
  });
  app.get('/unguarded', (req, res) => {
    res.json(getAuthUser(req));
  });
  app.use(errorHandler);
  return app;
}

describe('requireAuth', () => {
  const app = buildApp();

  it('exposes the user for a valid bearer token', async () => {
    const token = signToken({ sub: 'u1', email: 'u1@x.io' }, { secret: SECRET, expiresIn: '5m' });
    const res = await request(app)
      .get('/private')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual({ id: 'u1', email: 'u1@x.io' });
  });

  it.each([
    ['missing header', undefined, 'Authentication required'],
    ['wrong scheme', 'Basic abc', 'Authentication required'],
    ['empty token', 'Bearer ', 'Authentication required'],
    ['garbage token', 'Bearer not-a-jwt', 'Invalid or expired token'],
  ])('returns 401 for %s', async (_case, header, message) => {
    const req = request(app).get('/private');
    if (header !== undefined) void req.set('Authorization', header);
    const res = await req.expect(401);
    expect(res.body.error).toEqual({ code: 'UNAUTHORIZED', message });
  });

  it('getAuthUser refuses to run on an unguarded route', async () => {
    await request(app).get('/unguarded').expect(401);
  });
});
