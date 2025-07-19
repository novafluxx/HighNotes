import { vi } from 'vitest'
import '@testing-library/jest-dom'
import { ref } from 'vue'

// Mocks are handled by vi.mock() calls below - no global declarations needed

// Mock Nuxt runtime
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(),
  navigateTo: vi.fn(),
  useRouter: vi.fn(),
  useRoute: vi.fn(),
  useState: vi.fn((key, init) => {
    const state = ref(typeof init === 'function' ? init() : init)
    return state
  }),
  useCookie: vi.fn(),
  useRuntimeConfig: () => ({
    public: {
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'test-key'
    }
  })
}))

// Mock Supabase
vi.mock('@nuxtjs/supabase', () => ({
  useSupabaseClient: vi.fn(),
  useSupabaseUser: vi.fn(),
  useSupabaseSession: vi.fn()
}))

// Note: Global mocks are handled by vi.mock() calls above
// No need to manually assign to global since Nuxt auto-imports handle this

// Mock environment variables
process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_KEY = 'test-key'