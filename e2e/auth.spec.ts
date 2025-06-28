import { test, expect } from '@playwright/test';

// Test suite for authentication functionality
test.describe('Authentication functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the home page
    await page.goto('/');
  });

  test('should navigate to login page', async ({ page }) => {
    // Find and click the login link
    const loginLink = page.getByRole('link', { name: /login/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should show validation errors with empty login form', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Submit the form without filling it
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check for validation messages
    // Note: This depends on how your form validation works
    // You might need to adjust these assertions based on your actual implementation
    await expect(page.getByText(/email.*required|required.*email/i)).toBeVisible();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.getByLabel('Email Address').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check for error message
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });

  test('should navigate to signup page from login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Find and click the signup link
    await page.getByRole('link', { name: 'Sign Up' }).click();
    
    // Verify we're on the signup page
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should navigate to password reset page from login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Find and click the reset password link
    await page.getByRole('link', { name: 'Reset it here' }).click();
    
    // Verify we're on the reset page
    await expect(page).toHaveURL(/.*reset/);
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in valid credentials from environment variables
    const testUser = process.env.TEST_USER || '';
    const testPassword = process.env.TEST_PASSWORD || '';
    
    await page.getByLabel('Email Address').fill(testUser);
    await page.getByLabel('Password').fill(testPassword);
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Verify successful login by checking redirect to notes page
    await page.waitForURL('/notes');
    
    // Additional verification that we're logged in
    // This could be checking for user-specific elements or the notes interface
    await expect(page.getByRole('button', { name: 'New Note' })).toBeVisible();
  });
});
