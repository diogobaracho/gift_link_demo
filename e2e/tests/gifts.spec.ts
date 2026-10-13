import { expect, test } from '@playwright/test';

import { register } from './helpers';

test.describe('Giving an item away', () => {
  test('post a gift, see it, then delete it', async ({ page }) => {
    await register(page);
    const name = `E2E Armchair ${Date.now()}`;

    await page.getByRole('link', { name: 'Post a gift' }).click();
    await page.getByRole('button', { name: 'Post gift' }).click();
    await expect(page.getByText('Name is required')).toBeVisible();

    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Category').selectOption('Living');
    await page.getByLabel('Condition').selectOption('Like New');
    await page.getByLabel('Zip code').fill('94105');
    await page.getByLabel('Age (years)').fill('3');
    await page.getByLabel('Description').fill('Comfy armchair, pick up anytime.');
    await page.getByLabel('Image URL (optional)').fill('/images/couch2.jpeg');
    await page.getByRole('button', { name: 'Post gift' }).click();

    await expect(page).toHaveURL(/\/app\/product\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.getByText('3 years')).toBeVisible();

    // The newest gift is first in the catalogue.
    await page.goto('/app');
    await expect(page.getByRole('article').first().getByRole('heading')).toHaveText(name);

    await page
      .getByRole('article')
      .first()
      .getByRole('link', { name: /View details/ })
      .click();
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Delete gift' }).click();

    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('heading', { name })).toHaveCount(0);
  });
});
