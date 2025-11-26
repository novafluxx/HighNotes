# High Notes Testing Strategy

## Overview

This document outlines the comprehensive testing approach for High Notes' critical features:
- Note CRUD operations (create, read, update, delete)
- Offline-first architecture (IndexedDB queue & cache)
- Real-time synchronization across devices
- Security (XSS prevention, input validation, RLS)

## Testing Layers

### 1. Unit Tests (Vitest)
**Location:** `tests/unit/`

**Coverage:**
- [x] `useOfflineNotes.ts` - Queue operations, cache management, ID replacement
- [x] `useNotes.ts` - CRUD logic, dirty tracking, sync algorithm
- [x] Edge function validation and sanitization logic

**Run:**
```bash
pnpm test:unit
pnpm test:unit --coverage
```

**Key Test Files:**
- [useOfflineNotes.test.ts](tests/unit/useOfflineNotes.test.ts) - IndexedDB operations
- [useNotes.test.ts](tests/unit/useNotes.test.ts) - Core composable logic
- [edge-function-security.test.ts](tests/security/edge-function-security.test.ts) - Security validation

### 2. Integration Tests (Vitest + @nuxt/test-utils)
**Location:** `tests/integration/`

**Coverage:**
- [ ] Offline note creation → online sync flow
- [ ] Create → Update → Sync sequences
- [ ] Create → Delete → Sync sequences
- [ ] Multi-device realtime sync scenarios
- [ ] Queue processing with 100+ operations
- [ ] Network failure recovery

**Run:**
```bash
pnpm test:integration
```

**Key Test Files:**
- [offline-sync.test.ts](tests/integration/offline-sync.test.ts) - Complete offline/online workflows

**Note:** These tests are templates. Full implementation requires Nuxt app mounting and Supabase mocking.

### 3. E2E Tests (Playwright)
**Location:** `tests/e2e/`

**Coverage:**
- [x] Complete user workflows (login → create → edit → delete)
- [x] Offline mode with network emulation
- [x] Service worker caching
- [x] Cross-browser compatibility
- [x] Mobile responsiveness

**Run:**
```bash
# Run all E2E tests
pnpm test:e2e

# Run in headed mode (watch browser)
pnpm test:e2e --headed

# Run specific browser
pnpm test:e2e --project=chromium
```

**Key Test Files:**
- [note-crud.spec.ts](tests/e2e/note-crud.spec.ts) - Full CRUD workflows
- [offline-mode.spec.ts](tests/e2e/offline-mode.spec.ts) - Offline functionality

### 4. Security Tests
**Location:** `tests/security/`

**Coverage:**
- [x] XSS prevention (script tags, event handlers, iframes)
- [x] Input validation (title length, content length, UUID format)
- [x] SQL injection prevention
- [x] CORS validation
- [x] JWT authentication

**Run:**
```bash
pnpm test:security
```

## Critical Test Scenarios

### Priority 1: Offline-First Architecture

#### Scenario 1: Create Note Offline → Sync Online
```typescript
1. Mock navigator.onLine = false
2. Create note via UI → generates local-{uuid}
3. Verify note cached in IndexedDB
4. Verify operation queued
5. Mock navigator.onLine = true
6. Verify sync triggered automatically
7. Verify replaceLocalId() called
8. Verify note has server UUID
9. Verify queue cleared
```

**Test File:** `tests/e2e/offline-mode.spec.ts:66`

#### Scenario 2: Create → Update → Delete Sequence Offline
```typescript
1. Offline: Create note (local-123)
2. Offline: Update note (queues update for local-123)
3. Offline: Delete note
   - Clears create/update from queue
   - Queues delete with local-123
4. Go online and sync
5. Verify create processes (local-123 → server-456)
6. Verify delete processes with mapped ID (server-456)
7. Verify note does not exist
```

**Test File:** `tests/integration/offline-sync.test.ts:49`

#### Scenario 3: Queue with 100+ Operations
```typescript
1. Create 50 notes offline
2. Update 30 of them
3. Delete 20 of them
4. Verify all 100 operations in queue (FIFO order)
5. Go online
6. Verify ID mapping works for dependent operations
7. Verify final state: 30 notes in database
```

**Test File:** `tests/integration/offline-sync.test.ts:133`

### Priority 2: Real-time Synchronization

#### Scenario 1: Concurrent Edit from Multiple Devices
```typescript
1. Device A and B both have note-123 selected
2. Device A updates title to "Version A" → saves
3. Device B updates title to "Version B" → saves
4. Device A receives UPDATE realtime event
5. Device B receives UPDATE realtime event
6. Verify both converge to last-write-wins (timestamp)
```

**Test File:** `tests/integration/offline-sync.test.ts:89`

#### Scenario 2: Delete Currently Selected Note
```typescript
1. Device A has note-123 selected and displayed
2. Device B deletes note-123
3. Device A receives DELETE realtime event
4. Verify Device A clears selection
5. Verify Device A shows "Note deleted" message
```

**Test File:** `tests/integration/offline-sync.test.ts:108`

### Priority 3: Data Integrity

#### Scenario 1: Network Failure Mid-Sync
```typescript
1. Queue 10 operations offline
2. Go online and start sync
3. Operations 1-3 succeed
4. Operation 4 fails (mock network error)
5. Verify operations 5-10 remain in queue
6. Verify operations 1-3 cleared
7. Retry sync → remaining operations succeed
```

**Test File:** `tests/integration/offline-sync.test.ts:152`

#### Scenario 2: Cache Consistency After ID Replacement
```typescript
1. Create note offline (local-123 in cache)
2. Sync to server (receives server-456)
3. Call replaceLocalId(local-123, server-456)
4. Verify getCachedNoteById('local-123') returns undefined
5. Verify getCachedNoteById('server-456') returns note data
```

**Test File:** `tests/unit/useOfflineNotes.test.ts:90`

### Priority 4: Security

#### Scenario 1: XSS Prevention in Content
```typescript
Input: '<p>Safe</p><script>alert("XSS")</script>'
Expected: '<p>Safe</p>' (script tag stripped)
```

**Test File:** `tests/security/edge-function-security.test.ts:17`

#### Scenario 2: Event Handler Removal
```typescript
Input: '<p onclick="alert(\'XSS\')">Click me</p>'
Expected: '<p>Click me</p>' (onclick removed)
```

**Test File:** `tests/security/edge-function-security.test.ts:26`

#### Scenario 3: Title Sanitization (No HTML)
```typescript
Input: 'My Note <script>alert("XSS")</script>'
Expected: 'My Note ' (all HTML stripped)
```

**Test File:** `tests/security/edge-function-security.test.ts:88`

## Test Data Setup

### Seed Data for E2E Tests
```bash
# Create test user
pnpx supabase db seed tests/fixtures/users.sql

# Create sample notes
pnpx supabase db seed tests/fixtures/notes.sql
```

### Example Test User
```
Email: test@example.com
Password: testpassword123
```

### Sample Notes (for pagination testing)
- Create 35 notes to test "Load More" functionality
- Include notes with various content lengths
- Include notes with rich text formatting

## Coverage Goals

| Layer | Target | Current |
|-------|--------|---------|
| Unit Tests | 80% | TBD |
| Integration Tests | 70% | TBD |
| E2E Critical Paths | 100% | TBD |
| Security Tests | 100% | TBD |

## Running Tests

### Local Development
```bash
# Run all unit tests
pnpm test:unit

# Run with coverage
pnpm test:unit --coverage

# Run specific test file
pnpm test:unit tests/unit/useOfflineNotes.test.ts

# Watch mode
pnpm test:unit --watch
```

### E2E Testing
```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run all E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Debug mode
pnpm test:e2e --debug

# Run specific test
pnpm test:e2e tests/e2e/offline-mode.spec.ts
```

### CI/CD Integration
```bash
# Run all tests
pnpm test

# Generate coverage report
pnpm test:coverage

# Run E2E in CI mode
CI=true pnpm test:e2e
```

## Test Environment Setup

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install --with-deps
```

### Environment Variables (`.env.test`)
```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Local Supabase (for E2E tests)
```bash
# Start local Supabase
pnpx supabase start

# Get credentials
pnpx supabase status -o env

# Apply migrations
pnpx supabase db reset
```

## Debugging Tests

### Unit Tests
```bash
# Use VS Code debugger with vitest extension
# Or add debugger statements and run:
node --inspect-brk ./node_modules/.bin/vitest run
```

### E2E Tests
```bash
# Playwright UI mode (best for debugging)
pnpm exec playwright test --ui

# Debug mode (step through test)
pnpm exec playwright test --debug

# Show trace for failed tests
pnpm exec playwright show-report
```

### Common Issues

**Issue: IndexedDB quota exceeded**
```typescript
// Clear IndexedDB before each test
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
```

**Issue: Realtime events not received**
```typescript
// Ensure proper cleanup
afterEach(() => {
  mockSupabaseClient.channel().unsubscribe()
})
```

**Issue: Flaky E2E tests**
```typescript
// Use proper waits instead of timeouts
await page.waitForSelector('[data-testid="note-item"]')
// NOT: await page.waitForTimeout(1000)
```

## Adding New Tests

### 1. New Feature Test Checklist
- [ ] Unit test for core logic
- [ ] Unit test for edge cases
- [ ] Integration test for data flow
- [ ] E2E test for user workflow
- [ ] Security test if handling user input

### 2. Test File Naming
- Unit: `*.test.ts`
- E2E: `*.spec.ts`
- Location: Mirror source structure

### 3. Test Organization
```typescript
describe('Feature Name', () => {
  describe('Sub-feature', () => {
    it('should handle expected behavior', () => {
      // Arrange
      // Act
      // Assert
    })

    it('should handle edge case', () => {
      // Test edge case
    })
  })
})
```

## Performance Testing

### Baseline Metrics
- **Initial Load:** < 2s
- **Note Creation:** < 500ms
- **Note Save:** < 1s (online), < 100ms (offline)
- **Search:** < 300ms
- **Sync 100 Operations:** < 10s

### Load Testing
```bash
# Use k6 for load testing Edge Functions
k6 run tests/load/save-note.js
```

## Monitoring Test Health

### GitHub Actions
```yaml
# .github/workflows/test.yml
- run: pnpm test:unit --coverage
- run: pnpm test:e2e --project=chromium
- uses: codecov/codecov-action@v3
```

### Test Reports
- Unit test coverage: `coverage/index.html`
- Playwright report: `playwright-report/index.html`

## Next Steps

1. **Implement Integration Tests:** Complete the templates in `tests/integration/`
2. **Add Test Data Fixtures:** Create seed data for E2E tests
3. **Set Up CI/CD:** Configure GitHub Actions for automated testing
4. **Increase Coverage:** Target 80% coverage for critical composables
5. **Add Visual Regression Testing:** Use Playwright screenshots
6. **Performance Benchmarks:** Establish baseline metrics

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Nuxt Testing Documentation](https://nuxt.com/docs/getting-started/testing)
- [Supabase Testing Best Practices](https://supabase.com/docs/guides/testing)
