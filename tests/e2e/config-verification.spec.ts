import { test, expect } from '@playwright/test';
import { TEST_CONFIG, validateTestConfig } from './test.config';

test.describe('Configuration Verification', () => {
  test.beforeAll(async () => {
    // Validate test environment configuration
    validateTestConfig();
  });

  test('should have valid test configuration', async () => {
    // Verify essential configuration values
    expect(TEST_CONFIG.urls.base).toBeTruthy();
    expect(TEST_CONFIG.testUser.email).toBeTruthy();
    expect(TEST_CONFIG.testUser.password).toBeTruthy();
    expect(TEST_CONFIG.database.supabaseUrl).toBeTruthy();
    expect(TEST_CONFIG.database.supabaseKey).toBeTruthy();
  });

  test('should be able to access the application', async ({ page }) => {
    // Navigate to the application
    await page.goto(TEST_CONFIG.urls.base);
    
    // Verify the page loads
    await expect(page).toHaveTitle(/High Notes/i);
    
    // Take a screenshot for verification
    await page.screenshot({ 
      path: 'test-results/config-verification.png',
      fullPage: true 
    });
  });

  test('should be able to navigate to login page', async ({ page }) => {
    await page.goto(TEST_CONFIG.urls.login);
    
    // Verify login form elements exist
    await expect(page.locator(TEST_CONFIG.selectors.emailInput)).toBeVisible();
    await expect(page.locator(TEST_CONFIG.selectors.passwordInput)).toBeVisible();
    await expect(page.locator(TEST_CONFIG.selectors.loginButton)).toBeVisible();
  });
});