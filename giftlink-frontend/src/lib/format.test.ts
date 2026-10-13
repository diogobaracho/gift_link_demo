import { describe, expect, it } from 'vitest';

import { formatAge, formatDate, timeAgo } from './format';

describe('formatDate', () => {
  it('formats unix seconds as a short date (UTC)', () => {
    expect(formatDate(1_693_267_200)).toBe('Aug 29, 2023');
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-01-10T12:00:00Z');

  it.each([
    ['2026-01-10T11:59:50Z', 'just now'],
    ['2026-01-10T11:55:00Z', '5 minutes ago'],
    ['2026-01-10T09:00:00Z', '3 hours ago'],
    ['2026-01-09T12:00:00Z', 'yesterday'],
    ['2025-12-20T12:00:00Z', '3 weeks ago'],
    ['2024-01-10T12:00:00Z', '2 years ago'],
  ])('%s → %s', (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected);
  });
});

describe('formatAge', () => {
  it('pluralizes years', () => {
    expect(formatAge(1)).toBe('1 year');
    expect(formatAge(2.5)).toBe('2.5 years');
  });
});
