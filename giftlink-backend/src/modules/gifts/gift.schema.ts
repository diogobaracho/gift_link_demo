/**
 * Gift validation schemas: the single source of truth for gift shapes.
 *
 * The same schemas validate seed data, request bodies and query strings, and the
 * TypeScript types are inferred from them (`z.infer`), so they cannot drift apart.
 */
import { z } from 'zod';

import { CATEGORIES, CONDITIONS } from '../../db/collections.js';

/** Either one of the bundled images (`/images/lamp.jpeg`) or an absolute http(s) URL. */
export const imageSchema = z.union([
  z.string().regex(/^\/images\/[\w.-]+$/, 'must be /images/<file> or an http(s) URL'),
  z.url({ protocol: /^https?$/ }),
]);

/** Full stored gift (public fields only; Mongo's `_id` is never exposed). */
export const giftSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS),
  posted_by: z.string().min(1),
  zipcode: z.string().regex(/^\d{5}$/, 'must be a 5-digit zipcode'),
  date_added: z.number().int().nonnegative(),
  age_days: z.number().int().nonnegative(),
  age_years: z.number().nonnegative(),
  description: z.string().trim().min(1).max(2000),
  image: imageSchema.nullable(),
});

export type Gift = z.infer<typeof giftSchema>;

/** Body of `POST /api/gifts`. Server-controlled fields (id, owner, dates) are excluded. */
export const createGiftSchema = giftSchema
  .pick({ name: true, category: true, condition: true, zipcode: true, description: true })
  .extend({
    age_years: z.number().min(0).max(100),
    image: imageSchema.optional(),
  })
  .strict();

export type CreateGiftInput = z.infer<typeof createGiftSchema>;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

/** Query of `GET /api/gifts`. `limit` is clamped rather than rejected, for friendliness. */
export const listGiftsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .default(DEFAULT_PAGE_SIZE)
    .transform((n) => Math.min(Math.max(n, 1), MAX_PAGE_SIZE)),
});

export type ListGiftsQuery = z.infer<typeof listGiftsQuerySchema>;

/** Route params carrying a gift's public id. */
export const giftIdParamsSchema = z.object({ id: z.string().trim().min(1).max(64) });
