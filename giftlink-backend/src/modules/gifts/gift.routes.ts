/**
 * /api/gifts routes (completes the skeleton's giftRoutes.js Tasks 1-4).
 *
 * Express 5 forwards rejected promises to the error handler, so handlers can `await`
 * and `throw` freely with no try/catch boilerplate.
 */
import { Router, type RequestHandler } from 'express';

import { getAuthUser } from '../../middleware/require-auth.js';

import { createGiftSchema, giftIdParamsSchema, listGiftsQuerySchema } from './gift.schema.js';
import type { GiftService } from './gift.service.js';

export function giftRoutes(gifts: GiftService, authenticate: RequestHandler): Router {
  const router = Router();

  /** GET /api/gifts?page=1&limit=12 → paginated list, newest first. */
  router.get('/', async (req, res) => {
    const query = listGiftsQuerySchema.parse(req.query);
    res.json(await gifts.list(query));
  });

  /** GET /api/gifts/:id → one gift or 404. */
  router.get('/:id', async (req, res) => {
    const { id } = giftIdParamsSchema.parse(req.params);
    res.json(await gifts.getById(id));
  });

  /** POST /api/gifts (auth) → 201 created gift, owned by the caller. */
  router.post('/', authenticate, async (req, res) => {
    const input = createGiftSchema.parse(req.body);
    const gift = await gifts.create(input, getAuthUser(req).id);
    res.status(201).location(`/api/gifts/${gift.id}`).json(gift);
  });

  /** DELETE /api/gifts/:id (auth, owner only) → 204. */
  router.delete('/:id', authenticate, async (req, res) => {
    const { id } = giftIdParamsSchema.parse(req.params);
    await gifts.delete(id, getAuthUser(req).id);
    res.status(204).end();
  });

  return router;
}
