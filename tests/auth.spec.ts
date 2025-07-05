import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('successful login redirects to /notes', async ({ page }) => {
    const email = process.env.TEST_USER || 'test@example.com';
    const password = process.env.TEST_PASSWORD || 'password';

    // Fill in the login form
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);

    // Click the login button
    await page.locator('button[type="submit"]').click();

    // Wait for navigation and assert the new URL
    await page.waitForURL('/notes');
    await expect(page).toHaveURL('/notes');

    // Assert that the AppHeader is visible, indicating a successful login state
    await expect(page.locator('nav')).toBeVisible();
  });

  test('failed login shows an error message', async ({ page }) => {
    // Fill in the login form with incorrect credentials
    await page.locator('input[type="email"]').fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');

    // Click the login button
    await page.locator('button[type="submit"]').click();

    // Assert that the error message is visible
    const errorAlert = page.locator('[data-testid="login-error"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Invalid login credentials');
  });
});
