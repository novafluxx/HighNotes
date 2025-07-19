import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the createClient function from Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}))

// Mock Nuxt runtime config
vi.mock('#app', () => ({
  useRuntimeConfig: vi.fn()
}))

import { useSupabase, _resetSupabaseInstance } from '~/composables/useSupabase'
import { createClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#app'

describe('useSupabase', () => {
  let mockSupabaseClient: any
  let mockCreateClient: any
  let mockUseRuntimeConfig: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Reset the singleton instance
    _resetSupabaseInstance()

    // Get the mocked functions
    mockCreateClient = vi.mocked(createClient)
    mockUseRuntimeConfig = vi.mocked(useRuntimeConfig)

    // Create fresh mocks for each test
    mockSupabaseClient = {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn()
      },
      from: vi.fn()
    }

    // Setup default mock implementations
    mockCreateClient.mockReturnValue(mockSupabaseClient)
    mockUseRuntimeConfig.mockReturnValue({
      public: {
        supabaseUrl: 'http://localhost:54321',
        supabaseKey: 'test-anon-key'
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('client initialization', () => {
    it('should create Supabase client with correct configuration', () => {
      // Act
      const client = useSupabase()

      // Assert
      expect(mockUseRuntimeConfig).toHaveBeenCalled()
      expect(mockCreateClient).toHaveBeenCalledWith(
        'http://localhost:54321',
        'test-anon-key'
      )
      expect(client).toBe(mockSupabaseClient)
    })

    it('should return the same client instance on subsequent calls (singleton)', () => {
      // Act
      const client1 = useSupabase()
      const client2 = useSupabase()

      // Assert
      expect(client1).toBe(client2)
      expect(mockCreateClient).toHaveBeenCalledTimes(1)
    })

    it('should throw error when Supabase URL is missing', () => {
      // Arrange
      mockUseRuntimeConfig.mockReturnValue({
        public: {
          supabaseUrl: undefined,
          supabaseKey: 'test-anon-key'
        }
      })

      // Act & Assert
      expect(() => useSupabase()).toThrow('Supabase URL or Key is missing in runtime config.')
    })

    it('should throw error when Supabase Key is missing', () => {
      // Arrange
      mockUseRuntimeConfig.mockReturnValue({
        public: {
          supabaseUrl: 'http://localhost:54321',
          supabaseKey: undefined
        }
      })

      // Act & Assert
      expect(() => useSupabase()).toThrow('Supabase URL or Key is missing in runtime config.')
    })

    it('should throw error when both URL and Key are missing', () => {
      // Arrange
      mockUseRuntimeConfig.mockReturnValue({
        public: {
          supabaseUrl: undefined,
          supabaseKey: undefined
        }
      })

      // Act & Assert
      expect(() => useSupabase()).toThrow('Supabase URL or Key is missing in runtime config.')
    })

    it('should handle empty string values as missing', () => {
      // Arrange
      mockUseRuntimeConfig.mockReturnValue({
        public: {
          supabaseUrl: '',
          supabaseKey: 'test-anon-key'
        }
      })

      // Act & Assert
      expect(() => useSupabase()).toThrow('Supabase URL or Key is missing in runtime config.')
    })
  })

  describe('configuration handling', () => {
    it('should work with different environment configurations', () => {
      // Arrange
      const prodConfig = {
        public: {
          supabaseUrl: 'https://myproject.supabase.co',
          supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
      mockUseRuntimeConfig.mockReturnValue(prodConfig)

      // Act
      const client = useSupabase()

      // Assert
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://myproject.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      )
      expect(client).toBe(mockSupabaseClient)
    })

    it('should handle runtime config with nested structure', () => {
      // Arrange
      const nestedConfig = {
        public: {
          supabaseUrl: 'http://localhost:54321',
          supabaseKey: 'test-key',
          otherConfig: {
            nested: 'value'
          }
        },
        private: {
          secret: 'value'
        }
      }
      mockUseRuntimeConfig.mockReturnValue(nestedConfig)

      // Act
      const client = useSupabase()

      // Assert
      expect(mockCreateClient).toHaveBeenCalledWith(
        'http://localhost:54321',
        'test-key'
      )
      expect(client).toBe(mockSupabaseClient)
    })
  })

  describe('error scenarios', () => {
    it('should handle createClient throwing an error', () => {
      // Arrange
      const createClientError = new Error('Failed to create Supabase client')
      mockCreateClient.mockImplementation(() => {
        throw createClientError
      })

      // Act & Assert
      expect(() => useSupabase()).toThrow('Failed to create Supabase client')
    })

    it('should handle useRuntimeConfig throwing an error', () => {
      // Arrange
      const runtimeConfigError = new Error('Runtime config not available')
      mockUseRuntimeConfig.mockImplementation(() => {
        throw runtimeConfigError
      })

      // Act & Assert
      expect(() => useSupabase()).toThrow('Runtime config not available')
    })

    it('should handle malformed runtime config', () => {
      // Arrange
      mockUseRuntimeConfig.mockReturnValue({
        // Missing public property
        private: {
          secret: 'value'
        }
      })

      // Act & Assert
      expect(() => useSupabase()).toThrow('Supabase URL or Key is missing in runtime config.')
    })

    it('should handle null runtime config', () => {
      // Arrange
      mockUseRuntimeConfig.mockReturnValue(null)

      // Act & Assert
      expect(() => useSupabase()).toThrow()
    })
  })

  describe('client functionality', () => {
    it('should return a client with expected methods', () => {
      // Act
      const client = useSupabase()

      // Assert
      expect(client).toHaveProperty('auth')
      expect(client).toHaveProperty('from')
      expect(typeof client.auth.signUp).toBe('function')
      expect(typeof client.auth.signInWithPassword).toBe('function')
      expect(typeof client.auth.signOut).toBe('function')
      expect(typeof client.from).toBe('function')
    })

    it('should maintain client state across calls', () => {
      // Act
      const client1 = useSupabase()
      const client2 = useSupabase()

        // Modify client1 to test if it affects client2
        ; (client1 as any).testProperty = 'test-value'

      // Assert
      expect((client2 as any).testProperty).toBe('test-value')
      expect(client1).toBe(client2)
    })
  })

  describe('integration scenarios', () => {
    it('should work with typical Nuxt runtime config structure', () => {
      // Arrange - simulate typical Nuxt config
      const typicalConfig = {
        public: {
          supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
          supabaseKey: process.env.SUPABASE_ANON_KEY || 'test-key'
        }
      }
      mockUseRuntimeConfig.mockReturnValue(typicalConfig)

      // Act
      const client = useSupabase()

      // Assert
      expect(client).toBeDefined()
      expect(mockCreateClient).toHaveBeenCalledWith(
        'http://localhost:54321',
        'test-key'
      )
    })

    it('should handle environment variable substitution', () => {
      // Arrange
      const originalEnv = process.env.SUPABASE_URL
      process.env.SUPABASE_URL = 'https://env-test.supabase.co'

      mockUseRuntimeConfig.mockReturnValue({
        public: {
          supabaseUrl: process.env.SUPABASE_URL,
          supabaseKey: 'env-test-key'
        }
      })

      // Act
      const client = useSupabase()

      // Assert
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://env-test.supabase.co',
        'env-test-key'
      )

      // Cleanup
      process.env.SUPABASE_URL = originalEnv
    })
  })
})