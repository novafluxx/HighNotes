import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Exclude E2E tests - they run with Playwright
    include: ['tests/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.ts',  // Playwright E2E tests
      '**/e2e/**'      // Exclude entire e2e folder
    ],
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'app/composables/**/*.ts'
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**',
        '**/__mocks__/**',
        '**/e2e/**'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70
      }
    },
    globals: true,
    testTimeout: 10000
  }
})