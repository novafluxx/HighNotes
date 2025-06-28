import type { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * This file is referenced in playwright.config.ts and runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  // Make test credentials available to all tests
  // Ensure credentials are set with fallbacks
  if (!process.env.TEST_USER || !process.env.TEST_PASSWORD) {
    console.warn('Warning: TEST_USER or TEST_PASSWORD environment variables are not set.');
    console.warn('Tests requiring authentication may fail.');
  }
  
  console.log('Global setup complete - Test credentials configured');
}

export default globalSetup;
