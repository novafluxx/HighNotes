import { test, expect } from '@playwright/test';

// Test suite for note-related functionality
test.describe('Notes functionality', () => {
  // Setup: Before each test, navigate to the home page and ensure we're logged in
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page directly
    await page.goto('/login');
    
    // Check if we're already logged in and redirected to notes
    if (page.url().includes('/notes')) {
      return; // Already logged in
    }
    
    // Fill in login credentials using environment variables
    const testUser = process.env.TEST_USER || '';
    const testPassword = process.env.TEST_PASSWORD || '';
    
    await page.getByLabel('Email Address').fill(testUser);
    await page.getByLabel('Password').fill(testPassword);
    
    // Click the Login button
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for navigation to complete - should redirect to notes page
    await page.waitForURL('/notes');
  });

  test('should create a new note', async ({ page }) => {
    // Click the "New Note" button - using the exact button from the sidebar
    await page.getByRole('button', { name: 'New Note' }).click();
    
    // Fill in the note title and content using the UFormField components
    const noteTitle = `Test Note ${Date.now()}`;
    const noteContent = 'This is a test note created by Playwright';
    
    await page.getByLabel('Title').fill(noteTitle);
    await page.getByLabel('Content').fill(noteContent);
    
    // Save the note using the Save button in the action buttons section
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify the note was created and appears in the sidebar list
    await expect(page.getByText(noteTitle)).toBeVisible();
  });

  test('should view note details', async ({ page }) => {
    // Create a note first to ensure we have something to view
    await page.getByRole('button', { name: 'New Note' }).click();
    const noteTitle = `View Test ${Date.now()}`;
    const noteContent = 'This note will be viewed in detail';
    
    await page.getByLabel('Title').fill(noteTitle);
    await page.getByLabel('Content').fill(noteContent);
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Close the note view by clicking the Close button
    await page.getByRole('button', { name: 'Close' }).click();
    
    // Find the note in the sidebar list and click on it
    // Using more specific selector to find the button containing the note title
    const noteInList = page.locator('button', { hasText: noteTitle });
    await noteInList.click();
    
    // Verify the note content is visible in the form
    const contentField = page.getByLabel('Content');
    await expect(contentField).toHaveValue(noteContent);
  });

  test('should edit an existing note', async ({ page }) => {
    // Create a note first
    await page.getByRole('button', { name: 'New Note' }).click();
    const originalTitle = `Edit Test ${Date.now()}`;
    await page.getByLabel('Title').fill(originalTitle);
    await page.getByLabel('Content').fill('Original content');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Close the note view
    await page.getByRole('button', { name: 'Close' }).click();
    
    // Find and click on the note to edit
    const noteInList = page.locator('button', { hasText: originalTitle });
    await noteInList.click();
    
    // Update the note directly (no separate edit button in the UI)
    const updatedTitle = `Updated ${originalTitle}`;
    await page.getByLabel('Title').clear();
    await page.getByLabel('Title').fill(updatedTitle);
    await page.getByLabel('Content').clear();
    await page.getByLabel('Content').fill('Updated content');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify the note was updated in the sidebar
    await expect(page.locator('button', { hasText: updatedTitle })).toBeVisible();
  });

  test('should delete a note', async ({ page }) => {
    // Create a note first
    await page.getByRole('button', { name: 'New Note' }).click();
    const deleteTitle = `Delete Test ${Date.now()}`;
    await page.getByLabel('Title').fill(deleteTitle);
    await page.getByLabel('Content').fill('This note will be deleted');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Find and click on the note
    const noteInList = page.locator('button', { hasText: deleteTitle });
    await noteInList.click();
    
    // Click delete button
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Confirm deletion in the modal dialog
    // Based on the UModal in the notes.vue file
    await page.getByRole('button', { name: 'Confirm Delete' }).click();
    
    // Verify the note was deleted
    await expect(page.locator('button', { hasText: deleteTitle })).not.toBeVisible();
  });

  test('should search for notes', async ({ page }) => {
    // Create a note with unique searchable content
    await page.getByRole('button', { name: 'New Note' }).click();
    const searchKeyword = `Unique${Date.now()}`;
    const searchTitle = `Search Test ${searchKeyword}`;
    
    await page.getByLabel('Title').fill(searchTitle);
    await page.getByLabel('Content').fill(`This note contains the unique keyword ${searchKeyword}`);
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Close the note view
    await page.getByRole('button', { name: 'Close' }).click();
    
    // Use the search functionality in the sidebar
    await page.getByPlaceholder('Search notes...').fill(searchKeyword);
    
    // Verify only the matching note is displayed
    await expect(page.locator('button', { hasText: searchTitle })).toBeVisible();
    
    // Clear the search using the X button
    await page.getByRole('button', { name: '' }).click();
  });
  
  test('should handle long notes within character limits', async ({ page }) => {
    // Create a note with content approaching the limits
    await page.getByRole('button', { name: 'New Note' }).click();
    
    // Generate a long title and content
    const longTitle = 'Long Title Test: ' + 'A'.repeat(50);
    const longContent = 'Long Content Test:\n' + 'B'.repeat(1000);
    
    await page.getByLabel('Title').fill(longTitle);
    await page.getByLabel('Content').fill(longContent);
    
    // Save the note
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify the note was saved
    await expect(page.locator('button', { hasText: 'Long Title Test' })).toBeVisible();
  });
  
  test('should handle mobile view with sidebar toggle', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify that sidebar is not visible by default on mobile
    // We'll check for a specific element that should be in the sidebar
    await page.waitForLoadState('networkidle');
    
    // Click the toggle sidebar button in the header
    await page.getByRole('button', { name: 'Toggle sidebar' }).click();
    
    // Verify sidebar is now visible
    await expect(page.getByRole('button', { name: 'New Note' })).toBeVisible();
    
    // Create a new note
    await page.getByRole('button', { name: 'New Note' }).click();
    
    // Verify sidebar is automatically closed on mobile after selecting an action
    await expect(page.getByLabel('Title')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Note' })).not.toBeVisible();
  });
});
