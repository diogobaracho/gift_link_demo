/**
 * Shapes of the data exchanged with the GiftLink API (mirrors the backend's zod schemas
 * and OpenAPI document at /api/docs).
 */

export const CATEGORIES = ['Living', 'Bedroom', 'Bathroom', 'Kitchen', 'Office'] as const;
export const CONDITIONS = ['New', 'Like New', 'Older'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Condition = (typeof CONDITIONS)[number];

export interface Gift {
  id: string;
  name: string;
  category: Category;
  condition: Condition;
  posted_by: string;
  zipcode: string;
  /** Unix timestamp in seconds. */
  date_added: number;
  age_days: number;
  age_years: number;
  description: string;
  image: string | null;
}

export interface NewGift {
  name: string;
  category: Category;
  condition: Condition;
  zipcode: string;
  age_years: number;
  description: string;
  image?: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchParams {
  name?: string;
  category?: Category | '';
  condition?: Condition | '';
  age_years?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface Comment {
  id: string;
  giftId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  text: string;
  sentiment: { label: SentimentLabel; score: number } | null;
  createdAt: string;
  replies: Comment[];
}

/** Error body returned by every failing API call. */
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
