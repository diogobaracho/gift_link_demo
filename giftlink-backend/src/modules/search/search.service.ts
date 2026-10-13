/**
 * Translates validated search parameters into a MongoDB filter.
 *
 * Kept as a pure function (no I/O), so the query logic is unit tested without a
 * database, and the integration tests only need to prove the wiring.
 */
import type { Filter } from 'mongodb';

import type { GiftDocument } from '../../db/collections.js';
import { escapeRegex } from '../../lib/escape-regex.js';

import type { SearchQuery } from './search.schema.js';

export function buildSearchFilter(query: SearchQuery): Filter<GiftDocument> {
  const filter: Filter<GiftDocument> = {};

  if (query.name) {
    // Partial, case-insensitive match on literal user text (Task 2 of the skeleton).
    filter.name = { $regex: escapeRegex(query.name), $options: 'i' };
  }
  if (query.category) filter.category = query.category;
  if (query.condition) filter.condition = query.condition;
  if (query.age_years !== undefined) {
    // "At most N years old".
    filter.age_years = { $lte: query.age_years };
  }

  return filter;
}
