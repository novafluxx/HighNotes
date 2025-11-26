import { test, expect } from '@playwright/test'

/**
 * End-to-End tests for complete note CRUD workflows
 * These tests run against a real browser with network capabilities
 */

test.describe('Note Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/notes')
  })

  test('should create a new note online', async ({ page }) => {
    // Click "New Note" button
    await page.click('button:has-text("New Note")')

    // Wait for editor to be ready
    await page.waitForSelector('.tiptap')

    // Enter title
    await page.fill('input[placeholder*="title"]', 'My First Note')

    // Enter content in TipTap editor
    const editor = page.locator('.tiptap')
    await editor.click()
    await editor.fill('This is the content of my first note.')

    // Save note
    await page.click('button:has-text("Save")')

    // Verify success toast
    await expect(page.locator('text=Note saved')).toBeVisible({ timeout: 5000 })

    // Verify note appears in sidebar
    await expect(page.locator('text=My First Note')).toBeVisible()
  })

  test('should validate required title', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.waitForSelector('.tiptap')

    // Try to save without title
    const saveButton = page.locator('button:has-text("Save")')
    await expect(saveButton).toBeDisabled()
  })

  test('should validate title length (max 255)', async ({ page }) => {
    await page.click('button:has-text("New Note")')

    const longTitle = 'a'.repeat(256)
    await page.fill('input[placeholder*="title"]', longTitle)

    // Verify validation error or save button disabled
    const saveButton = page.locator('button:has-text("Save")')
    await expect(saveButton).toBeDisabled()
  })

  test('should validate content length (max 5000 visible chars)', async ({ page }) => {
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder*="title"]', 'Long Content Note')

    const editor = page.locator('.tiptap')
    await editor.click()
    await editor.fill('a'.repeat(5001))

    // Verify character count warning or save disabled
    const saveButton = page.locator('button:has-text("Save")')
    await expect(saveButton).toBeDisabled()
  })
})

test.describe('Note Reading and Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/notes')
  })

  test('should load and display notes list', async ({ page }) => {
    // Wait for notes to load
    await page.waitForSelector('[data-testid="notes-list"]', { timeout: 10000 })

    // Verify at least one note exists (from previous tests or seed data)
    const noteItems = page.locator('[data-testid="note-item"]')
    await expect(noteItems.first()).toBeVisible()
  })

  test('should select and display note content', async ({ page }) => {
    await page.waitForSelector('[data-testid="note-item"]')

    // Click first note
    const firstNote = page.locator('[data-testid="note-item"]').first()
    const noteTitle = await firstNote.textContent()
    await firstNote.click()

    // Verify title appears in editor
    const titleInput = page.locator('input[placeholder*="title"]')
    await expect(titleInput).toHaveValue(noteTitle || '')

    // Verify editor is loaded
    await expect(page.locator('.tiptap')).toBeVisible()
  })

  test('should search notes by title', async ({ page }) => {
    await page.waitForSelector('[data-testid="notes-list"]')

    // Enter search query
    await page.fill('input[placeholder*="Search"]', 'First Note')

    // Wait for search to filter
    await page.waitForTimeout(500) // Debounce delay

    // Verify only matching notes shown
    const visibleNotes = page.locator('[data-testid="note-item"]:visible')
    await expect(visibleNotes).toHaveCount(1)
    await expect(visibleNotes).toContainText('First Note')
  })

  test('should paginate notes (load more)', async ({ page }) => {
    // Assumes test account has 30+ notes
    await page.waitForSelector('[data-testid="notes-list"]')

    const initialCount = await page.locator('[data-testid="note-item"]').count()

    // Click "Load More" if visible
    const loadMoreButton = page.locator('button:has-text("Load More")')
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click()
      await page.waitForTimeout(1000)

      const newCount = await page.locator('[data-testid="note-item"]').count()
      expect(newCount).toBeGreaterThan(initialCount)
    }
  })
})

test.describe('Note Updating', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/notes')
  })

  test('should update note title', async ({ page }) => {
    await page.waitForSelector('[data-testid="note-item"]')
    await page.locator('[data-testid="note-item"]').first().click()

    const titleInput = page.locator('input[placeholder*="title"]')
    await titleInput.fill('Updated Title')

    await page.click('button:has-text("Save")')
    await expect(page.locator('text=Note saved')).toBeVisible()

    // Verify sidebar updated
    await expect(page.locator('[data-testid="note-item"]').first()).toContainText('Updated Title')
  })

  test('should update note content', async ({ page }) => {
    await page.waitForSelector('[data-testid="note-item"]')
    await page.locator('[data-testid="note-item"]').first().click()

    const editor = page.locator('.tiptap')
    await editor.click()
    await editor.fill('This is updated content.')

    await page.click('button:has-text("Save")')
    await expect(page.locator('text=Note saved')).toBeVisible()

    // Verify content persisted (reload and check)
    await page.reload()
    await page.waitForSelector('[data-testid="note-item"]')
    await page.locator('[data-testid="note-item"]').first().click()

    await expect(editor).toContainText('This is updated content.')
  })

  test('should auto-save when switching notes', async ({ page }) => {
    await page.waitForSelector('[data-testid="note-item"]')

    // Select and edit first note
    await page.locator('[data-testid="note-item"]').first().click()
    await page.locator('input[placeholder*="title"]').fill('Auto-saved Note')

    // Switch to second note without clicking save
    await page.locator('[data-testid="note-item"]').nth(1).click()

    // Go back to first note
    await page.locator('[data-testid="note-item"]').first().click()

    // Verify auto-save worked
    const titleInput = page.locator('input[placeholder*="title"]')
    await expect(titleInput).toHaveValue('Auto-saved Note')
  })

  test('should track dirty state (enable/disable save button)', async ({ page }) => {
    await page.waitForSelector('[data-testid="note-item"]')
    await page.locator('[data-testid="note-item"]').first().click()

    const saveButton = page.locator('button:has-text("Save")')

    // Save button should be disabled when clean
    await expect(saveButton).toBeDisabled()

    // Edit title
    await page.locator('input[placeholder*="title"]').fill('Modified Title')

    // Save button should be enabled when dirty
    await expect(saveButton).toBeEnabled()

    // Click save
    await saveButton.click()
    await page.waitForTimeout(500)

    // Save button should be disabled after save
    await expect(saveButton).toBeDisabled()
  })
})

test.describe('Note Deletion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/notes')
  })

  test('should delete note with confirmation', async ({ page }) => {
    await page.waitForSelector('[data-testid="note-item"]')

    // Get initial count
    const initialCount = await page.locator('[data-testid="note-item"]').count()

    // Select first note
    await page.locator('[data-testid="note-item"]').first().click()

    // Click delete button
    await page.click('button:has-text("Delete")')

    // Confirm deletion in modal
    await page.click('button:has-text("Confirm")')

    // Verify note removed from list
    await page.waitForTimeout(500)
    const newCount = await page.locator('[data-testid="note-item"]').count()
    expect(newCount).toBe(initialCount - 1)
  })

  test('should cancel deletion', async ({ page }) => {
    await page.waitForSelector('[data-testid="note-item"]')
    const initialCount = await page.locator('[data-testid="note-item"]').count()

    await page.locator('[data-testid="note-item"]').first().click()
    await page.click('button:has-text("Delete")')

    // Cancel deletion
    await page.click('button:has-text("Cancel")')

    // Verify count unchanged
    const newCount = await page.locator('[data-testid="note-item"]').count()
    expect(newCount).toBe(initialCount)
  })
})
