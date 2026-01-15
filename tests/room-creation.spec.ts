import { test, expect } from '@playwright/test';

test.describe('Room Creation Flow', () => {
  test('creates room and redirects to chat', async ({ page }) => {
    await page.goto('/');

    await page.context().grantPermissions(['clipboard-write']);

    await page.getByRole('button', { name: /create.*room/i }).click();

    await expect(page).toHaveURL(/\/room\/[a-zA-Z0-9_-]+$/);
  });

  test('shows loading state during creation', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /create.*room/i }).click();

    await expect(page.getByText(/creating/i)).toBeVisible();
  });

  test('displays anonymous username on homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/anon-/)).toBeVisible();
  });
});
