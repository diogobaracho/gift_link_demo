import { describe, expect, it } from 'vitest';

import { searchQuerySchema } from '../../src/modules/search/search.schema.js';
import { buildSearchFilter } from '../../src/modules/search/search.service.js';

describe('searchQuerySchema', () => {
  it('treats empty form values as "no filter"', () => {
    expect(
      searchQuerySchema.parse({ name: '', category: '', condition: ' ', age_years: '' }),
    ).toEqual({});
  });

  it('coerces age_years and trims the name', () => {
    expect(searchQuerySchema.parse({ name: '  desk ', age_years: '3' })).toEqual({
      name: 'desk',
      age_years: 3,
    });
  });

  it.each([
    { category: 'Garage' },
    { condition: 'Broken' },
    { age_years: 'old' },
    { age_years: '-1' },
  ])('rejects %o', (query) => {
    expect(searchQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe('buildSearchFilter', () => {
  it('returns an empty filter when nothing is selected', () => {
    expect(buildSearchFilter({})).toEqual({});
  });

  it('builds a case-insensitive partial match on the escaped name', () => {
    expect(buildSearchFilter({ name: 'desk (old)' })).toEqual({
      name: { $regex: 'desk \\(old\\)', $options: 'i' },
    });
  });

  it('combines every filter', () => {
    expect(
      buildSearchFilter({ name: 'lamp', category: 'Kitchen', condition: 'New', age_years: 2 }),
    ).toEqual({
      name: { $regex: 'lamp', $options: 'i' },
      category: 'Kitchen',
      condition: 'New',
      age_years: { $lte: 2 },
    });
  });

  it('keeps an age of zero (falsy but meaningful)', () => {
    expect(buildSearchFilter({ age_years: 0 })).toEqual({ age_years: { $lte: 0 } });
  });
});
