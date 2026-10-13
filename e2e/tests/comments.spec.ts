import { expect, test } from '@playwright/test';

import { register } from './helpers';

test.describe('Comments', () => {
  test('anonymous visitors are invited to log in', async ({ page }) => {
    await page.goto('/app/product/875');
    await expect(page.getByText('to join the conversation.')).toBeVisible();
    await expect(page.getByLabel('Add a comment')).toHaveCount(0);
  });

  test('comment with sentiment, then reply in the thread', async ({ page }) => {
    const user = await register(page);
    const stamp = Date.now();
    await page.goto('/app/product/396');

    const text = `What a wonderful, lovely curtain! (${stamp})`;
    await page.getByLabel('Add a comment').fill(text);
    await page.getByRole('button', { name: 'Post comment' }).click();

    const comment = page.getByRole('article').filter({ hasText: text });
    await expect(comment).toBeVisible();
    await expect(comment.getByText(`${user.firstName} ${user.lastName}`)).toBeVisible();
    // Real sentiment service behind the API.
    await expect(comment.getByText('positive')).toBeVisible();

    await comment.getByRole('button', { name: /Reply to/ }).click();
    await page.getByLabel('Your reply').fill(`Thanks! (${stamp})`);
    await page.getByRole('button', { name: 'Reply', exact: true }).click();

    const replies = page.getByRole('list', {
      name: `Replies to ${user.firstName} ${user.lastName}`,
    });
    await expect(replies.getByText(`Thanks! (${stamp})`)).toBeVisible();
  });
});
