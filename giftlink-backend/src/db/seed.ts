/**
 * Idempotent database seeding (replaces the course's `util/import-mongo`).
 *
 * Guarantees:
 *  - **Validate first**: every gift record is checked with `giftSchema` before any write,
 *    so a bad file never leaves the database half-seeded.
 *  - **Idempotent**: gifts are upserted by their public `id`, users by `email`, and
 *    comments by a deterministic `_id`. Running the seed N times equals running it once.
 *  - **Reset**: `{ reset: true }` empties the collections first (indexes are kept).
 */
import { createHash } from 'node:crypto';

import { ObjectId, type AnyBulkWriteOperation, type Db } from 'mongodb';
import { z } from 'zod';

import { giftSchema } from '../modules/gifts/gift.schema.js';
import { hashPassword } from '../lib/password.js';
import type { SentimentClient } from '../lib/sentiment-client.js';

import { getCollections, type CommentDocument, type GiftDocument } from './collections.js';
import { ensureIndexes } from './mongo.js';

/** Demo accounts documented in the README so reviewers can log in immediately. */
export const DEMO_USERS = [
  { email: 'demo@giftlink.dev', firstName: 'Demo', lastName: 'User', password: 'Demo@12345' },
  { email: 'jane@giftlink.dev', firstName: 'Jane', lastName: 'Smith', password: 'Jane@12345' },
] as const;

/**
 * Sample conversation on the first gift: the course's hardcoded comments, now real data.
 * `replyTo` is the index of the parent comment in this list.
 */
const SAMPLE_COMMENTS: { author: 0 | 1; text: string; replyTo?: number }[] = [
  { author: 1, text: 'I would like this! It looks great.' },
  { author: 0, text: 'It is still available, happy to hold it for you.', replyTo: 0 },
  { author: 1, text: 'My family can use one. DM me if it is still available. Thank you!' },
  { author: 0, text: 'This is a good one!' },
];

const seedFileSchema = z.array(giftSchema).min(1);

export interface SeedOptions {
  /** Raw gift records (already JSON-parsed); validated here. */
  gifts: unknown;
  reset?: boolean;
  /** When given, sample comments are labelled; otherwise their sentiment is null. */
  sentiment?: SentimentClient;
}

export interface SeedResult {
  gifts: number;
  users: number;
  comments: number;
}

/** Stable 24-hex ObjectId derived from a string key, so re-seeding upserts the same doc. */
function deterministicObjectId(key: string): ObjectId {
  return new ObjectId(createHash('sha1').update(key).digest('hex').slice(0, 24));
}

export async function seedDatabase(db: Db, options: SeedOptions): Promise<SeedResult> {
  // 1. Validate everything up front. Throws a ZodError that names the bad record.
  const gifts = seedFileSchema.parse(options.gifts);
  const { gifts: giftsCol, users, comments } = getCollections(db);

  // 2. Optional reset. deleteMany keeps the indexes (drop() would remove them).
  if (options.reset) {
    await Promise.all([giftsCol.deleteMany({}), users.deleteMany({}), comments.deleteMany({})]);
  }
  await ensureIndexes(db);

  // 3. Demo users: insert-only ($setOnInsert), so existing passwords/names are untouched.
  const now = new Date();
  for (const user of DEMO_USERS) {
    await users.updateOne(
      { email: user.email },
      {
        $setOnInsert: {
          _id: new ObjectId(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          passwordHash: await hashPassword(user.password),
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }
  const demoUsers = await users.find({ email: { $in: DEMO_USERS.map((u) => u.email) } }).toArray();
  const ownerIds = DEMO_USERS.map((u) => {
    const found = demoUsers.find((d) => d.email === u.email);
    if (!found) throw new Error(`Demo user ${u.email} missing after upsert`);
    return found;
  });

  // 4. Gifts: replace-or-insert by public id, owned alternately by the two demo users.
  const giftOps: AnyBulkWriteOperation<GiftDocument>[] = gifts.map((gift, index) => ({
    replaceOne: {
      filter: { id: gift.id },
      replacement: { ...gift, posted_by: ownerIds[index % ownerIds.length]!._id.toHexString() },
      upsert: true,
    },
  }));
  await giftsCol.bulkWrite(giftOps, { ordered: false });

  // 5. Sample thread on the first gift, with deterministic ids for idempotency.
  const firstGift = gifts[0]!;
  const commentIds = SAMPLE_COMMENTS.map((_, i) =>
    deterministicObjectId(`seed-comment:${firstGift.id}:${i}`),
  );
  const { sentiment } = options;
  const sentiments = sentiment
    ? await Promise.all(SAMPLE_COMMENTS.map((c) => sentiment.analyze(c.text)))
    : [];
  const commentOps: AnyBulkWriteOperation<CommentDocument>[] = SAMPLE_COMMENTS.map((c, i) => {
    const author = ownerIds[c.author]!;
    const doc: CommentDocument = {
      _id: commentIds[i]!,
      giftId: firstGift.id,
      parentId: c.replyTo === undefined ? null : commentIds[c.replyTo]!,
      authorId: author._id.toHexString(),
      authorName: `${author.firstName} ${author.lastName}`,
      text: c.text,
      sentiment: sentiments[i] ?? null,
      // Space the comments out so the thread has a natural order.
      createdAt: new Date(now.getTime() - (SAMPLE_COMMENTS.length - i) * 3_600_000),
    };
    return { updateOne: { filter: { _id: doc._id }, update: { $setOnInsert: doc }, upsert: true } };
  });
  await comments.bulkWrite(commentOps, { ordered: false });

  const [giftCount, userCount, commentCount] = await Promise.all([
    giftsCol.countDocuments(),
    users.countDocuments(),
    comments.countDocuments(),
  ]);
  return { gifts: giftCount, users: userCount, comments: commentCount };
}
