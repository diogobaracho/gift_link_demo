import { expect, test } from '@playwright/test';

test.describe('Searching', () => {
  test('filters by name and category, and the URL is shareable', async ({ page }) => {
    await page.goto('/app/search');
    await expect(page.getByText(/\d+ results?/)).toBeVisible();

    await page.getByLabel('Name').fill('desk');
    await page.getByLabel('Category').selectOption('Office');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page).toHaveURL(/name=desk&category=Office/);
    const results = page.getByRole('list', { name: 'Search results' });
    await expect(results.getByRole('heading', { name: 'Office Desk' })).toBeVisible();
    await expect(results.getByRole('heading', { name: 'Desk Chair' })).toBeVisible();

    // Reloading the shared URL restores both the form and the results.
    await page.reload();
    await expect(page.getByLabel('Name')).toHaveValue('desk');
    await expect(results.getByRole('heading', { name: 'Office Desk' })).toBeVisible();
  });

  test('age slider limits results and shows its value', async ({ page }) => {
    await page.goto('/app/search');
    await page.getByRole('slider').fill('1');
    await expect(page.getByText('1 year', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/age_years=1/);
  });

  test('explains when nothing matches', async ({ page }) => {
    await page.goto('/app/search?name=zzzz-no-such-gift');
    await expect(page.getByText('No gifts found, please revise your filters.')).toBeVisible();
  });
});
