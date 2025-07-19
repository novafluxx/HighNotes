import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Enhanced Playwright configuration for Nuxt 3 application testing
 * Includes comprehensive test environment setup, enhanced reporting,
 * and optimized settings for both local development and CI environments.
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Test organization */
  fullyParallel: !process.env.CI, // Parallel locally, sequential in CI for stability
  forbidOnly: !!process.env.CI,
  
  /* Retry configuration */
  retries: process.env.CI ? 3 : 1, // More retries in CI for flaky network conditions
  
  /* Worker configuration */
  workers: process.env.CI ? 2 : undefined, // Limit workers in CI to avoid resource contention
  
  /* Enhanced reporting */
  reporter: [
    ['html', { 
      open: process.env.CI ? 'never' : 'on-failure',
      outputFolder: 'playwright-report'
    }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['line'], // Console output for better CI visibility
    ...(process.env.CI ? [['github'] as const] : []) // GitHub Actions integration
  ],
  
  /* Timeout configuration */
  timeout: process.env.CI ? 60000 : 30000, // Longer timeout in CI
  expect: {
    timeout: 15000 // Increased for database operations
  },
  
  /* Output directories */
  outputDir: 'test-results',
  
  /* Enhanced test settings */
  use: {
    /* Base URL configuration */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Enhanced tracing and debugging */
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    
    /* Screenshot configuration */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    
    /* Video recording */
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },
    
    /* Network and security */
    ignoreHTTPSErrors: true,
    
    /* Browser context options */
    viewport: { width: 1280, height: 720 },
    
    /* Action timeouts */
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    /* Locale and timezone */
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    /* Additional context options for testing */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  },
  
  /* Global setup and teardown */
  globalSetup: path.resolve(__dirname, './tests/e2e/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, './tests/e2e/global-teardown.ts'),

  /* Enhanced browser projects */
  projects: [
    /* Desktop browsers */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enhanced Chrome settings for testing
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox'
          ]
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'dom.push.enabled': false
          }
        }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Safari-specific settings for PWA testing
      },
    },

    /* Mobile viewports for responsive testing */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 7'],
        // Mobile-specific settings
        hasTouch: true,
        isMobile: true
      },
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 15 Plus'],
        // iOS-specific settings
        hasTouch: true,
        isMobile: true
      },
    },

    /* Tablet viewport for medium screen testing */
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro 11'],
        hasTouch: true
      }
    }
  ],

  /* Enhanced web server configuration */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes for Nuxt startup
    env: {
      NODE_ENV: 'test',
      NUXT_TELEMETRY_DISABLED: '1'
    }
  },
});
