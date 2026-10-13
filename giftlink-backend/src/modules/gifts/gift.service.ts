/**
 * Gift business logic on top of the native MongoDB driver.
 *
 * Routes stay thin (parse input → call service → send JSON). The service owns queries,
 * projections and error semantics, so it can be reused by other modules (search, comments).
 */
import { randomUUID } from 'node:crypto';

import type { Filter, WithoutId } from 'mongodb';

import type { Collections, GiftDocument } from '../../db/collections.js';
import { forbidden, notFound } from '../../lib/http-error.js';

import type { CreateGiftInput, ListGiftsQuery } from './gift.schema.js';

/** Gift as returned by the API: Mongo's internal `_id` is never exposed. */
export type PublicGift = WithoutId<GiftDocument>;

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Projection that strips `_id`; `id` is the public identifier. */
const PUBLIC_FIELDS = { projection: { _id: 0 } } as const;

/** Newest first; `id` breaks ties so pagination is stable. */
const DEFAULT_SORT = { date_added: -1, id: 1 } as const;

/** Upper bound for unpaginated queries such as search. */
export const MAX_SEARCH_RESULTS = 50;

const DAYS_PER_YEAR = 365;

export class GiftService {
  private readonly gifts: Collections['gifts'];
  private readonly comments: Collections['comments'];

  constructor(collections: Pick<Collections, 'gifts' | 'comments'>) {
    this.gifts = collections.gifts;
    this.comments = collections.comments;
  }

  /** Offset pagination. Fine at this scale; see the studies notes for keyset pagination. */
  async list({ page, limit }: ListGiftsQuery): Promise<Paginated<PublicGift>> {
    const [items, total] = await Promise.all([
      this.gifts
        .find({}, PUBLIC_FIELDS)
        .sort(DEFAULT_SORT)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      this.gifts.countDocuments(),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  /** @throws {HttpError} 404 when no gift has this public id. */
  async getById(id: string): Promise<PublicGift> {
    const gift = await this.gifts.findOne({ id }, PUBLIC_FIELDS);
    if (!gift) throw notFound('Gift not found');
    return gift;
  }

  /** Runs an already-built filter (see `buildSearchFilter`). */
  find(filter: Filter<GiftDocument>, limit = MAX_SEARCH_RESULTS): Promise<PublicGift[]> {
    return this.gifts.find(filter, PUBLIC_FIELDS).sort(DEFAULT_SORT).limit(limit).toArray();
  }

  /** Cheap existence check used by other modules (e.g. comments). */
  async exists(id: string): Promise<boolean> {
    return (await this.gifts.countDocuments({ id }, { limit: 1 })) > 0;
  }

  /** Creates a gift owned by `ownerId`. The server controls id, owner and timestamps. */
  async create(input: CreateGiftInput, ownerId: string): Promise<PublicGift> {
    const gift: PublicGift = {
      id: randomUUID(),
      name: input.name,
      category: input.category,
      condition: input.condition,
      posted_by: ownerId,
      zipcode: input.zipcode,
      date_added: Math.floor(Date.now() / 1000),
      age_days: Math.round(input.age_years * DAYS_PER_YEAR),
      age_years: input.age_years,
      description: input.description,
      image: input.image ?? null,
    };
    // Insert a copy: the driver adds `_id` to the object it receives.
    await this.gifts.insertOne({ ...gift });
    return gift;
  }

  /**
   * Deletes a gift and its comment thread. Only the owner may delete.
   *
   * @throws {HttpError} 404 when missing, 403 when `userId` is not the owner.
   */
  async delete(id: string, userId: string): Promise<void> {
    const gift = await this.gifts.findOne({ id }, { projection: { posted_by: 1 } });
    if (!gift) throw notFound('Gift not found');
    if (gift.posted_by !== userId) throw forbidden('Only the owner can delete this gift');

    await this.gifts.deleteOne({ id });
    await this.comments.deleteMany({ giftId: id });
  }
}
