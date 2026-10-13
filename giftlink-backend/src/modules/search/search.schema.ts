/**
 * Query-string schema for GET /api/search.
 *
 * HTML forms send empty strings for untouched inputs (`?category=&name=`), so an empty
 * value is treated as "no filter" instead of a validation error.
 */
import { z } from 'zod';

import { CATEGORIES, CONDITIONS } from '../../db/collections.js';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const searchQuerySchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  category: z.preprocess(emptyToUndefined, z.enum(CATEGORIES).optional()),
  condition: z.preprocess(emptyToUndefined, z.enum(CONDITIONS).optional()),
  age_years: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(100).optional()),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
