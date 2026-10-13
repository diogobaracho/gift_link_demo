import { describe, expect, it } from 'vitest';

import { escapeRegex } from '../../src/lib/escape-regex.js';

describe('escapeRegex', () => {
  it('leaves plain text untouched', () => {
    expect(escapeRegex('Desk Chair')).toBe('Desk Chair');
  });

  it('escapes every metacharacter', () => {
    expect(escapeRegex('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('produces a pattern that matches the input literally', () => {
    const input = '(a+)+$ [x]';
    expect(new RegExp(`^${escapeRegex(input)}$`).test(input)).toBe(true);
    expect(new RegExp(escapeRegex('.*')).test('anything')).toBe(false);
  });
});
