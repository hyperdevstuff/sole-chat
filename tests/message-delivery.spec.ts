import { test, expect } from '@playwright/test';

test.describe('Message Delivery', () => {
  test('message from user1 appears for user2', async ({ browser }) => {
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

    const testMessage = `test-msg-${Date.now()}`;
    await page1.getByRole('textbox', { name: /message/i }).fill(testMessage);
    await page1.getByRole('button', { name: /send/i }).click();

    await expect(page2.getByText(testMessage)).toBeVisible({ timeout: 5000 });

    await expect(page1.getByText(testMessage)).toBeVisible();

    await user1.close();
    await user2.close();
  });
});
