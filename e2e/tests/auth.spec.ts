import { expect, test } from '@playwright/test';

import { DEMO, login, newUser, register } from './helpers';

test.describe('Authentication', () => {
  test('register → logout → login → edit profile', async ({ page }) => {
    const user = await register(page, newUser('Robin'));
    await expect(page).toHaveURL(/\/app$/);

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/app\/login$/);
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

    await login(page, user.email, user.password);
    await expect(page.getByRole('link', { name: 'Welcome, Robin' })).toBeVisible();

    await page.getByRole('link', { name: 'Welcome, Robin' }).click();
    await page.getByRole('button', { name: 'Edit profile' }).click();
    await expect(page.getByLabel('Email')).toBeDisabled();
    await page.getByLabel('First name').fill('Robyn');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Profile updated!')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Welcome, Robyn' })).toBeVisible();

    // The session survives a reload (sessionStorage).
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Hi, Robyn' })).toBeVisible();
  });

  test('rejects a duplicate email and wrong credentials', async ({ page }) => {
    await page.goto('/app/register');
    await page.getByLabel('First name').fill('Dup');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Email').fill(DEMO.email);
    await page.getByLabel('Password').fill('Passw0rd!');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByRole('alert')).toHaveText('Email is already registered');

    await page.goto('/app/login');
    await login(page, DEMO.email, 'definitely-wrong');
    await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
  });

  test('protected pages redirect to login and back', async ({ page }) => {
    await page.goto('/app/new');
    await expect(page).toHaveURL(/\/app\/login$/);

    await login(page, DEMO.email, DEMO.password);
    await expect(page).toHaveURL(/\/app\/new$/);
    await expect(page.getByRole('heading', { name: 'Give an item away' })).toBeVisible();
  });
});
