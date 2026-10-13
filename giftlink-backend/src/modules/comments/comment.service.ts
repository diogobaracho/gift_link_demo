/**
 * Comment threads for gifts.
 *
 * Comments live in their own collection rather than embedded in the gift document, so a
 * busy thread cannot grow a gift towards MongoDB's 16 MB document limit, and listing
 * gifts never loads comment payloads.
 */
import { ObjectId } from 'mongodb';

import type { CommentDocument, Collections } from '../../db/collections.js';
import { badRequest, notFound, unauthorized } from '../../lib/http-error.js';
import type { SentimentClient } from '../../lib/sentiment-client.js';
import type { AuthUser } from '../../middleware/require-auth.js';
import type { GiftService } from '../gifts/gift.service.js';

import { buildCommentTree, toPublicComment, type PublicComment } from './comment-tree.js';
import type { CreateCommentInput } from './comment.schema.js';

/** Safety cap on a single thread read. */
const MAX_THREAD_SIZE = 1000;

export class CommentService {
  constructor(
    private readonly collections: Pick<Collections, 'comments' | 'users'>,
    private readonly gifts: GiftService,
    private readonly sentiment: SentimentClient,
  ) {}

  private async assertGiftExists(giftId: string): Promise<void> {
    if (!(await this.gifts.exists(giftId))) throw notFound('Gift not found');
  }

  async listForGift(giftId: string): Promise<PublicComment[]> {
    await this.assertGiftExists(giftId);
    const docs = await this.collections.comments
      .find({ giftId })
      .sort({ createdAt: 1 })
      .limit(MAX_THREAD_SIZE)
      .toArray();
    return buildCommentTree(docs);
  }

  /**
   * @throws {HttpError} 404 unknown gift, 400 parent not on this gift, 401 deleted author.
   */
  async create(giftId: string, user: AuthUser, input: CreateCommentInput): Promise<PublicComment> {
    await this.assertGiftExists(giftId);

    let parentId: ObjectId | null = null;
    if (input.parentId) {
      parentId = new ObjectId(input.parentId);
      // The parent must belong to the same gift, so threads cannot be stitched across gifts.
      const parent = await this.collections.comments.countDocuments(
        { _id: parentId, giftId },
        { limit: 1 },
      );
      if (!parent) throw badRequest('parentId must reference a comment on this gift');
    }

    const author = await this.collections.users.findOne(
      { _id: new ObjectId(user.id) },
      { projection: { firstName: 1, lastName: 1 } },
    );
    if (!author) throw unauthorized('Account no longer exists');

    const doc: CommentDocument = {
      _id: new ObjectId(),
      giftId,
      parentId,
      authorId: user.id,
      // Denormalized display name: one read per thread instead of a join per comment.
      authorName: `${author.firstName} ${author.lastName}`,
      text: input.text,
      sentiment: await this.sentiment.analyze(input.text),
      createdAt: new Date(),
    };
    await this.collections.comments.insertOne(doc);
    return toPublicComment(doc);
  }
}
