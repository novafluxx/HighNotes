/**
 * Enhanced test configuration for Playwright E2E tests
 * This file contains configuration constants and utilities for test setup
 */

export const TEST_CONFIG = {
  // Timeouts
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    navigation: 30000,
    database: 15000
  },

  // Test data limits
  dataLimits: {
    basicNotes: 5,
    searchableNotes: 10,
    performanceNotes: 200,
    batchSize: 50
  },

  // Browser configurations
  browsers: {
    desktop: ['chromium', 'firefox', 'webkit'],
    mobile: ['Mobile Chrome', 'Mobile Safari'],
    tablet: ['iPad']
  },

  // Test environment URLs
  urls: {
    base: process.env.BASE_URL || 'http://localhost:3000',
    login: '/login',
    signup: '/signup',
    notes: '/notes',
    reset: '/reset',
    confirm: '/confirm'
  },

  // Test selectors (centralized for maintainability)
  selectors: {
    // Authentication
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    loginButton: '[data-testid="login-button"]',
    signupButton: '[data-testid="signup-button"]',
    logoutButton: '[data-testid="logout-button"]',
    userMenuButton: '[data-testid="user-menu-button"]',

    // Notes
    notesContainer: '[data-testid="notes-container"]',
    createNoteButton: '[data-testid="create-note-button"]',
    noteItem: '[data-testid="note-item"]',
    noteItemTitle: '[data-testid="note-item-title"]',
    noteItemContent: '[data-testid="note-item-content"]',
    noteTitleInput: '[data-testid="note-title-input"]',
    noteContentInput: '[data-testid="note-content-input"]',
    saveNoteButton: '[data-testid="save-note-button"]',
    deleteNoteButton: '[data-testid="delete-note-button"]',
    editNoteButton: '[data-testid="edit-note-button"]',

    // Search and filtering
    searchInput: '[data-testid="search-input"]',
    searchResults: '[data-testid="search-results"]',
    clearSearchButton: '[data-testid="clear-search-button"]',

    // UI elements
    loadingSpinner: '[data-testid="loading-spinner"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',
    confirmDialog: '[data-testid="confirm-dialog"]',
    confirmYesButton: '[data-testid="confirm-yes-button"]',
    confirmNoButton: '[data-testid="confirm-no-button"]'
  },

  // Test user credentials
  testUser: {
    email: process.env.TEST_USER || 'test@example.com',
    password: process.env.TEST_PASSWORD || 'Test1234!',
    displayName: 'Test User'
  },

  // Database configuration
  database: {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_KEY!,
    maxRetries: 3,
    retryDelay: 1000
  },

  // Screenshot and video settings
  media: {
    screenshotPath: 'test-results/screenshots',
    videoPath: 'test-results/videos',
    tracePath: 'test-results/traces'
  },

  // Performance thresholds
  performance: {
    pageLoadTime: 5000,
    searchResponseTime: 2000,
    noteCreationTime: 3000,
    databaseOperationTime: 5000
  }
} as const;

export type TestConfig = typeof TEST_CONFIG;

/**
 * Validate test environment configuration
 */
export function validateTestConfig(): void {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'TEST_USER',
    'TEST_PASSWORD'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for testing: ${missingVars.join(', ')}\n` +
      'Please ensure your .env file contains all required test configuration.'
    );
  }
}

/**
 * Get selector with optional fallback
 */
export function getSelector(key: keyof typeof TEST_CONFIG.selectors, fallback?: string): string {
  return TEST_CONFIG.selectors[key] || fallback || `[data-testid="${key}"]`;
}

/**
 * Get timeout value with optional multiplier for CI environments
 */
export function getTimeout(key: keyof typeof TEST_CONFIG.timeouts, multiplier: number = 1): number {
  const baseTimeout = TEST_CONFIG.timeouts[key];
  const ciMultiplier = process.env.CI ? 2 : 1; // Double timeouts in CI
  return baseTimeout * multiplier * ciMultiplier;
}

/**
 * Get test data limit with optional override
 */
export function getDataLimit(key: keyof typeof TEST_CONFIG.dataLimits, override?: number): number {
  return override ?? TEST_CONFIG.dataLimits[key];
}