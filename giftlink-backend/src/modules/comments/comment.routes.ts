/**
 * /api/gifts/:id/comments routes, nested under a gift.
 */
import { Router, type RequestHandler } from 'express';

import { getAuthUser } from '../../middleware/require-auth.js';
import { giftIdParamsSchema } from '../gifts/gift.schema.js';

import { createCommentSchema } from './comment.schema.js';
import type { CommentService } from './comment.service.js';

export function commentRoutes(comments: CommentService, authenticate: RequestHandler): Router {
  // mergeParams exposes the parent router's `:id` (the gift id) to this router.
  const router = Router({ mergeParams: true });

  /** GET /api/gifts/:id/comments → threaded comments, oldest first. */
  router.get('/', async (req, res) => {
    const { id } = giftIdParamsSchema.parse(req.params);
    res.json(await comments.listForGift(id));
  });

  /** POST /api/gifts/:id/comments (auth) { text, parentId? } → 201 comment. */
  router.post('/', authenticate, async (req, res) => {
    const { id } = giftIdParamsSchema.parse(req.params);
    const input = createCommentSchema.parse(req.body);
    res.status(201).json(await comments.create(id, getAuthUser(req), input));
  });

  return router;
}
