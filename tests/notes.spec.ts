import { test, expect } from '@playwright/test';

test.describe('Notes CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
    const email = process.env.TEST_USER || 'test@example.com';
    const password = process.env.TEST_PASSWORD || 'password';
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/notes');
  });

  test('should allow a user to create a new note', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();

    const noteTitle = `My New Note ${Date.now()}`;
    const noteContent = 'This is the content of my new note.';

    await page.getByPlaceholder('Note Title').fill(noteTitle);
    await page.getByPlaceholder('Start writing your note...').fill(noteContent);
    await page.getByRole('button', { name: 'Save' }).click();

    // Expect the new note to appear in the list
    await expect(page.getByRole('button', { name: new RegExp(noteTitle) })).toBeVisible();
  });

  test('should allow a user to read a note', async ({ page }) => {
    const noteTitle = `My Readable Note ${Date.now()}`;
    const noteContent = 'This is the content of my readable note.';

    // Create a note to read
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.getByPlaceholder('Note Title').fill(noteTitle);
    await page.getByPlaceholder('Start writing your note...').fill(noteContent);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: new RegExp(noteTitle) })).toBeVisible();

    // Read the note
    await page.getByRole('button', { name: new RegExp(noteTitle) }).click();
    await expect(page.getByPlaceholder('Note Title')).toHaveValue(noteTitle);
    await expect(page.getByPlaceholder('Start writing your note...')).toHaveValue(noteContent);
  });

  test('should allow a user to edit an existing note', async ({ page }) => {
    const noteTitle = `My Editable Note ${Date.now()}`;
    const noteContent = 'Initial content.';
    
    // Create a note to edit
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.getByPlaceholder('Note Title').fill(noteTitle);
    await page.getByPlaceholder('Start writing your note...').fill(noteContent);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: new RegExp(noteTitle) })).toBeVisible();

    // Edit the note
    const updatedNoteTitle = `${noteTitle} (Updated)`;
    const updatedNoteContent = 'This content has been updated.';
    
    await page.getByRole('button', { name: new RegExp(noteTitle) }).click();
    await page.getByPlaceholder('Note Title').fill(updatedNoteTitle);
    await page.getByPlaceholder('Start writing your note...').fill(updatedNoteContent);
    await page.getByRole('button', { name: 'Save' }).click();

    // Expect the updated note to be visible and the old one to be gone
    await expect(page.getByRole('button', { name: new RegExp(updatedNoteTitle) })).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(noteTitle) })).not.toBeVisible();
  });

  test('should allow a user to delete a note', async ({ page }) => {
    const noteTitle = `Note to Delete ${Date.now()}`;
    const noteContent = 'This note will be deleted.';

    // Create a note to delete
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.getByPlaceholder('Note Title').fill(noteTitle);
    await page.getByPlaceholder('Start writing your note...').fill(noteContent);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: new RegExp(noteTitle) })).toBeVisible();
    
    // Delete the note
    await page.getByRole('button', { name: new RegExp(noteTitle) }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Confirm deletion in the modal
    await page.getByRole('button', { name: 'Confirm Delete' }).click();

    // Expect the note to be removed from the list
    await expect(page.getByRole('button', { name: new RegExp(noteTitle) })).not.toBeVisible();
  });

  test('should allow a user to cancel deleting a note', async ({ page }) => {
    const noteTitle = `Note to Not Delete ${Date.now()}`;
    const noteContent = 'This note will not be deleted.';

    // Create a note to not delete
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.getByPlaceholder('Note Title').fill(noteTitle);
    await page.getByPlaceholder('Start writing your note...').fill(noteContent);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: new RegExp(noteTitle) })).toBeVisible();
    
    // Attempt to delete the note
    await page.getByRole('button', { name: new RegExp(noteTitle) }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Cancel deletion in the modal
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Expect the note to still be in the list
    await expect(page.getByRole('button', { name: new RegExp(noteTitle) })).toBeVisible();
  });

  test('should not allow a user to create a note with an empty title', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();

    const noteContent = 'This is the content of my new note.';

    await page.getByPlaceholder('Start writing your note...').fill(noteContent);

    // Expect the save button to be disabled
    await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
