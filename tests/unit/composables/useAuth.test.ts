import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { 
  createMockSupabaseClient, 
  createMockAuthError,
  createMockUser,
  createMockSession,
  type SupabaseTestOptions 
} from '../../utils/supabase-test-utils'
import { testUsers, testSessions } from '../../fixtures/users'

// Mock the composables at the module level
vi.mock('#app', () => ({
  useRouter: vi.fn()
}))

vi.mock('@nuxtjs/supabase', () => ({
  useSupabaseClient: vi.fn(),
  useSupabaseUser: vi.fn(),
  useSupabaseSession: vi.fn()
}))

// Import the mocked functions after mocking
import { useRouter } from '#app'
import { useSupabaseClient, useSupabaseUser, useSupabaseSession } from '@nuxtjs/supabase'

describe('useAuth', () => {
  let mockRouter: any
  let mockSupabaseClient: any
  let mockSupabaseUser: any
  let mockSupabaseSession: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Create fresh mocks for each test
    mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    }
    
    mockSupabaseClient = createMockSupabaseClient()
    mockSupabaseUser = ref(null)
    mockSupabaseSession = ref(null)
    
    // Setup mock implementations
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useSupabaseClient).mockReturnValue(mockSupabaseClient)
    vi.mocked(useSupabaseUser).mockReturnValue(mockSupabaseUser)
    vi.mocked(useSupabaseSession).mockReturnValue(mockSupabaseSession)
    
    // Also set up global mocks
    global.useSupabaseClient.mockReturnValue(mockSupabaseClient)
    global.useSupabaseUser.mockReturnValue(mockSupabaseUser)
    global.useSupabaseSession.mockReturnValue(mockSupabaseSession)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with loading state false', () => {
      const { loading } = useAuth()
      
      expect(loading.value).toBe(false)
    })

    it('should provide login and logout methods', () => {
      const { login, logout } = useAuth()
      
      expect(typeof login).toBe('function')
      expect(typeof logout).toBe('function')
    })
  })

  describe('login function', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'validPassword123'
      const mockUser = createMockUser({ email })
      const mockSession = createMockSession(mockUser)
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      const { login, loading } = useAuth()
      
      // Act
      const result = await login(email, password)
      
      // Assert
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password
      })
      expect(result.error).toBeNull()
      expect(loading.value).toBe(false)
    })

    it('should handle login errors gracefully', async () => {
      // Arrange
      const email = 'invalid@example.com'
      const password = 'wrongPassword'
      const authError = createMockAuthError('Invalid login credentials')
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })
      
      const { login, loading } = useAuth()
      
      // Act
      const result = await login(email, password)
      
      // Assert
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password
      })
      expect(result.error).toEqual(authError)
      expect(loading.value).toBe(false)
    })

    it('should set loading state during login process', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'password123'
      let loadingDuringCall = false
      
      mockSupabaseClient.auth.signInWithPassword.mockImplementation(async () => {
        // Capture loading state during the async call
        loadingDuringCall = loading.value
        return {
          data: { user: createMockUser({ email }), session: null },
          error: null
        }
      })
      
      const { login, loading } = useAuth()
      
      // Act
      expect(loading.value).toBe(false) // Initially false
      const loginPromise = login(email, password)
      expect(loading.value).toBe(true) // Should be true during call
      
      await loginPromise
      
      // Assert
      expect(loadingDuringCall).toBe(true)
      expect(loading.value).toBe(false) // Should be false after completion
    })

    it('should handle network errors during login', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'password123'
      const networkError = new Error('Network error')
      
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(networkError)
      
      const { login } = useAuth()
      
      // Act & Assert
      await expect(login(email, password)).rejects.toThrow('Network error')
    })

    it('should handle empty credentials', async () => {
      // Arrange
      const authError = createMockAuthError('Email and password are required')
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })
      
      const { login } = useAuth()
      
      // Act
      const result = await login('', '')
      
      // Assert
      expect(result.error).toEqual(authError)
    })
  })

  describe('logout function', () => {
    it('should successfully logout user', async () => {
      // Arrange
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })
      
      const { logout, loading } = useAuth()
      
      // Act
      await logout()
      
      // Assert
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/')
      expect(loading.value).toBe(false)
    })

    it('should handle logout errors', async () => {
      // Arrange
      const authError = createMockAuthError('Logout failed')
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: authError })
      
      // Spy on console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const { logout } = useAuth()
      
      // Act
      await logout()
      
      // Assert
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled() // Should not redirect on error
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', authError)
      
      consoleSpy.mockRestore()
    })

    it('should set loading state during logout process', async () => {
      // Arrange
      let loadingDuringCall = false
      
      mockSupabaseClient.auth.signOut.mockImplementation(async () => {
        loadingDuringCall = loading.value
        return { error: null }
      })
      
      const { logout, loading } = useAuth()
      
      // Act
      expect(loading.value).toBe(false) // Initially false
      const logoutPromise = logout()
      expect(loading.value).toBe(true) // Should be true during call
      
      await logoutPromise
      
      // Assert
      expect(loadingDuringCall).toBe(true)
      expect(loading.value).toBe(false) // Should be false after completion
    })

    it('should handle network errors during logout', async () => {
      // Arrange
      const networkError = new Error('Network error')
      mockSupabaseClient.auth.signOut.mockRejectedValue(networkError)
      
      const { logout } = useAuth()
      
      // Act & Assert
      await expect(logout()).rejects.toThrow('Network error')
    })
  })

  describe('loading state management', () => {
    it('should maintain separate loading states for login and logout', async () => {
      // Arrange
      const { login, logout, loading } = useAuth()
      
      // Mock delayed responses
      mockSupabaseClient.auth.signInWithPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { user: null, session: null }, error: null }), 100))
      )
      mockSupabaseClient.auth.signOut.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )
      
      // Act & Assert
      expect(loading.value).toBe(false)
      
      // Start login
      const loginPromise = login('test@example.com', 'password')
      expect(loading.value).toBe(true)
      
      await loginPromise
      expect(loading.value).toBe(false)
      
      // Start logout
      const logoutPromise = logout()
      expect(loading.value).toBe(true)
      
      await logoutPromise
      expect(loading.value).toBe(false)
    })

    it('should reset loading state even if operations fail', async () => {
      // Arrange
      const authError = createMockAuthError('Operation failed')
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })
      
      const { login, loading } = useAuth()
      
      // Act
      await login('test@example.com', 'password')
      
      // Assert
      expect(loading.value).toBe(false)
    })
  })

  describe('authentication state integration', () => {
    it('should work with authenticated user state', async () => {
      // Arrange
      const mockUser = testUsers.authenticatedUser
      const mockSession = testSessions.authenticatedSession
      
      mockSupabaseUser.value = mockUser
      mockSupabaseSession.value = mockSession
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      const { login } = useAuth()
      
      // Act
      const result = await login(mockUser.email, 'password123')
      
      // Assert
      expect(result.error).toBeNull()
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockUser.email,
        password: 'password123'
      })
    })

    it('should handle user state changes during authentication', async () => {
      // Arrange
      const mockUser = testUsers.newUser
      
      // Simulate user state change after login
      mockSupabaseClient.auth.signInWithPassword.mockImplementation(async () => {
        // Simulate the user state being updated by Supabase
        mockSupabaseUser.value = mockUser
        mockSupabaseSession.value = createMockSession(mockUser)
        
        return {
          data: { user: mockUser, session: createMockSession(mockUser) },
          error: null
        }
      })
      
      const { login } = useAuth()
      
      // Act
      const result = await login(mockUser.email, 'password123')
      
      // Assert
      expect(result.error).toBeNull()
      expect(mockSupabaseUser.value).toEqual(mockUser)
    })
  })

  describe('error handling edge cases', () => {
    it('should handle malformed auth responses', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null, // Malformed response
        error: null
      })
      
      const { login } = useAuth()
      
      // Act
      const result = await login('test@example.com', 'password')
      
      // Assert
      expect(result.error).toBeNull() // Should handle gracefully
    })

    it('should handle undefined error responses', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: undefined
      })
      
      const { login } = useAuth()
      
      // Act
      const result = await login('test@example.com', 'password')
      
      // Assert
      expect(result.error).toBeUndefined()
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent login attempts', async () => {
      // Arrange
      const mockUser = createMockUser({ email: 'test@example.com' })
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: createMockSession(mockUser) },
        error: null
      })
      
      const { login } = useAuth()
      
      // Act
      const [result1, result2] = await Promise.all([
        login('test@example.com', 'password1'),
        login('test@example.com', 'password2')
      ])
      
      // Assert
      expect(result1.error).toBeNull()
      expect(result2.error).toBeNull()
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledTimes(2)
    })

    it('should handle login followed by immediate logout', async () => {
      // Arrange
      const mockUser = createMockUser({ email: 'test@example.com' })
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: createMockSession(mockUser) },
        error: null
      })
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })
      
      const { login, logout } = useAuth()
      
      // Act
      const loginResult = await login('test@example.com', 'password')
      await logout()
      
      // Assert
      expect(loginResult.error).toBeNull()
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled()
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })
  })
})