import { test, expect } from '@playwright/test';

// Test that the main page has the correct title.
test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect the title to be "High Notes".
  await expect(page).toHaveTitle(/High Notes/);
});

// Test that the main page has a link to the login page.
test('should have a login link', async ({ page }) => {
  await page.goto('/');

  // Find the login link and click it.
  const loginLink = page.getByRole('link', { name: /login/i });
  await expect(loginLink).toBeVisible();
  await loginLink.click();

  // Expect the URL to be the login page.
  await expect(page).toHaveURL(/.*login/);
});
