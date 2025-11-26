import { beforeAll, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

// Mock environment variables for tests
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test-anon-key'
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key'

// Setup global test environment
beforeAll(() => {
  // Mock window.matchMedia (used by Nuxt UI)
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true
      })
    })

    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      takeRecords() {
        return []
      }
      unobserve() {}
    } as any

    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true
    })
  }
})

afterEach(() => {
  vi.clearAllMocks()
})
