import { test as base, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

// Extend the base test with our custom fixtures
export const test = base.extend<{
  testHelpers: TestHelpers;
  authenticatedPage: any;
}>({
  // Test helpers fixture
  testHelpers: async ({}, use) => {
    const helpers = new TestHelpers();
    await use(helpers);
  },

  // Authenticated page fixture - automatically logs in the test user
  authenticatedPage: async ({ page, testHelpers }, use) => {
    await testHelpers.loginTestUser(page);
    await use(page);
    // Cleanup after test
    await testHelpers.logout(page);
  },
});

export { expect } from '@playwright/test';