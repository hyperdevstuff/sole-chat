import { test, expect } from '@playwright/test';

test.describe('2-User Limit Enforcement', () => {
  test('third user is blocked when room is full', async ({ browser }) => {
    const user1 = await browser.newContext();
    const page1 = await user1.newPage();

    await page1.goto('/');
    await page1.getByRole('button', { name: /create.*room/i }).click();
    await expect(page1).toHaveURL(/\/room\/[a-zA-Z0-9_-]+$/);
    const roomUrl = page1.url();

    const user2 = await browser.newContext();
    const page2 = await user2.newPage();
    await page2.goto(roomUrl);
    await expect(page2).toHaveURL(roomUrl);

    const user3 = await browser.newContext();
    const page3 = await user3.newPage();
    await page3.goto(roomUrl);
    await expect(page3).toHaveURL(/\?error=room-full/);

    await user1.close();
    await user2.close();
    await user3.close();
  });
});
