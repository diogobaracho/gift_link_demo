/**
 * Helpers for authenticated requests in integration tests.
 */
import { randomUUID } from 'node:crypto';

import type { Express } from 'express';
import request from 'supertest';

export interface RegisteredUser {
  token: string;
  user: { id: string; email: string; firstName: string; lastName: string };
  password: string;
}

/** Registers a fresh user through the real API and returns its token. */
export async function registerUser(
  app: Express,
  overrides: Partial<{ email: string; firstName: string; lastName: string; password: string }> = {},
): Promise<RegisteredUser> {
  const body = {
    email: `user-${randomUUID().slice(0, 8)}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    password: 'Passw0rd!',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body).expect(201);
  return { ...(res.body as Omit<RegisteredUser, 'password'>), password: body.password };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
