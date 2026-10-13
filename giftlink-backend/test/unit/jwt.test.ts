import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { signToken, verifyToken } from '../../src/lib/jwt.js';

const options = { secret: 'unit-test-secret-1234', expiresIn: '1h' as const };

describe('jwt helpers', () => {
  it('round-trips the subject and email', () => {
    const token = signToken({ sub: 'user-1', email: 'a@b.co' }, options);
    expect(verifyToken(token, options.secret)).toEqual({ sub: 'user-1', email: 'a@b.co' });
  });

  it('sets an expiry claim', () => {
    const token = signToken({ sub: 'user-1', email: 'a@b.co' }, options);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.exp! - decoded.iat!).toBe(3600);
  });

  it('rejects a token signed with another secret', () => {
    const token = signToken(
      { sub: 'u', email: 'a@b.co' },
      { ...options, secret: 'other-secret-12345' },
    );
    expect(() => verifyToken(token, options.secret)).toThrow(/invalid signature/);
  });

  it('rejects an expired token', () => {
    const token = jwt.sign(
      { email: 'a@b.co', exp: Math.floor(Date.now() / 1000) - 10 },
      options.secret,
      {
        subject: 'u',
      },
    );
    expect(() => verifyToken(token, options.secret)).toThrow(/expired/);
  });

  it('rejects the "none" algorithm', () => {
    const unsigned = jwt.sign({ email: 'a@b.co' }, '', { algorithm: 'none', subject: 'u' });
    expect(() => verifyToken(unsigned, options.secret)).toThrow();
  });

  it('rejects tokens without the expected claims', () => {
    const token = jwt.sign({ foo: 'bar' }, options.secret);
    expect(() => verifyToken(token, options.secret)).toThrow(/Malformed/);
  });
});
