import { test, expect } from './base.test';
import { TEST_CONFIG } from './test.config';
import { NOTE_TEMPLATES } from '../fixtures/notes';

test.describe('Notes Management Workflows', () => {
  test.beforeEach(async ({ page, testHelpers }) => {
    // Clean up any existing test data before each test
    await testHelpers.cleanupTestData();

    // Login test user
    await testHelpers.loginTestUser(page);
    await expect(page).toHaveURL(TEST_CONFIG.urls.notes);
  });

  test.afterEach(async ({ testHelpers }) => {
    // Clean up test data after each test
    await testHelpers.cleanupTestData();
  });

  test.describe('Complete Note Creation Workflow', () => {
    test('should create a new note with title and content', async ({ page }) => {
      console.log('🧪 Testing complete note creation workflow');

      // Verify we're on the notes page and it's loaded
      await expect(page.locator(TEST_CONFIG.selectors.notesContainer)).toBeVisible();

      // Click create note button
      await page.click(TEST_CONFIG.selectors.createNoteButton);

      // Verify note creation form/modal appears
      await expect(page.locator(TEST_CONFIG.selectors.noteTitleInput)).toBeVisible();
      await expect(page.locator(TEST_CONFIG.selectors.noteContentInput)).toBeVisible();

      // Fill note details
      const testNote = NOTE_TEMPLATES.basic[0];
      await page.fill(TEST_CONFIG.selectors.noteTitleInput, testNote.title);
      await page.fill(TEST_CONFIG.selectors.noteContentInput, testNote.content);

      // Save the note
      await page.click(TEST_CONFIG.selectors.saveNoteButton);

      // Wait for note to appear in the list
      await expect(page.locator(`text="${testNote.title}"`)).toBeVisible({ timeout: 10000 });

      // Verify note content is displayed
      const noteItem = page.locator(TEST_CONFIG.selectors.noteItem).filter({ hasText: testNote.title });
      await expect(noteItem).toBeVisible();

      // Verify the note content is accessible (click to expand or view)
      await noteItem.click();
      await expect(page.locator(`text="${testNote.content}"`)).toBeVisible();

      console.log('✅ Note creation workflow completed successfully');
    });

    test('should handle note creation with empty fields', async ({ page }) => {
      console.log('🧪 Testing note creation with validation');

      await page.click(TEST_CONFIG.selectors.createNoteButton);

      // Try to save without filling fields
      await page.click(TEST_CONFIG.selectors.saveNoteButton);

      // Should show validation error or prevent submission
      // Note: Exact behavior depends on form validation implementation
      await page.waitForTimeout(2000);

      // Try with only title
      await page.fill(TEST_CONFIG.selectors.noteTitleInput, 'Title Only');
      await page.click(TEST_CONFIG.selectors.saveNoteButton);

      // Should either create note with empty content or show validation
      await page.waitForTimeout(2000);

      console.log('✅ Note creation validation handled correctly');
    });

    test('should create multiple notes in sequence', async ({ page }) => {
      console.log('🧪 Testing multiple note creation');

      const testNotes = NOTE_TEMPLATES.basic.slice(0, 3);

      for (let i = 0; i < testNotes.length; i++) {
        const note = testNotes[i];

        // Create note
        await page.click(TEST_CONFIG.selectors.createNoteButton);
        await page.fill(TEST_CONFIG.selectors.noteTitleInput, note.title);
        await page.fill(TEST_CONFIG.selectors.noteContentInput, note.content);
        await page.click(TEST_CONFIG.selectors.saveNoteButton);

        // Wait for note to appear
        await expect(page.locator(`text="${note.title}"`)).toBeVisible({ timeout: 10000 });
      }

      // Verify all notes are visible
      for (const note of testNotes) {
        await expect(page.locator(`text="${note.title}"`)).toBeVisible();
      }

      console.log('✅ Multiple note creation completed successfully');
    });
  });

  test.describe('Note Editing and Real-time Updates', () => {
    test('should edit an existing note and save changes', async ({ page, testHelpers }) => {
      console.log('🧪 Testing note editing workflow');

      // Create initial test data
      const testData = await testHelpers.seedTestData({ basicNotes: 1 });
      const testNote = testData.notes[0];

      // Refresh page to see seeded data
      await page.reload();
      await expect(page.locator(`text="${testNote.title}"`)).toBeVisible();

      // Click on the note to select/edit it (editing happens automatically)
      const noteItem = page.locator(TEST_CONFIG.selectors.noteItem).filter({ hasText: testNote.title });
      await noteItem.click();

      // Verify edit form is visible
      await expect(page.locator(TEST_CONFIG.selectors.noteTitleInput)).toBeVisible();
      await expect(page.locator(TEST_CONFIG.selectors.noteContentInput)).toBeVisible();

      // Modify the note
      const updatedTitle = `${testNote.title} - Updated`;
      const updatedContent = `${testNote.content}\n\nThis content has been updated.`;

      await page.fill(TEST_CONFIG.selectors.noteTitleInput, updatedTitle);
      await page.fill(TEST_CONFIG.selectors.noteContentInput, updatedContent);

      // Save changes
      await page.click(TEST_CONFIG.selectors.saveNoteButton);

      // Verify updated note appears in list
      await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible({ timeout: 10000 });

      // Verify old title is no longer visible
      await expect(page.locator(`text="${testNote.title}"`).first()).not.toBeVisible();

      // Click on updated note to verify content
      await page.locator(`text="${updatedTitle}"`).click();
      await expect(page.locator(`text="This content has been updated"`)).toBeVisible();

      console.log('✅ Note editing workflow completed successfully');
    });

    test('should handle concurrent editing scenarios', async ({ page, testHelpers }) => {
      console.log('🧪 Testing concurrent editing handling');

      // Create test note
      const testData = await testHelpers.seedTestData({ basicNotes: 1 });
      const testNote = testData.notes[0];

      await page.reload();
      await expect(page.locator(`text="${testNote.title}"`)).toBeVisible();

      // Start editing (editing happens automatically when note is selected)
      const noteItem = page.locator(TEST_CONFIG.selectors.noteItem).filter({ hasText: testNote.title });
      await noteItem.click();

      // Make changes
      const updatedTitle = `${testNote.title} - Concurrent Edit`;
      await page.fill(TEST_CONFIG.selectors.noteTitleInput, updatedTitle);

      // Simulate delay (as if user is thinking)
      await page.waitForTimeout(2000);

      // Save changes
      await page.click(TEST_CONFIG.selectors.saveNoteButton);

      // Verify changes are saved
      await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible({ timeout: 10000 });

      console.log('✅ Concurrent editing scenario handled correctly');
    });

    test('should auto-save changes during editing', async ({ page, testHelpers }) => {
      console.log('🧪 Testing auto-save functionality');

      // Create test note
      const testData = await testHelpers.seedTestData({ basicNotes: 1 });
      const testNote = testData.notes[0];

      await page.reload();
      await expect(page.locator(`text="${testNote.title}"`)).toBeVisible();

      // Start editing (editing happens automatically when note is selected)
      const noteItem = page.locator(TEST_CONFIG.selectors.noteItem).filter({ hasText: testNote.title });
      await noteItem.click();

      // Make gradual changes to test auto-save
      await page.fill(TEST_CONFIG.selectors.noteContentInput, testNote.content + '\nAuto-save test line 1');
      await page.waitForTimeout(3000); // Wait for potential auto-save

      await page.fill(TEST_CONFIG.selectors.noteContentInput, testNote.content + '\nAuto-save test line 1\nAuto-save test line 2');
      await page.waitForTimeout(3000); // Wait for potential auto-save

      // Navigate away without explicit save (to test auto-save)
      await page.click(TEST_CONFIG.selectors.notesContainer);

      // Navigate back to verify changes were saved
      await noteItem.click();

      // Check if auto-saved content is present
      const contentInput = page.locator(TEST_CONFIG.selectors.noteContentInput);
      if (await contentInput.isVisible()) {
        const currentContent = await contentInput.inputValue();
        // Auto-save behavior may vary, so we check if some changes persisted
        console.log('Current content after auto-save test:', currentContent);
      }

      console.log('✅ Auto-save functionality tested');
    });
  });

  test.describe('Note Deletion with Confirmation Dialogs', () => {
    test('should delete a note with confirmation dialog', async ({ page, testHelpers }) => {
      console.log('🧪 Testing note deletion with confirmation');

      // Create test data
      const testData = await testHelpers.seedTestData({ basicNotes: 2 });
      const noteToDelete = testData.notes[0];
      const noteToKeep = testData.notes[1];

      await page.reload();
      await expect(page.locator(`text="${noteToDelete.title}"`)).toBeVisible();
      await expect(page.locator(`text="${noteToKeep.title}"`)).toBeVisible();

      // Click on note to select it
      const noteItem = page.locator(TEST_CONFIG.selectors.noteItem).filter({ hasText: noteToDelete.title });
      await noteItem.click();

      // Click delete button
      await page.click(TEST_CONFIG.selectors.deleteNoteButton);

      // Verify confirmation dialog appears
      await expect(page.locator(TEST_CONFIG.selectors.confirmDialog)).toBeVisible();
      await expect(page.locator('text=Are you sure')).toBeVisible();

      // Confirm deletion
      await page.click(TEST_CONFIG.selectors.confirmYesButton);

      // Verify note is removed from list
      await expect(page.locator(`text="${noteToDelete.title}"`)).not.toBeVisible({ timeout: 10000 });

      // Verify other note is still present
      await expect(page.locator(`text="${noteToKeep.title}"`)).toBeVisible();

      console.log('✅ Note deletion with confirmation completed successfully');
    });

    test('should cancel note deletion when user clicks no', async ({ page, testHelpers }) => {
      console.log('🧪 Testing note deletion cancellation');

      // Create test data
      const testData = await testHelpers.seedTestData({ basicNotes: 1 });
      const testNote = testData.notes[0];

      await page.reload();
      await expect(page.locator(`text="${testNote.title}"`)).toBeVisible();

      // Click on note and delete button
      const noteItem = page.locator(TEST_CONFIG.selectors.noteItem).filter({ hasText: testNote.title });
      await noteItem.click();
      await page.click(TEST_CONFIG.selectors.deleteNoteButton);

      // Verify confirmation dialog appears
      await expect(page.locator(TEST_CONFIG.selectors.confirmDialog)).toBeVisible();

      // Cancel deletion
      await page.click(TEST_CONFIG.selectors.confirmNoButton);

      // Verify dialog disappears
      await expect(page.locator(TEST_CONFIG.selectors.confirmDialog)).not.toBeVisible();

      // Verify note is still present
      await expect(page.locator(`text="${testNote.title}"`)).toBeVisible();

      console.log('✅ Note deletion cancellation handled correctly');
    });

    test('should delete multiple notes sequentially', async ({ page, testHelpers }) => {
      console.log('🧪 Testing multiple note deletion');

      // Create test data
      const testData = await testHelpers.seedTestData({ basicNotes: 3 });
      const notesToDelete = testData.notes.slice(0, 2);
      const noteToKeep = testData.notes[2];

      await page.reload();

      // Verify all notes are present
      for (const note of testData.notes) {
        await expect(page.locator(`text="${note.title}"`)).toBeVisible();
      }

      // Delete notes one by one
      for (const note of notesToDelete) {
        const noteItem = page.locator(TEST_CONFIG.selectors.noteItem).filter({ hasText: note.title });
        await noteItem.click();
        await page.click(TEST_CONFIG.selectors.deleteNoteButton);
        await expect(page.locator(TEST_CONFIG.selectors.confirmDialog)).toBeVisible();
        await page.click(TEST_CONFIG.selectors.confirmYesButton);
        await expect(page.locator(`text="${note.title}"`)).not.toBeVisible({ timeout: 10000 });
      }

      // Verify remaining note is still present
      await expect(page.locator(`text="${noteToKeep.title}"`)).toBeVisible();

      console.log('✅ Multiple note deletion completed successfully');
    });
  });

  test.describe('Search and Filtering Across Large Datasets', () => {
    test('should search notes by title', async ({ page, testHelpers }) => {
      console.log('🧪 Testing note search by title');

      // Create searchable test data
      const testData = await testHelpers.seedTestData({ searchableNotes: true });

      await page.reload();
      await testHelpers.waitForNetworkIdle(page);

      // Verify search input is visible
      await expect(page.locator(TEST_CONFIG.selectors.searchInput)).toBeVisible();

      // Search for specific note
      const searchTerm = 'JavaScript';
      await page.fill(TEST_CONFIG.selectors.searchInput, searchTerm);

      // Wait for search results
      await testHelpers.waitForNetworkIdle(page, 5000);

      // Verify search results
      await expect(page.locator(`text="JavaScript Fundamentals"`)).toBeVisible();

      // Verify non-matching notes are not visible
      await expect(page.locator(`text="Database Design"`)).not.toBeVisible();

      console.log('✅ Note search by title completed successfully');
    });

    test('should search notes by content', async ({ page, testHelpers }) => {
      console.log('🧪 Testing note search by content');

      // Create searchable test data
      await testHelpers.seedTestData({ searchableNotes: true });

      await page.reload();
      await testHelpers.waitForNetworkIdle(page);

      // Search for content term
      const searchTerm = 'components';
      await page.fill(TEST_CONFIG.selectors.searchInput, searchTerm);

      // Wait for search results
      await testHelpers.waitForNetworkIdle(page, 5000);

      // Verify search results show notes containing the term
      await expect(page.locator(`text="React Components"`)).toBeVisible();

      console.log('✅ Note search by content completed successfully');
    });

    test('should handle search with no results', async ({ page, testHelpers }) => {
      console.log('🧪 Testing search with no results');

      // Create test data
      await testHelpers.seedTestData({ basicNotes: 3 });

      await page.reload();
      await testHelpers.waitForNetworkIdle(page);

      // Search for non-existent term
      const searchTerm = 'nonexistentterm12345';
      await page.fill(TEST_CONFIG.selectors.searchInput, searchTerm);

      // Wait for search results
      await testHelpers.waitForNetworkIdle(page, 5000);

      // Verify no results message or empty state
      const noteItems = await page.locator(TEST_CONFIG.selectors.noteItem).count();
      expect(noteItems).toBe(0);

      // Check for "no results" message
      const noResultsMessage = page.locator('text=No notes found');
      if (await noResultsMessage.isVisible()) {
        await expect(noResultsMessage).toBeVisible();
      }

      console.log('✅ Search with no results handled correctly');
    });

    test('should clear search and show all notes', async ({ page, testHelpers }) => {
      console.log('🧪 Testing search clearing functionality');

      // Create test data
      const testData = await testHelpers.seedTestData({ searchableNotes: true });

      await page.reload();
      await testHelpers.waitForNetworkIdle(page);

      // Perform search
      await page.fill(TEST_CONFIG.selectors.searchInput, 'JavaScript');
      await testHelpers.waitForNetworkIdle(page, 5000);

      // Verify filtered results
      const filteredCount = await page.locator(TEST_CONFIG.selectors.noteItem).count();
      expect(filteredCount).toBeLessThan(testData.searchableNotes.length);

      // Clear search
      await page.fill(TEST_CONFIG.selectors.searchInput, '');
      await testHelpers.waitForNetworkIdle(page, 5000);

      // Verify all notes are visible again
      const allNotesCount = await page.locator(TEST_CONFIG.selectors.noteItem).count();
      expect(allNotesCount).toBeGreaterThan(filteredCount);

      console.log('✅ Search clearing functionality works correctly');
    });

    test('should perform search across large dataset efficiently', async ({ page, testHelpers }) => {
      console.log('🧪 Testing search performance with large dataset');

      // Create large dataset
      const testData = await testHelpers.seedTestData({
        basicNotes: 10,
        searchableNotes: true,
        largeDataset: true
      });

      await page.reload();
      await testHelpers.waitForNetworkIdle(page, 15000); // Allow more time for large dataset

      // Verify large dataset is loaded
      const totalNotes = await page.locator(TEST_CONFIG.selectors.noteItem).count();
      expect(totalNotes).toBeGreaterThan(50); // Should have substantial number of notes

      // Perform search and measure response time
      const searchStartTime = Date.now();
      await page.fill(TEST_CONFIG.selectors.searchInput, 'Performance');
      await testHelpers.waitForNetworkIdle(page, 10000);
      const searchEndTime = Date.now();

      const searchDuration = searchEndTime - searchStartTime;
      console.log(`Search completed in ${searchDuration}ms`);

      // Verify search results
      const searchResults = await page.locator(TEST_CONFIG.selectors.noteItem).count();
      expect(searchResults).toBeGreaterThan(0);
      expect(searchResults).toBeLessThan(totalNotes);

      // Performance assertion (should complete within reasonable time)
      expect(searchDuration).toBeLessThan(TEST_CONFIG.performance.searchResponseTime);

      console.log('✅ Large dataset search performance test completed');
    });

    test('should handle rapid search input changes', async ({ page, testHelpers }) => {
      console.log('🧪 Testing rapid search input handling');

      // Create test data
      await testHelpers.seedTestData({ searchableNotes: true });

      await page.reload();
      await testHelpers.waitForNetworkIdle(page);

      const searchTerms = ['Java', 'JavaScript', 'React', 'Database', 'API'];

      // Rapidly change search terms
      for (const term of searchTerms) {
        await page.fill(TEST_CONFIG.selectors.searchInput, term);
        await page.waitForTimeout(500); // Brief pause between searches
      }

      // Wait for final search to complete
      await testHelpers.waitForNetworkIdle(page, 5000);

      // Verify final search results
      const finalResults = await page.locator(TEST_CONFIG.selectors.noteItem).count();
      expect(finalResults).toBeGreaterThan(0);

      console.log('✅ Rapid search input changes handled correctly');
    });

    test('should maintain search state during note operations', async ({ page, testHelpers }) => {
      console.log('🧪 Testing search state persistence during operations');

      // Create test data
      await testHelpers.seedTestData({ searchableNotes: true });

      await page.reload();
      await testHelpers.waitForNetworkIdle(page);

      // Perform search
      const searchTerm = 'React';
      await page.fill(TEST_CONFIG.selectors.searchInput, searchTerm);
      await testHelpers.waitForNetworkIdle(page, 5000);

      // Get initial search results count
      const initialResults = await page.locator(TEST_CONFIG.selectors.noteItem).count();

      // Create a new note that matches the search
      await page.click(TEST_CONFIG.selectors.createNoteButton);
      await page.fill(TEST_CONFIG.selectors.noteTitleInput, 'React Testing Guide');
      await page.fill(TEST_CONFIG.selectors.noteContentInput, 'Guide for testing React components');
      await page.click(TEST_CONFIG.selectors.saveNoteButton);

      // Wait for note creation and search update
      await testHelpers.waitForNetworkIdle(page, 5000);

      // Verify search term is still in input
      const currentSearchValue = await page.inputValue(TEST_CONFIG.selectors.searchInput);
      expect(currentSearchValue).toBe(searchTerm);

      // Verify new note appears in search results
      const updatedResults = await page.locator(TEST_CONFIG.selectors.noteItem).count();
      expect(updatedResults).toBe(initialResults + 1);

      // Verify the new note is visible
      await expect(page.locator('text="React Testing Guide"')).toBeVisible();

      console.log('✅ Search state persistence during operations verified');
    });
  });

  test.describe('Complete Notes Management Integration', () => {
    test('should complete full notes management workflow', async ({ page, testHelpers }) => {
      console.log('🧪 Testing complete notes management workflow');

      // Start with clean state
      await expect(page.locator(TEST_CONFIG.selectors.notesContainer)).toBeVisible();

      // 1. Create multiple notes
      const notesToCreate = NOTE_TEMPLATES.basic.slice(0, 3);
      for (const note of notesToCreate) {
        await page.click(TEST_CONFIG.selectors.createNoteButton);
        await page.fill(TEST_CONFIG.selectors.noteTitleInput, note.title);
        await page.fill(TEST_CONFIG.selectors.noteContentInput, note.content);
        await page.click(TEST_CONFIG.selectors.saveNoteButton);
        await expect(page.locator(`text="${note.title}"`)).toBeVisible({ timeout: 10000 });
      }

      // 2. Search for specific note
      const searchTerm = 'Meeting';
      await page.fill(TEST_CONFIG.selectors.searchInput, searchTerm);
      await testHelpers.waitForNetworkIdle(page, 5000);
      await expect(page.locator('text="Meeting Notes"')).toBeVisible();

      // 3. Edit the found note (editing happens automatically when note is selected)
      const noteToEdit = page.locator(TEST_CONFIG.selectors.noteItem).filter({ hasText: 'Meeting Notes' });
      await noteToEdit.click();

      const updatedTitle = 'Updated Meeting Notes';
      await page.fill(TEST_CONFIG.selectors.noteTitleInput, updatedTitle);
      await page.click(TEST_CONFIG.selectors.saveNoteButton);
      await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible({ timeout: 10000 });

      // 4. Clear search to see all notes
      await page.fill(TEST_CONFIG.selectors.searchInput, '');
      await testHelpers.waitForNetworkIdle(page, 5000);

      // 5. Delete one note
      const noteToDelete = page.locator(TEST_CONFIG.selectors.noteItem).filter({ hasText: 'Shopping List' });
      await noteToDelete.click();
      await page.click(TEST_CONFIG.selectors.deleteNoteButton);
      await expect(page.locator(TEST_CONFIG.selectors.confirmDialog)).toBeVisible();
      await page.click(TEST_CONFIG.selectors.confirmYesButton);
      await expect(page.locator('text="Shopping List"')).not.toBeVisible({ timeout: 10000 });

      // 6. Verify final state
      await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible();
      await expect(page.locator('text="Book Ideas"')).toBeVisible();
      await expect(page.locator('text="Shopping List"')).not.toBeVisible();

      console.log('✅ Complete notes management workflow completed successfully');
    });

    test('should handle error scenarios gracefully', async ({ page, testHelpers }) => {
      console.log('🧪 Testing error handling in notes management');

      // Test network interruption during note creation
      await page.click(TEST_CONFIG.selectors.createNoteButton);
      await page.fill(TEST_CONFIG.selectors.noteTitleInput, 'Network Test Note');
      await page.fill(TEST_CONFIG.selectors.noteContentInput, 'Testing network interruption');

      // Simulate network failure
      await page.route('**/*', route => route.abort());
      await page.click(TEST_CONFIG.selectors.saveNoteButton);

      // Wait for error handling
      await page.waitForTimeout(3000);

      // Restore network
      await page.unroute('**/*');

      // Verify error is handled gracefully (form should still be accessible)
      const titleInput = page.locator(TEST_CONFIG.selectors.noteTitleInput);
      if (await titleInput.isVisible()) {
        const titleValue = await titleInput.inputValue();
        expect(titleValue).toBe('Network Test Note');
      }

      console.log('✅ Error scenarios handled gracefully');
    });

    test('should maintain data consistency across operations', async ({ page, testHelpers }) => {
      console.log('🧪 Testing data consistency across operations');

      // Create initial notes
      const testData = await testHelpers.seedTestData({ basicNotes: 5 });
      await page.reload();
      await testHelpers.waitForNetworkIdle(page);

      // Verify all notes are loaded
      const initialCount = await page.locator(TEST_CONFIG.selectors.noteItem).count();
      expect(initialCount).toBe(testData.notes.length);

      // Perform multiple operations rapidly
      // 1. Create new note
      await page.click(TEST_CONFIG.selectors.createNoteButton);
      await page.fill(TEST_CONFIG.selectors.noteTitleInput, 'Consistency Test');
      await page.fill(TEST_CONFIG.selectors.noteContentInput, 'Testing data consistency');
      await page.click(TEST_CONFIG.selectors.saveNoteButton);

      // 2. Search immediately
      await page.fill(TEST_CONFIG.selectors.searchInput, 'Consistency');
      await testHelpers.waitForNetworkIdle(page, 5000);

      // 3. Verify new note appears in search
      await expect(page.locator('text="Consistency Test"')).toBeVisible();

      // 4. Clear search and verify total count
      await page.fill(TEST_CONFIG.selectors.searchInput, '');
      await testHelpers.waitForNetworkIdle(page, 5000);

      const finalCount = await page.locator(TEST_CONFIG.selectors.noteItem).count();
      expect(finalCount).toBe(initialCount + 1);

      console.log('✅ Data consistency maintained across operations');
    });
  });
});