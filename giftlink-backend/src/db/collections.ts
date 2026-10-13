/**
 * Collection names and the TypeScript shape of each stored document.
 *
 * Keeping document types next to the collection accessors gives every query a typed
 * `Collection<T>`, so a typo in a field name is a compile error, not an empty result.
 */
import type { Collection, Db, ObjectId } from 'mongodb';

export const COLLECTIONS = {
  gifts: 'gifts',
  users: 'users',
  comments: 'comments',
} as const;

export const CATEGORIES = ['Living', 'Bedroom', 'Bathroom', 'Kitchen', 'Office'] as const;
export const CONDITIONS = ['New', 'Like New', 'Older'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Condition = (typeof CONDITIONS)[number];

/** A household item being given away. `id` is the public identifier used in URLs. */
export interface GiftDocument {
  _id?: ObjectId;
  id: string;
  name: string;
  category: Category;
  condition: Condition;
  /** Id of the user who posted the gift. */
  posted_by: string;
  zipcode: string;
  /** Unix timestamp in seconds (kept from the course dataset). */
  date_added: number;
  age_days: number;
  age_years: number;
  description: string;
  image: string | null;
}

export interface UserDocument {
  _id: ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface CommentDocument {
  _id: ObjectId;
  giftId: string;
  /** `null` for top-level comments; the parent's id for replies (adjacency list). */
  parentId: ObjectId | null;
  authorId: string;
  authorName: string;
  text: string;
  sentiment: { label: SentimentLabel; score: number } | null;
  createdAt: Date;
}

/** Typed accessors for every collection. */
export function getCollections(db: Db) {
  return {
    gifts: db.collection<GiftDocument>(COLLECTIONS.gifts),
    users: db.collection<UserDocument>(COLLECTIONS.users),
    comments: db.collection<CommentDocument>(COLLECTIONS.comments),
  };
}

export type Collections = ReturnType<typeof getCollections>;
export type GiftCollection = Collection<GiftDocument>;
