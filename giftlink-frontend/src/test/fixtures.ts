/**
 * Test data builders mirroring API payloads.
 */
import type { AuthResult, Comment, Gift, User } from '../types';

let seq = 0;
const next = () => (seq += 1);

export function makeGift(overrides: Partial<Gift> = {}): Gift {
  const n = next();
  return {
    id: `gift-${n}`,
    name: `Gift ${n}`,
    category: 'Living',
    condition: 'New',
    posted_by: 'user-1',
    zipcode: '94105',
    date_added: 1_693_267_200, // 2023-08-29
    age_days: 400,
    age_years: 1.1,
    description: 'A charming item looking for a new home.',
    image: '/images/lamp.jpeg',
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'ana@example.com',
    firstName: 'Ana',
    lastName: 'Lee',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  const n = next();
  return {
    id: `comment-${n}`,
    giftId: 'gift-1',
    parentId: null,
    authorId: 'user-2',
    authorName: 'Bob Ray',
    text: `Comment ${n}`,
    sentiment: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    replies: [],
    ...overrides,
  };
}

/** An unsigned JWT-shaped token; the client only reads `exp`. */
export function makeToken(expiresInSeconds = 3600): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user-1', exp })}.signature`;
}

export function makeAuthResult(overrides: Partial<User> = {}): AuthResult {
  return { token: makeToken(), user: makeUser(overrides) };
}
