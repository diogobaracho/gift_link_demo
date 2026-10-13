import { describe, expect, it } from 'vitest';

import { hashPassword, resolveCostFactor, verifyPassword } from '../../src/lib/password.js';

describe('password hashing', () => {
  it('produces a salted bcrypt hash that verifies', async () => {
    const hash = await hashPassword('Sup3r$ecret');

    expect(hash).toMatch(/^\$2[aby]\$04\$/); // BCRYPT_COST=4 in vitest.config.ts
    expect(hash).not.toContain('Sup3r$ecret');
    await expect(verifyPassword('Sup3r$ecret', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('right-password');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('salts each hash differently', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(a).not.toBe(b);
  });
});

describe('resolveCostFactor', () => {
  it.each([
    ['', 10],
    ['12', 12],
    ['4', 4],
    ['3', 10],
    ['16', 10],
    ['abc', 10],
  ])('BCRYPT_COST=%s → %i', (raw, expected) => {
    expect(resolveCostFactor(raw)).toBe(expected);
  });
});
