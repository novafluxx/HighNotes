import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/High Notes/);
});

test('has AppHeader', async ({ page }) => {
  await page.goto('/');

  // Expect the AppHeader component to be visible.
  await expect(page.locator('nav')).toBeVisible();
});
