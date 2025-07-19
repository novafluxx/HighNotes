import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createSupabaseTestEnvironment,
  createMockAuthError,
  type SupabaseTestOptions
} from '../../utils/supabase-test-utils'
import { testUsers, testSessions, userScenarios } from '../../fixtures/users'
import type { AuthError } from '@supabase/supabase-js'

describe('Supabase Authentication Integration', () => {
  let testEnv: ReturnType<typeof createSupabaseTestEnvironment>

  beforeEach(() => {
    // Create a fresh test environment for each test
    testEnv = createSupabaseTestEnvironment()
  })

  afterEach(() => {
    testEnv.cleanup()
    vi.clearAllMocks()
  })

  describe('User Registration', () => {
    it('should successfully register a new user with valid credentials', async () => {
      // Arrange
      const { email, password } = userScenarios.authentication.validCredentials

      // Act
      const result = await testEnv.client.auth.signUp({
        email,
        password
      })

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.user).toBeDefined()
      expect(result.data.user?.email).toBe(email)
      expect(result.data.session).toBeDefined()
      expect(testEnv.client.auth.signUp).toHaveBeenCalledWith({
        email,
        password
      })
    })

    it('should handle registration with additional user metadata', async () => {
      // Arrange
      const { email, password } = userScenarios.authentication.validCredentials
      const userData = {
        full_name: 'Test User',
        age: 25
      }

      // Act
      const result = await testEnv.client.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.user).toBeDefined()
      expect(result.data.user?.email).toBe(email)
      expect(testEnv.client.auth.signUp).toHaveBeenCalledWith({
        email,
        password,
        options: {
          data: userData
        }
      })
    })

    it('should handle registration errors for invalid email', async () => {
      // Arrange
      const authError = createMockAuthError('Invalid email format', 422)
      testEnv = createSupabaseTestEnvironment({ authError })
      const { email, password } = userScenarios.authentication.invalidEmail

      // Act
      const result = await testEnv.client.auth.signUp({
        email,
        password
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Invalid email format')
      expect(result.error?.status).toBe(422)
      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
    })

    it('should handle registration errors for weak password', async () => {
      // Arrange
      const authError = createMockAuthError('Password should be at least 6 characters', 422)
      testEnv = createSupabaseTestEnvironment({ authError })
      const { email, password } = userScenarios.authentication.weakPassword

      // Act
      const result = await testEnv.client.auth.signUp({
        email,
        password
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Password should be at least 6 characters')
      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
    })

    it('should handle registration errors for existing user', async () => {
      // Arrange
      const authError = createMockAuthError('User already registered', 422)
      testEnv = createSupabaseTestEnvironment({ authError })
      const existingUser = testUsers.authenticatedUser

      // Act
      const result = await testEnv.client.auth.signUp({
        email: existingUser.email,
        password: 'somePassword123!'
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('User already registered')
      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
    })
  })

  describe('Email Confirmation Flow', () => {
    it('should handle email confirmation process', async () => {
      // Arrange - Create test environment that returns unconfirmed user for signUp
      const unconfirmedUser = userScenarios.registration.unconfirmedUser

      // Create a custom mock that returns unconfirmed user for signUp
      const customTestEnv = createSupabaseTestEnvironment()
      customTestEnv.client.auth.signUp = vi.fn().mockResolvedValue({
        data: {
          user: unconfirmedUser,
          session: null
        },
        error: null
      })

      // Act - First, register user (would normally send confirmation email)
      const signUpResult = await customTestEnv.client.auth.signUp({
        email: unconfirmedUser.email,
        password: 'testPassword123!'
      })

      // Assert registration
      expect(signUpResult.error).toBeNull()
      expect(signUpResult.data.user?.email_confirmed_at).toBeUndefined()

      // Act - Simulate email confirmation (in real app, this would be handled by Supabase)
      const confirmedUser = {
        ...unconfirmedUser,
        email_confirmed_at: new Date().toISOString()
      }
      testEnv = createSupabaseTestEnvironment({
        user: confirmedUser,
        session: testSessions.authenticatedSession
      })

      const sessionResult = await testEnv.client.auth.getSession()

      // Assert confirmation
      expect(sessionResult.error).toBeNull()
      expect(sessionResult.data.session).toBeDefined()
      expect(sessionResult.data.session?.user.email_confirmed_at).toBeDefined()
    })

    it('should prevent login for unconfirmed users', async () => {
      // Arrange
      const authError = createMockAuthError('Email not confirmed', 400)
      testEnv = createSupabaseTestEnvironment({ authError })
      const unconfirmedUser = userScenarios.registration.unconfirmedUser

      // Act
      const result = await testEnv.client.auth.signInWithPassword({
        email: unconfirmedUser.email,
        password: 'testPassword123!'
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Email not confirmed')
      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
    })
  })

  describe('User Authentication', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      // Arrange
      const user = testUsers.authenticatedUser
      const { email, password } = userScenarios.authentication.validCredentials
      testEnv = createSupabaseTestEnvironment({
        user,
        session: testSessions.authenticatedSession
      })

      // Act
      const result = await testEnv.client.auth.signInWithPassword({
        email,
        password
      })

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.user).toBeDefined()
      expect(result.data.user?.email).toBe(email)
      expect(result.data.session).toBeDefined()
      expect(result.data.session?.access_token).toBeDefined()
      expect(result.data.session?.refresh_token).toBeDefined()
    })

    it('should handle authentication errors for invalid credentials', async () => {
      // Arrange
      const authError = createMockAuthError('Invalid login credentials', 400)
      testEnv = createSupabaseTestEnvironment({ authError })
      const { email, password } = userScenarios.authentication.invalidCredentials

      // Act
      const result = await testEnv.client.auth.signInWithPassword({
        email,
        password
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Invalid login credentials')
      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
    })

    it('should handle authentication errors for non-existent user', async () => {
      // Arrange
      const authError = createMockAuthError('Invalid login credentials', 400)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.signInWithPassword({
        email: 'nonexistent@example.com',
        password: 'anyPassword123!'
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Invalid login credentials')
      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
    })

    it('should handle rate limiting errors', async () => {
      // Arrange
      const authError = createMockAuthError('Too many requests', 429)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123!'
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Too many requests')
      expect(result.error?.status).toBe(429)
    })
  })

  describe('Password Reset Functionality', () => {
    it('should successfully initiate password reset for existing user', async () => {
      // Arrange
      const existingUser = testUsers.authenticatedUser

      // Act
      const result = await testEnv.client.auth.resetPasswordForEmail(
        existingUser.email,
        {
          redirectTo: 'http://localhost:3000/reset'
        }
      )

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(testEnv.client.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        existingUser.email,
        {
          redirectTo: 'http://localhost:3000/reset'
        }
      )
    })

    it('should handle password reset for non-existent user gracefully', async () => {
      // Arrange - Supabase typically doesn't reveal if email exists for security
      const nonExistentEmail = userScenarios.passwordReset.nonExistentUser.email

      // Act
      const result = await testEnv.client.auth.resetPasswordForEmail(nonExistentEmail)

      // Assert - Should succeed even for non-existent users (security best practice)
      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
    })

    it('should handle password reset errors', async () => {
      // Arrange
      const authError = createMockAuthError('Rate limit exceeded', 429)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.resetPasswordForEmail('test@example.com')

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Rate limit exceeded')
    })
  })

  describe('Password Update Functionality', () => {
    it('should successfully update user password when authenticated', async () => {
      // Arrange
      const user = testUsers.authenticatedUser
      testEnv = createSupabaseTestEnvironment({
        user,
        session: testSessions.authenticatedSession
      })
      const newPassword = 'newSecurePassword123!'

      // Act
      const result = await testEnv.client.auth.updateUser({
        password: newPassword
      })

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.user).toBeDefined()
      expect(testEnv.client.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword
      })
    })

    it('should handle password update errors for unauthenticated user', async () => {
      // Arrange
      const authError = createMockAuthError('Not authenticated', 401)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.updateUser({
        password: 'newPassword123!'
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Not authenticated')
      expect(result.error?.status).toBe(401)
    })

    it('should handle password update with weak password', async () => {
      // Arrange
      const authError = createMockAuthError('Password should be at least 6 characters', 422)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.updateUser({
        password: '123'
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Password should be at least 6 characters')
    })
  })

  describe('Session Management', () => {
    it('should retrieve current session when user is authenticated', async () => {
      // Arrange
      const user = testUsers.authenticatedUser
      const session = testSessions.authenticatedSession
      testEnv = createSupabaseTestEnvironment({ user, session })

      // Act
      const result = await testEnv.client.auth.getSession()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.session).toBeDefined()
      expect(result.data.session?.user.id).toBe(user.id)
      expect(result.data.session?.access_token).toBeDefined()
      expect(result.data.session?.refresh_token).toBeDefined()
    })

    it('should return null session when user is not authenticated', async () => {
      // Arrange
      testEnv = createSupabaseTestEnvironment({ user: null, session: null })

      // Act
      const result = await testEnv.client.auth.getSession()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.session).toBeNull()
    })

    it('should retrieve current user when authenticated', async () => {
      // Arrange
      const user = testUsers.authenticatedUser
      testEnv = createSupabaseTestEnvironment({ user })

      // Act
      const result = await testEnv.client.auth.getUser()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.user).toBeDefined()
      expect(result.data.user?.id).toBe(user.id)
      expect(result.data.user?.email).toBe(user.email)
    })

    it('should handle session errors', async () => {
      // Arrange
      const authError = createMockAuthError('Session expired', 401)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.getSession()

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Session expired')
      expect(result.data.session).toBeNull()
    })
  })

  describe('Token Refresh', () => {
    it('should handle token refresh successfully', async () => {
      // Arrange
      const user = testUsers.authenticatedUser
      const session = testSessions.authenticatedSession
      testEnv = createSupabaseTestEnvironment({ user, session })

      // Simulate token refresh by updating auth manager
      const newSession = testEnv.authManager.refreshToken()

      // Act
      const result = await testEnv.client.auth.getSession()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data.session).toBeDefined()
      expect(newSession).toBeDefined()
      expect(newSession?.access_token).toBe('new-mock-access-token')
    })

    it('should handle token refresh errors', async () => {
      // Arrange
      const authError = createMockAuthError('Refresh token expired', 401)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.getSession()

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Refresh token expired')
      expect(result.data.session).toBeNull()
    })
  })

  describe('Authentication State Changes', () => {
    it('should handle authentication state change events', async () => {
      // Arrange
      const user = testUsers.authenticatedUser
      const session = testSessions.authenticatedSession
      testEnv = createSupabaseTestEnvironment({ user, session })

      const stateChangeCallback = vi.fn()

      // Act
      const { data } = testEnv.client.auth.onAuthStateChange(stateChangeCallback)

      // Wait for initial state callback
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert initial state
      expect(stateChangeCallback).toHaveBeenCalledWith('INITIAL_SESSION', session)

      // Clear previous calls to focus on new events
      stateChangeCallback.mockClear()

      // Act - Simulate sign in
      testEnv.authManager.signIn(user)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert sign in event
      expect(stateChangeCallback).toHaveBeenCalledWith('SIGNED_IN', expect.any(Object))

      // Act - Simulate sign out
      testEnv.authManager.signOut()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert sign out event
      expect(stateChangeCallback).toHaveBeenCalledWith('SIGNED_OUT', null)

      // Cleanup
      data.subscription.unsubscribe()
    })

    it('should handle token refresh events', async () => {
      // Arrange
      const user = testUsers.authenticatedUser
      const session = testSessions.authenticatedSession
      testEnv = createSupabaseTestEnvironment({ user, session })

      const stateChangeCallback = vi.fn()

      // Act
      const { data } = testEnv.client.auth.onAuthStateChange(stateChangeCallback)

      // Wait for initial state
      await new Promise(resolve => setTimeout(resolve, 10))

      // Clear previous calls to focus on refresh event
      stateChangeCallback.mockClear()

      // Act - Simulate token refresh
      testEnv.authManager.refreshToken()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(stateChangeCallback).toHaveBeenCalledWith('TOKEN_REFRESHED', expect.any(Object))

      // Cleanup
      data.subscription.unsubscribe()
    })

    it('should properly unsubscribe from auth state changes', async () => {
      // Arrange
      const testEnv = createSupabaseTestEnvironment()
      const stateChangeCallback = vi.fn()

      // Act
      const { data } = testEnv.client.auth.onAuthStateChange(stateChangeCallback)

      // Wait for initial callback
      await new Promise(resolve => setTimeout(resolve, 10))

      const initialCallCount = stateChangeCallback.mock.calls.length

      // Unsubscribe
      data.subscription.unsubscribe()

      // Simulate more auth events
      testEnv.authManager.signIn(testUsers.authenticatedUser)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert - No new calls after unsubscribe
      expect(stateChangeCallback).toHaveBeenCalledTimes(initialCallCount)
    })
  })

  describe('User Sign Out', () => {
    it('should successfully sign out authenticated user', async () => {
      // Arrange
      const user = testUsers.authenticatedUser
      const session = testSessions.authenticatedSession
      testEnv = createSupabaseTestEnvironment({ user, session })

      // Act
      const result = await testEnv.client.auth.signOut()

      // Assert
      expect(result.error).toBeNull()
      expect(testEnv.client.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      // Arrange
      const authError = createMockAuthError('Sign out failed', 500)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.signOut()

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Sign out failed')
    })

    it('should handle sign out when not authenticated', async () => {
      // Arrange
      testEnv = createSupabaseTestEnvironment({ user: null, session: null })

      // Act
      const result = await testEnv.client.auth.signOut()

      // Assert - Should succeed even when not authenticated
      expect(result.error).toBeNull()
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle network errors during authentication', async () => {
      // Arrange
      const authError = createMockAuthError('Network error', 0)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123!'
      })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Network error')
      expect(result.error?.status).toBe(0)
    })

    it('should handle malformed authentication responses', async () => {
      // Arrange
      const authError = createMockAuthError('Invalid response format', 500)
      testEnv = createSupabaseTestEnvironment({ authError })

      // Act
      const result = await testEnv.client.auth.getUser()

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Invalid response format')
    })

    it('should handle concurrent authentication requests', async () => {
      // Arrange
      const user = testUsers.authenticatedUser
      testEnv = createSupabaseTestEnvironment({ user })
      const credentials = userScenarios.authentication.validCredentials

      // Act - Make multiple concurrent requests
      const promises = Array.from({ length: 3 }, () =>
        testEnv.client.auth.signInWithPassword(credentials)
      )

      const results = await Promise.all(promises)

      // Assert - All should succeed
      results.forEach(result => {
        expect(result.error).toBeNull()
        expect(result.data.user).toBeDefined()
      })
    })
  })
})