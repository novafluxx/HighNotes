import { test, expect, Page } from '@playwright/test'

/**
 * E2E tests for offline functionality
 * Uses Playwright's context.setOffline() and service worker APIs
 */

test.describe('Offline Note Creation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/notes')
  })

  test('should create note while offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)

    // Create new note
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder*="title"]', 'Offline Note')

    const editor = page.locator('.tiptap')
    await editor.click()
    await editor.fill('Created while offline')

    // Save note
    await page.click('button:has-text("Save")')

    // Verify "Saved locally" toast
    await expect(page.locator('text=Saved locally')).toBeVisible()

    // Verify note appears in sidebar with local ID indicator (if implemented)
    await expect(page.locator('text=Offline Note')).toBeVisible()
  })

  test('should queue multiple operations offline', async ({ page, context }) => {
    await context.setOffline(true)

    // Create 3 notes offline
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("New Note")')
      await page.fill('input[placeholder*="title"]', `Offline Note ${i}`)
      await page.locator('.tiptap').fill(`Content ${i}`)
      await page.click('button:has-text("Save")')
      await page.waitForTimeout(300)
    }

    // Verify all 3 notes in sidebar
    await expect(page.locator('text=Offline Note 1')).toBeVisible()
    await expect(page.locator('text=Offline Note 2')).toBeVisible()
    await expect(page.locator('text=Offline Note 3')).toBeVisible()
  })

  test('should update offline note', async ({ page, context }) => {
    await context.setOffline(true)

    // Create note offline
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder*="title"]', 'Note to Update')
    await page.locator('.tiptap').fill('Original content')
    await page.click('button:has-text("Save")')
    await page.waitForTimeout(300)

    // Update the note
    await page.locator('text=Note to Update').click()
    await page.fill('input[placeholder*="title"]', 'Updated Offline Note')
    await page.click('button:has-text("Save")')

    // Verify update
    await expect(page.locator('text=Updated Offline Note')).toBeVisible()
    await expect(page.locator('text=Note to Update')).not.toBeVisible()
  })

  test('should delete offline note', async ({ page, context }) => {
    await context.setOffline(true)

    // Create note offline
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder*="title"]', 'Note to Delete')
    await page.locator('.tiptap').fill('Will be deleted')
    await page.click('button:has-text("Save")')
    await page.waitForTimeout(300)

    // Delete the note
    await page.locator('text=Note to Delete').click()
    await page.click('button:has-text("Delete")')
    await page.click('button:has-text("Confirm")')

    // Verify deletion
    await expect(page.locator('text=Note to Delete')).not.toBeVisible()
  })
})

test.describe('Offline → Online Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/notes')
  })

  test('should sync created notes when going online', async ({ page, context }) => {
    // Go offline and create note
    await context.setOffline(true)
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder*="title"]', 'Sync Test Note')
    await page.locator('.tiptap').fill('Will sync soon')
    await page.click('button:has-text("Save")')
    await page.waitForTimeout(300)

    // Go back online
    await context.setOffline(false)

    // Wait for sync to complete (should trigger automatically)
    // Look for "Synced" indicator or toast
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 10000 })

    // Verify note still exists
    await expect(page.locator('text=Sync Test Note')).toBeVisible()

    // Refresh page to verify persistence
    await page.reload()
    await page.waitForSelector('[data-testid="notes-list"]')
    await expect(page.locator('text=Sync Test Note')).toBeVisible()
  })

  test('should handle create → update → sync sequence', async ({ page, context }) => {
    await context.setOffline(true)

    // Create note offline
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder*="title"]', 'Sequential Ops Note')
    await page.locator('.tiptap').fill('Original')
    await page.click('button:has-text("Save")')
    await page.waitForTimeout(300)

    // Update it immediately
    await page.locator('text=Sequential Ops Note').click()
    await page.locator('.tiptap').fill('Updated content')
    await page.click('button:has-text("Save")')
    await page.waitForTimeout(300)

    // Go online and sync
    await context.setOffline(false)
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 10000 })

    // Verify final state
    await page.reload()
    await page.waitForSelector('[data-testid="notes-list"]')
    await page.locator('text=Sequential Ops Note').click()
    await expect(page.locator('.tiptap')).toContainText('Updated content')
  })

  test('should handle create → delete → sync sequence', async ({ page, context }) => {
    await context.setOffline(true)

    // Create and immediately delete
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder*="title"]', 'Temporary Note')
    await page.locator('.tiptap').fill('Will be deleted')
    await page.click('button:has-text("Save")')
    await page.waitForTimeout(300)

    await page.locator('text=Temporary Note').click()
    await page.click('button:has-text("Delete")')
    await page.click('button:has-text("Confirm")')
    await page.waitForTimeout(300)

    // Go online
    await context.setOffline(false)
    await page.waitForTimeout(2000)

    // Verify note does not exist after sync
    await page.reload()
    await page.waitForSelector('[data-testid="notes-list"]')
    await expect(page.locator('text=Temporary Note')).not.toBeVisible()
  })

  test('should handle network failure gracefully', async ({ page, context }) => {
    // Start online
    await page.click('button:has-text("New Note")')
    await page.fill('input[placeholder*="title"]', 'Network Fail Test')
    await page.locator('.tiptap').fill('Content here')

    // Go offline just before save
    await context.setOffline(true)
    await page.click('button:has-text("Save")')

    // Should fallback to offline save
    await expect(page.locator('text=Saved locally')).toBeVisible()

    // Go online and verify sync
    await context.setOffline(false)
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Service Worker Cache', () => {
  test('should work offline after initial load', async ({ page, context }) => {
    // Load app online first (caches assets)
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/notes')

    // Wait for service worker to activate
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Reload page - should load from cache
    await page.reload()

    // Verify app still works
    await expect(page.locator('[data-testid="notes-list"]')).toBeVisible()
    await expect(page.locator('button:has-text("New Note")')).toBeVisible()
  })

  test('should display cached notes when offline', async ({ page, context }) => {
    // Load notes online
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/notes')
    await page.waitForSelector('[data-testid="note-item"]')

    // Get note titles for comparison
    const noteTitle = await page.locator('[data-testid="note-item"]').first().textContent()

    // Go offline and reload
    await context.setOffline(true)
    await page.reload()

    // Verify cached notes still visible
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible()
  })
})

test.describe('Offline Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/notes')
  })

  test('should show offline indicator when disconnected', async ({ page, context }) => {
    await context.setOffline(true)

    // Look for offline indicator (if implemented in UI)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible({ timeout: 3000 })
  })

  test('should show online indicator when reconnected', async ({ page, context }) => {
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    await context.setOffline(false)

    // Look for online indicator or removal of offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible({ timeout: 3000 })
  })

  test('should show pending sync count when offline', async ({ page, context }) => {
    await context.setOffline(true)

    // Create 3 notes
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("New Note")')
      await page.fill('input[placeholder*="title"]', `Pending ${i}`)
      await page.click('button:has-text("Save")')
      await page.waitForTimeout(300)
    }

    // Look for pending count indicator (if implemented)
    await expect(page.locator('[data-testid="pending-sync-count"]')).toContainText('3')
  })
})
