import { describe, expect, it } from 'vitest';

import { makeToken } from '../test/fixtures';

import { decodeJwtPayload, msUntilExpiry } from './jwt';

describe('jwt helpers', () => {
  it('decodes the payload of a token', () => {
    expect(decodeJwtPayload(makeToken())).toMatchObject({ sub: 'user-1', exp: expect.any(Number) });
  });

  it.each(['', 'abc', 'a.!!!.c', `a.${btoa('"str"')}.c`])(
    'returns null for malformed %j',
    (token) => {
      expect(decodeJwtPayload(token)).toBeNull();
    },
  );

  it('computes the time left before expiry', () => {
    const left = msUntilExpiry(makeToken(60));
    expect(left).toBeGreaterThan(55_000);
    expect(left).toBeLessThanOrEqual(60_000);
  });

  it('treats expired and unreadable tokens as expired', () => {
    expect(msUntilExpiry(makeToken(-10))).toBeLessThan(0);
    expect(msUntilExpiry('garbage')).toBe(0);
  });
});
