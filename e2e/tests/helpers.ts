/**
 * Shared E2E helpers. Each test registers its own user so tests are independent and
 * can run in parallel and repeatedly against the same database.
 */
import { expect, type Page } from '@playwright/test';

export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export function newUser(firstName = 'Erin'): TestUser {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  return { firstName, lastName: 'Tester', email: `e2e-${id}@example.com`, password: 'Passw0rd!' };
}

/** Registers through the UI and waits until the app shows the logged-in navbar. */
export async function register(page: Page, user: TestUser = newUser()): Promise<TestUser> {
  await page.goto('/app/register');
  await page.getByLabel('First name').fill(user.firstName);
  await page.getByLabel('Last name').fill(user.lastName);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: `Welcome, ${user.firstName}` })).toBeVisible();
  return user;
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

/** Seeded demo account (see giftlink-backend/src/db/seed.ts). */
export const DEMO = { email: 'demo@giftlink.dev', password: 'Demo@12345', firstName: 'Demo' };
