import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, registerUser } from '../helpers/auth.js';
import { createTestContext, type TestContext } from '../helpers/context.js';

describe('/api/auth', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  describe('POST /register', () => {
    it('creates the account and returns a token plus the public user', async () => {
      const res = await request(ctx.app)
        .post('/api/auth/register')
        .send({
          email: 'Ana@Example.com',
          password: 'Passw0rd!',
          firstName: 'Ana',
          lastName: 'Lee',
        })
        .expect(201);

      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Lee',
      });
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.user).not.toHaveProperty('password');

      const stored = await ctx.db.collection('users').findOne({ email: 'ana@example.com' });
      expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('returns 409 for an email that exists (case-insensitive)', async () => {
      await registerUser(ctx.app, { email: 'dup@example.com' });
      const res = await request(ctx.app)
        .post('/api/auth/register')
        .send({ email: 'DUP@example.com', password: 'Passw0rd!', firstName: 'A', lastName: 'B' })
        .expect(409);

      expect(res.body.error).toEqual({ code: 'CONFLICT', message: 'Email is already registered' });
    });

    it('returns field-level validation errors', async () => {
      const res = await request(ctx.app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'short', firstName: '', lastName: 'B' })
        .expect(400);

      const paths = res.body.error.details.map((d: { path: string }) => d.path);
      expect(paths).toEqual(expect.arrayContaining(['email', 'password', 'firstName']));
    });

    it('rejects unknown fields (no mass assignment)', async () => {
      await request(ctx.app)
        .post('/api/auth/register')
        .send({
          email: 'x@y.io',
          password: 'Passw0rd!',
          firstName: 'A',
          lastName: 'B',
          role: 'admin',
        })
        .expect(400);
    });
  });

  describe('POST /login', () => {
    it('returns a token for valid credentials', async () => {
      const { user, password } = await registerUser(ctx.app);
      const res = await request(ctx.app)
        .post('/api/auth/login')
        .send({ email: user.email.toUpperCase(), password })
        .expect(200);

      expect(res.body.user.id).toBe(user.id);
      expect(res.body.token).toEqual(expect.any(String));
    });

    it('uses the same generic 401 for a wrong password and an unknown email', async () => {
      const { user } = await registerUser(ctx.app);

      const wrongPassword = await request(ctx.app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'nope-nope' })
        .expect(401);
      const unknownEmail = await request(ctx.app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'nope-nope' })
        .expect(401);

      expect(wrongPassword.body).toEqual(unknownEmail.body);
      expect(wrongPassword.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('GET /me', () => {
    it('returns the current user', async () => {
      const { token, user } = await registerUser(ctx.app);
      const res = await request(ctx.app).get('/api/auth/me').set(bearer(token)).expect(200);
      expect(res.body.user).toMatchObject({ id: user.id, email: user.email });
    });

    it('requires a token', async () => {
      await request(ctx.app).get('/api/auth/me').expect(401);
    });

    it('returns 404 when the account no longer exists', async () => {
      const { token, user } = await registerUser(ctx.app);
      await ctx.db.collection('users').deleteOne({ email: user.email });
      await request(ctx.app).get('/api/auth/me').set(bearer(token)).expect(404);
    });
  });

  describe('PUT /update', () => {
    it('updates the name and returns the new profile', async () => {
      const { token } = await registerUser(ctx.app, { firstName: 'Old' });
      const res = await request(ctx.app)
        .put('/api/auth/update')
        .set(bearer(token))
        .send({ firstName: '  New  ' })
        .expect(200);

      expect(res.body.user).toMatchObject({ firstName: 'New', lastName: 'User' });
    });

    it('rejects an empty update', async () => {
      const { token } = await registerUser(ctx.app);
      const res = await request(ctx.app)
        .put('/api/auth/update')
        .set(bearer(token))
        .send({})
        .expect(400);
      expect(res.body.error.details[0].message).toBe('Provide at least one field to update');
    });

    it('does not allow changing the email', async () => {
      const { token } = await registerUser(ctx.app);
      await request(ctx.app)
        .put('/api/auth/update')
        .set(bearer(token))
        .send({ email: 'hijack@example.com' })
        .expect(400);
    });

    it('requires a token', async () => {
      await request(ctx.app).put('/api/auth/update').send({ firstName: 'X' }).expect(401);
    });
  });
});

describe('/api/auth rate limiting', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext({ config: { authRateLimitMax: 3 } });
  });
  afterAll(() => ctx.close());

  it('returns 429 once the limit is exceeded', async () => {
    const attempt = () =>
      request(ctx.app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x' });

    for (let i = 0; i < 3; i += 1) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(blocked.headers).toHaveProperty('ratelimit-policy');
  });
});
