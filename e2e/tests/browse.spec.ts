import { expect, test } from '@playwright/test';

test.describe('Browsing gifts', () => {
  test('landing → catalogue → details → back', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'GiftLink' })).toBeVisible();
    await expect(page.getByText('Sharing is the essence of community')).toBeVisible();

    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('heading', { name: 'Available gifts' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(12);

    const firstCard = page.getByRole('article').first();
    const name = (await firstCard.getByRole('heading').textContent())!;
    await firstCard.getByRole('link', { name: /View details/ }).click();

    await expect(page).toHaveURL(/\/app\/product\//);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.getByText('Category')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Comments/ })).toBeVisible();

    await page.getByRole('button', { name: '← Back' }).click();
    await expect(page).toHaveURL(/\/app$/);
  });

  test('paginates through the catalogue', async ({ page }) => {
    await page.goto('/app');
    const pages = page.getByRole('navigation', { name: 'Gift pages' });

    await pages.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(/\?page=2/);
    await expect(page.getByRole('article').first()).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('article')).toHaveCount(12);
  });

  test('shows seeded comments with sentiment on the lamp', async ({ page }) => {
    await page.goto('/app/product/875');
    await expect(page.getByRole('heading', { level: 1, name: 'Lamp' })).toBeVisible();
    await expect(
      page.getByRole('article', { name: 'Comment by Jane Smith' }).first(),
    ).toBeVisible();
    await expect(page.getByRole('list', { name: /Replies to/ }).first()).toBeVisible();
  });

  test('deep links work after a reload and unknown pages show 404', async ({ page }) => {
    await page.goto('/app/product/875');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Lamp' })).toBeVisible();

    await page.goto('/app/product/does-not-exist');
    await expect(page.getByRole('heading', { name: 'Gift not found' })).toBeVisible();

    await page.goto('/nowhere');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('navbar collapses into a menu on small screens @mobile', async ({ page }) => {
    await page.goto('/app');
    const toggle = page.getByRole('button', { name: /toggle navigation/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.getByRole('link', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/app\/search/);
  });
});
