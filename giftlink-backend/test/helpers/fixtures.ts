/**
 * Test data builders. Each builder returns a valid object and accepts overrides,
 * so a test states only the fields it cares about.
 */
import type { Db } from 'mongodb';

import type { GiftDocument } from '../../src/db/collections.js';

let sequence = 0;

export function buildGift(overrides: Partial<GiftDocument> = {}): GiftDocument {
  sequence += 1;
  return {
    id: `gift-${sequence}`,
    name: `Gift ${sequence}`,
    category: 'Living',
    condition: 'New',
    posted_by: 'owner-1',
    zipcode: '94105',
    date_added: 1_700_000_000 + sequence,
    age_days: 100,
    age_years: 0.27,
    description: 'A lovely test item.',
    image: '/images/lamp.jpeg',
    ...overrides,
  };
}

export async function insertGifts(db: Db, gifts: GiftDocument[]): Promise<GiftDocument[]> {
  // insertMany mutates the docs by adding `_id`; insert copies so tests can compare.
  await db.collection<GiftDocument>('gifts').insertMany(gifts.map((g) => ({ ...g })));
  return gifts;
}
