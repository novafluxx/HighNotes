import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Helper function for login using environment variables
async function loginWithEnvCredentials(page: Page) {
  const testUser = process.env.TEST_USER || '';
  const testPassword = process.env.TEST_PASSWORD || '';
  
  await page.getByLabel('Email Address').fill(testUser);
  await page.getByLabel('Password').fill(testPassword);
  await page.getByRole('button', { name: 'Login' }).click();
}

// Test suite for UI components and responsiveness
test.describe('UI and responsiveness', () => {
  test('should have correct title and branding', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/High Notes/);
    
    // Check for branding elements
    await expect(page.getByRole('heading', { name: /high notes/i, level: 1 })).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Find and click the dark mode toggle button
    // This assumes you have a dark mode toggle in your AppHeader component
    const darkModeButton = page.getByRole('button', { name: /dark mode|theme/i });
    
    // Check initial state (could be light or dark depending on system settings)
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    
    // Toggle the theme
    await darkModeButton.click();
    
    // Check that the theme changed
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    
    expect(newTheme).not.toEqual(initialTheme);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that mobile UI elements are visible
    // This assumes you have a hamburger menu or similar for mobile navigation
    await expect(page.getByRole('button', { name: /menu|toggle/i })).toBeVisible();
    
    // Navigate to notes page
    await page.getByRole('link', { name: /login/i }).click();
    await loginWithEnvCredentials(page);
    
    // Wait for navigation to complete
    await page.waitForURL('/notes');
    
    // Verify mobile layout for notes page
    // Sidebar should be hidden by default on mobile
    await expect(page.locator('aside')).not.toBeVisible();
    
    // Toggle sidebar button should be visible
    await expect(page.getByRole('button', { name: /toggle sidebar/i })).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Navigate to notes page
    await page.getByRole('link', { name: /login/i }).click();
    await loginWithEnvCredentials(page);
    
    // Wait for navigation to complete
    await page.waitForURL('/notes');
    
    // Verify tablet layout - sidebar might be visible by default
    await expect(page.locator('aside')).toBeVisible();
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    
    // Navigate to notes page
    await page.getByRole('link', { name: /login/i }).click();
    await loginWithEnvCredentials(page);
    
    // Wait for navigation to complete
    await page.waitForURL('/notes');
    
    // Verify desktop layout
    // Sidebar should be visible
    await expect(page.locator('aside')).toBeVisible();
    
    // Check that the layout has proper spacing for desktop
    // This checks if the main content area has appropriate padding
    const mainPadding = await page.evaluate(() => {
      const mainElement = document.querySelector('main');
      if (!mainElement) return null;
      
      const computedStyle = window.getComputedStyle(mainElement);
      return {
        paddingLeft: computedStyle.paddingLeft,
        paddingRight: computedStyle.paddingRight
      };
    });
    
    // Verify that padding exists and is appropriate for desktop
    expect(mainPadding).not.toBeNull();
    if (mainPadding) {
      expect(parseInt(mainPadding.paddingLeft)).toBeGreaterThan(15);
      expect(parseInt(mainPadding.paddingRight)).toBeGreaterThan(15);
    }
  });

  test('should show loading states with skeletons', async ({ page }) => {
    // This test checks that skeleton loaders appear during loading states
    // Set a slow connection to better observe loading states
    await page.route('**', async (route) => {
      // Delay all requests by 500ms to simulate slower connection
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    
    await page.goto('/login');
    await loginWithEnvCredentials(page);
    
    // Check for skeleton loaders in the notes list
    // This assumes your app shows skeletons during loading
    await expect(page.locator('div.skeleton, .USkeleton')).toBeVisible();
  });
});
