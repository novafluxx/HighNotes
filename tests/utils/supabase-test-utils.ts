import { vi, type MockedFunction } from 'vitest'
import type { 
  SupabaseClient, 
  User, 
  Session, 
  AuthError,
  PostgrestError,
  RealtimeChannel
} from '@supabase/supabase-js'

// Types for Supabase testing
export interface MockUser {
  id: string
  email: string
  created_at: string
  email_confirmed_at?: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
}

export interface MockSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: string
  user: MockUser
}

export interface MockAuthResponse<T = any> {
  data: T | null
  error: AuthError | null
}

export interface MockDatabaseResponse<T = any> {
  data: T | null
  error: PostgrestError | null
  status: number
  statusText: string
}

export interface SupabaseTestOptions {
  user?: MockUser | null
  session?: MockSession | null
  authError?: AuthError | null
  databaseError?: PostgrestError | null
}

// Mock user factory
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    user_metadata: {},
    app_metadata: {},
    ...overrides
  }
}

// Mock session factory
export function createMockSession(user?: MockUser): MockSession {
  const mockUser = user || createMockUser()
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: mockUser
  }
}

// Mock auth error factory
export function createMockAuthError(message: string, status = 400): AuthError {
  return {
    name: 'AuthError',
    message,
    status
  } as AuthError
}

// Mock database error factory
export function createMockDatabaseError(message: string, code = '23505'): PostgrestError {
  return {
    message,
    code,
    details: '',
    hint: ''
  } as PostgrestError
}

// Create mock Supabase client
export function createMockSupabaseClient(options: SupabaseTestOptions = {}): SupabaseClient {
  const { user = null, session = null, authError = null, databaseError = null } = options

  // Mock auth methods
  const mockAuth = {
    // Sign up
    signUp: vi.fn().mockImplementation(async ({ email, password, options: signUpOptions }) => {
      if (authError) {
        return { data: { user: null, session: null }, error: authError }
      }
      
      const mockUser = createMockUser({ email })
      const mockSession = createMockSession(mockUser)
      
      return {
        data: { user: mockUser, session: mockSession },
        error: null
      }
    }),

    // Sign in with password
    signInWithPassword: vi.fn().mockImplementation(async ({ email, password }) => {
      if (authError) {
        return { data: { user: null, session: null }, error: authError }
      }
      
      const mockUser = createMockUser({ email })
      const mockSession = createMockSession(mockUser)
      
      return {
        data: { user: mockUser, session: mockSession },
        error: null
      }
    }),

    // Sign out
    signOut: vi.fn().mockImplementation(async () => {
      if (authError) {
        return { error: authError }
      }
      return { error: null }
    }),

    // Reset password
    resetPasswordForEmail: vi.fn().mockImplementation(async (email, options) => {
      if (authError) {
        return { data: {}, error: authError }
      }
      return { data: {}, error: null }
    }),

    // Update user
    updateUser: vi.fn().mockImplementation(async (attributes) => {
      if (authError) {
        return { data: { user: null }, error: authError }
      }
      
      const updatedUser = createMockUser({ ...user, ...attributes })
      return { data: { user: updatedUser }, error: null }
    }),

    // Get session
    getSession: vi.fn().mockImplementation(async () => {
      if (authError) {
        return { data: { session: null }, error: authError }
      }
      return { data: { session }, error: null }
    }),

    // Get user
    getUser: vi.fn().mockImplementation(async () => {
      if (authError) {
        return { data: { user: null }, error: authError }
      }
      return { data: { user }, error: null }
    }),

    // Auth state change listener
    onAuthStateChange: vi.fn(),

    // Admin methods (for testing)
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
      updateUserById: vi.fn(),
      getUserById: vi.fn(),
      listUsers: vi.fn()
    }
  }

  // Mock database query builder
  const createMockQueryBuilder = (tableName: string) => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangeGt: vi.fn().mockReturnThis(),
      rangeGte: vi.fn().mockReturnThis(),
      rangeLt: vi.fn().mockReturnThis(),
      rangeLte: vi.fn().mockReturnThis(),
      rangeAdjacent: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        if (databaseError) {
          return Promise.resolve({ data: null, error: databaseError })
        }
        return Promise.resolve({ data: {}, error: null })
      }),
      maybeSingle: vi.fn().mockImplementation(() => {
        if (databaseError) {
          return Promise.resolve({ data: null, error: databaseError })
        }
        return Promise.resolve({ data: null, error: null })
      }),
      then: vi.fn().mockImplementation((resolve) => {
        if (databaseError) {
          resolve({ data: null, error: databaseError })
        } else {
          resolve({ data: [], error: null })
        }
      }),
      // Add a promise-like interface for async operations
      catch: vi.fn().mockReturnThis(),
      finally: vi.fn().mockReturnThis()
    }
    
    return queryBuilder
  }

  // Mock realtime channel
  const createMockChannel = (channelName: string): RealtimeChannel => {
    const channel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation((callback) => {
        // Simulate successful subscription
        setTimeout(() => {
          if (callback) callback('SUBSCRIBED', null)
        }, 0)
        return Promise.resolve('ok')
      }),
      unsubscribe: vi.fn().mockImplementation(() => Promise.resolve('ok')),
      send: vi.fn(),
      track: vi.fn(),
      untrack: vi.fn()
    } as any
    
    return channel
  }

  // Main client mock
  const client: SupabaseClient = {
    auth: mockAuth,
    
    // Database operations
    from: vi.fn().mockImplementation((tableName: string) => {
      return createMockQueryBuilder(tableName)
    }),

    // RPC calls
    rpc: vi.fn().mockImplementation(async (fnName, params) => {
      if (databaseError) {
        return { data: null, error: databaseError }
      }
      return { data: null, error: null }
    }),

    // Storage (basic mock)
    storage: {
      from: vi.fn().mockImplementation((bucketName: string) => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        getPublicUrl: vi.fn()
      }))
    },

    // Realtime
    channel: vi.fn().mockImplementation((channelName: string) => {
      return createMockChannel(channelName)
    }),

    // Remove channels
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
    getChannels: vi.fn().mockReturnValue([])
  } as any

  return client
}

// Authentication state helpers
export class AuthStateManager {
  private callbacks: Array<(event: string, session: MockSession | null) => void> = []
  private currentSession: MockSession | null = null

  constructor(initialSession: MockSession | null = null) {
    this.currentSession = initialSession
  }

  // Simulate login
  signIn(user: MockUser) {
    const session = createMockSession(user)
    this.currentSession = session
    this.notifyCallbacks('SIGNED_IN', session)
    return session
  }

  // Simulate logout
  signOut() {
    this.currentSession = null
    this.notifyCallbacks('SIGNED_OUT', null)
  }

  // Simulate token refresh
  refreshToken() {
    if (this.currentSession) {
      const newSession = {
        ...this.currentSession,
        access_token: 'new-mock-access-token',
        expires_at: Date.now() + 3600000
      }
      this.currentSession = newSession
      this.notifyCallbacks('TOKEN_REFRESHED', newSession)
      return newSession
    }
    return null
  }

  // Register callback
  onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    this.callbacks.push(callback)
    // Immediately call with current state
    callback('INITIAL_SESSION', this.currentSession)
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.callbacks.indexOf(callback)
            if (index > -1) {
              this.callbacks.splice(index, 1)
            }
          }
        }
      }
    }
  }

  private notifyCallbacks(event: string, session: MockSession | null) {
    this.callbacks.forEach(callback => callback(event, session))
  }

  getCurrentSession() {
    return this.currentSession
  }
}

// Database operation helpers
export class DatabaseMockManager {
  private tables: Map<string, any[]> = new Map()
  public mockSelect: any
  public mockInsert: any
  public mockUpdate: any
  public mockDelete: any

  constructor() {
    // Initialize with empty tables
    this.tables.set('notes', [])
    this.tables.set('profiles', [])
    
    // Initialize mock functions
    this.mockSelect = vi.fn()
    this.mockInsert = vi.fn()
    this.mockUpdate = vi.fn()
    this.mockDelete = vi.fn()
  }

  // Seed table with data
  seedTable(tableName: string, data: any[]) {
    this.tables.set(tableName, [...data])
  }

  // Get table data
  getTableData(tableName: string) {
    return this.tables.get(tableName) || []
  }

  // Clear table
  clearTable(tableName: string) {
    this.tables.set(tableName, [])
  }

  // Clear all tables
  clearAllTables() {
    this.tables.clear()
    this.tables.set('notes', [])
    this.tables.set('profiles', [])
  }

  // Create mock responses for queries
  mockSelectData(tableName: string, filters: Record<string, any> = {}) {
    const data = this.getTableData(tableName)
    const filteredData = data.filter(item => {
      return Object.entries(filters).every(([key, value]) => item[key] === value)
    })
    return { data: filteredData, error: null }
  }

  mockInsertData(tableName: string, newData: any) {
    const data = this.getTableData(tableName)
    const insertedData = Array.isArray(newData) ? newData : [newData]
    const updatedData = [...data, ...insertedData]
    this.tables.set(tableName, updatedData)
    return { data: insertedData, error: null }
  }

  mockUpdateData(tableName: string, updates: any, filters: Record<string, any> = {}) {
    const data = this.getTableData(tableName)
    const updatedData = data.map(item => {
      const matches = Object.entries(filters).every(([key, value]) => item[key] === value)
      return matches ? { ...item, ...updates } : item
    })
    this.tables.set(tableName, updatedData)
    const affectedRows = updatedData.filter(item => 
      Object.entries(filters).every(([key, value]) => item[key] === value)
    )
    return { data: affectedRows, error: null }
  }

  mockDeleteData(tableName: string, filters: Record<string, any> = {}) {
    const data = this.getTableData(tableName)
    const remainingData = data.filter(item => {
      return !Object.entries(filters).every(([key, value]) => item[key] === value)
    })
    const deletedData = data.filter(item => {
      return Object.entries(filters).every(([key, value]) => item[key] === value)
    })
    this.tables.set(tableName, remainingData)
    return { data: deletedData, error: null }
  }
}

// Realtime subscription helpers
export class RealtimeSubscriptionManager {
  private subscriptions: Map<string, any> = new Map()
  private callbacks: Map<string, Function[]> = new Map()

  // Create a mock subscription
  createSubscription(channelName: string) {
    const subscription = {
      on: (eventType: string, config: any, callback: Function) => {
        // Handle both old format (event, callback) and new format (event, config, callback)
        let actualCallback: Function
        let eventKey: string

        if (typeof config === 'function') {
          // Old format: on(event, callback)
          actualCallback = config
          eventKey = `${channelName}:${eventType}`
        } else {
          // New format: on(event, config, callback)
          actualCallback = callback
          // Create a more specific key that includes the event type from config
          if (config && config.event) {
            eventKey = `${channelName}:${config.event}`
          } else {
            eventKey = `${channelName}:${eventType}`
          }
        }

        if (!this.callbacks.has(eventKey)) {
          this.callbacks.set(eventKey, [])
        }
        this.callbacks.get(eventKey)!.push(actualCallback)
        return subscription
      },
      subscribe: vi.fn().mockImplementation((callback) => {
        setTimeout(() => {
          if (callback) callback('SUBSCRIBED', null)
        }, 0)
        return Promise.resolve('ok')
      }),
      unsubscribe: vi.fn().mockImplementation(() => {
        // Remove all callbacks for this channel
        const keysToDelete = Array.from(this.callbacks.keys()).filter(key => key.startsWith(channelName))
        keysToDelete.forEach(key => this.callbacks.delete(key))
        return Promise.resolve('ok')
      })
    }

    this.subscriptions.set(channelName, subscription)
    return subscription
  }

  // Simulate realtime event
  simulateEvent(channelName: string, eventType: string, payload: any) {
    // Find the exact key that matches the event type
    const exactKey = `${channelName}:${eventType}`
    const callbacks = this.callbacks.get(exactKey) || []
    
    callbacks.forEach(callback => {
      if (typeof callback === 'function') {
        callback(payload)
      }
    })
  }

  // Clean up all subscriptions
  cleanup() {
    this.subscriptions.clear()
    this.callbacks.clear()
  }
}

// Export helper to create complete test environment
export function createSupabaseTestEnvironment(options: SupabaseTestOptions = {}) {
  const authManager = new AuthStateManager(options.session)
  const databaseManager = new DatabaseMockManager()
  const realtimeManager = new RealtimeSubscriptionManager()
  const client = createMockSupabaseClient(options)

  // Connect the auth manager to the client's onAuthStateChange method
  client.auth.onAuthStateChange = vi.fn().mockImplementation((callback) => {
    return authManager.onAuthStateChange(callback)
  })

  return {
    client,
    authManager,
    databaseManager,
    realtimeManager,
    cleanup: () => {
      databaseManager.clearAllTables()
      realtimeManager.cleanup()
    }
  }
}