import { describe, expect, it } from 'vitest';

import {
  apiFieldErrors,
  compact,
  validateEmail,
  validatePassword,
  validateRequired,
} from './validation';

describe('validation helpers', () => {
  it.each([
    ['', 'Email is required'],
    ['nope', 'Enter a valid email address'],
    ['a@b.co', undefined],
  ])('validateEmail(%j)', (value, expected) => {
    expect(validateEmail(value)).toBe(expected);
  });

  it('validates passwords, with strength rules only when asked', () => {
    expect(validatePassword('')).toBe('Password is required');
    expect(validatePassword('short')).toBeUndefined();
    expect(validatePassword('short', { checkStrength: true })).toBe(
      'Password must be at least 8 characters',
    );
    expect(validatePassword('x'.repeat(73), { checkStrength: true })).toBe(
      'Password must be at most 72 characters',
    );
    expect(validatePassword('long-enough', { checkStrength: true })).toBeUndefined();
  });

  it('validates required text with a max length', () => {
    expect(validateRequired('  ', 'Name')).toBe('Name is required');
    expect(validateRequired('abc', 'Name', 2)).toBe('Name must be at most 2 characters');
    expect(validateRequired('Ana', 'Name')).toBeUndefined();
  });

  it('compacts away valid fields', () => {
    expect(compact({ a: undefined, b: 'bad' })).toEqual({ b: 'bad' });
  });

  it('maps API validation details onto known fields', () => {
    const details = [
      { path: 'email', message: 'must be a valid email address' },
      { path: 'role', message: 'unknown field' },
      { path: 'password' },
    ];
    expect(apiFieldErrors(details, ['email', 'password'] as const)).toEqual({
      email: 'must be a valid email address',
    });
    expect(apiFieldErrors(undefined, ['email'] as const)).toEqual({});
  });
});
