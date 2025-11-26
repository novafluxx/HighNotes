# High Notes Testing Quick Start

✅ **Status: 52 unit tests passing!**

## Setup

```bash
# Install dependencies (includes testing tools)
pnpm install

# Install Playwright browsers (first time only, for E2E tests)
pnpm exec playwright install --with-deps
```

## Running Tests

### Unit Tests (Fast - Run Frequently)
```bash
# Run all unit tests
pnpm test:unit

# Watch mode (re-run on file changes)
pnpm test:unit:watch

# With coverage report
pnpm test:unit:coverage
```

### E2E Tests (Slower - Run Before Commits)
```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI (best for debugging)
pnpm test:e2e:ui

# Run in headed mode (watch browser)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug
```

### Security Tests
```bash
# Run security tests
pnpm test:security
```

### All Tests
```bash
# Run everything
pnpm test
```

## Test Structure

```
tests/
├── unit/                   # Fast isolated tests ✅ WORKING
│   ├── offline-logic.test.ts   - Queue, cache, ID replacement (15 tests)
│   └── sync-logic.test.ts      - Dirty tracking, validation (18 tests)
├── e2e/                    # Full browser tests (Playwright)
│   ├── note-crud.spec.ts       - Complete user flows
│   └── offline-mode.spec.ts    - Network emulation
├── security/               # Security validation ✅ WORKING
│   └── validation.test.ts      - Input validation, XSS detection (19 tests)
├── setup.ts               # Global test setup
└── __mocks__/             # Mock implementations
    └── supabase.ts
```

**Total: 52 passing tests** (3 unit test files)

## What to Test

### Before Every Commit
- ✅ Unit tests: `pnpm test:unit`
- ✅ Security tests: `pnpm test:security`

### Before Every PR
- ✅ All tests: `pnpm test`
- ✅ Coverage check: `pnpm test:unit:coverage`

### When Touching Offline Logic
- ✅ `tests/unit/useOfflineNotes.test.ts`
- ✅ `tests/e2e/offline-mode.spec.ts`

### When Touching CRUD Operations
- ✅ `tests/unit/useNotes.test.ts`
- ✅ `tests/e2e/note-crud.spec.ts`

### When Touching Edge Functions
- ✅ `tests/security/edge-function-security.test.ts`

## Critical Test Cases

### 1. Queue FIFO Ordering ✅
**File:** `tests/unit/offline-logic.test.ts:8`
```typescript
it('should maintain FIFO order based on timestamps', () => {
  // Verifies queue sorts by timestamp
})
```

### 2. ID Replacement Logic ✅
**File:** `tests/unit/offline-logic.test.ts:61`
```typescript
it('should map local IDs to server IDs', () => {
  // Verify local-123 → server-456 mapping
})
```

### 3. Dirty State Tracking ✅
**File:** `tests/unit/sync-logic.test.ts:9`
```typescript
it('should detect changes to title', () => {
  // Verifies dirty tracking logic
})
```

### 4. Input Validation ✅
**File:** `tests/security/validation.test.ts:40`
```typescript
it('should accept valid note', () => {
  // Validates note structure and constraints
})
```

### 5. XSS Detection ✅
**File:** `tests/security/validation.test.ts:94`
```typescript
it('should detect script tags', () => {
  // Detects malicious patterns
})
```

## Debugging Tests

### Unit Test Failures
```bash
# Run single test file
pnpm test:unit tests/unit/useOfflineNotes.test.ts

# Run specific test by name
pnpm test:unit -t "should enqueue operations"
```

### E2E Test Failures
```bash
# Use Playwright UI (best option)
pnpm test:e2e:ui

# Or debug mode (step through)
pnpm test:e2e:debug

# View last test report
pnpm exec playwright show-report
```

### Common Issues

**IndexedDB not resetting between tests**
```typescript
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
```

**Playwright timeout**
```typescript
// Increase timeout for slow operations
test('slow test', async ({ page }) => {
  test.setTimeout(30000) // 30 seconds
})
```

**Flaky tests**
```typescript
// Use waitForSelector instead of waitForTimeout
await page.waitForSelector('[data-testid="note-item"]')
```

## Coverage Reports

After running `pnpm test:unit:coverage`:
- Open `coverage/index.html` in browser
- Target: 70% minimum, 80% ideal
- Focus on critical paths first

## Next Steps

1. Install dependencies: `pnpm install`
2. Run unit tests: `pnpm test:unit`
3. Install Playwright: `pnpm exec playwright install`
4. Run E2E tests: `pnpm test:e2e`
5. Check coverage: `pnpm test:unit:coverage`

For detailed documentation, see [../TESTING.md](../TESTING.md)
