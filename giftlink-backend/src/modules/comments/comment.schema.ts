/**
 * Request schema for posting a comment or a reply.
 */
import { z } from 'zod';

export const MAX_COMMENT_LENGTH = 500;

export const createCommentSchema = z
  .object({
    text: z.string().trim().min(1, 'cannot be empty').max(MAX_COMMENT_LENGTH),
    /** Present when replying: the id of the comment being answered. */
    parentId: z
      .string()
      .regex(/^[0-9a-f]{24}$/i, 'must be a comment id')
      .optional(),
  })
  .strict();

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
