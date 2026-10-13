/**
 * /api/search routes (completes the skeleton's searchRoutes.js Tasks 1-4).
 */
import { Router } from 'express';

import type { GiftService } from '../gifts/gift.service.js';

import { searchQuerySchema } from './search.schema.js';
import { buildSearchFilter } from './search.service.js';

export function searchRoutes(gifts: GiftService): Router {
  const router = Router();

  /** GET /api/search?name=&category=&condition=&age_years= → matching gifts (max 50). */
  router.get('/', async (req, res) => {
    const query = searchQuerySchema.parse(req.query);
    res.json(await gifts.find(buildSearchFilter(query)));
  });

  return router;
}
