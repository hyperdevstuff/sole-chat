import { test, expect } from '@playwright/test';

test.describe('Room Destruction', () => {
  test('holding destroy button for 2s triggers destruction modal', async ({ browser }) => {
    const user1 = await browser.newContext();
    const page1 = await user1.newPage();

    await page1.goto('/');
    await page1.getByRole('button', { name: /create.*room/i }).click();
    await expect(page1).toHaveURL(/\/room\/[a-zA-Z0-9_-]+$/);

    await page1.waitForLoadState('networkidle');

    const destroyButton = page1.getByRole('button', { name: /destroy/i });
    await destroyButton.hover();

    const box = await destroyButton.boundingBox();
    if (!box) throw new Error('Destroy button not found');

    await page1.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page1.mouse.down();
    await page1.waitForTimeout(2100);
    await page1.mouse.up();

    const modal = page1.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3000 });

    await user1.close();
  });

  test('both users redirected after destruction confirmed', async ({ browser }) => {
    const user1 = await browser.newContext();
    const page1 = await user1.newPage();

    await page1.goto('/');
    await page1.getByRole('button', { name: /create.*room/i }).click();
    await expect(page1).toHaveURL(/\/room\/[a-zA-Z0-9_-]+$/);
    const roomUrl = page1.url();

    const user2 = await browser.newContext();
    const page2 = await user2.newPage();
    await page2.goto(roomUrl);

    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');

    const destroyButton = page1.getByRole('button', { name: /destroy/i });
    const box = await destroyButton.boundingBox();
    if (!box) throw new Error('Destroy button not found');

    await page1.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page1.mouse.down();
    await page1.waitForTimeout(2100);
    await page1.mouse.up();

    const confirmButton = page1.getByRole('button', { name: /confirm|destroy|yes/i });
    await confirmButton.click();

    await expect(page1).toHaveURL('/', { timeout: 5000 });
    await expect(page2).toHaveURL('/', { timeout: 5000 });

    await user1.close();
    await user2.close();
  });
});
