/**
 * Test user fixtures for consistent test data
 */

export interface TestUser {
  email: string;
  password: string;
  displayName?: string;
  role?: 'user' | 'admin';
}

export const TEST_USERS = {
  primary: {
    email: process.env.TEST_USER || 'test@example.com',
    password: process.env.TEST_PASSWORD || 'Test1234!',
    displayName: 'Primary Test User',
    role: 'user' as const
  },
  
  secondary: {
    email: 'test2@example.com',
    password: 'Test1234!',
    displayName: 'Secondary Test User',
    role: 'user' as const
  }
} as const;

export const getTestUser = (type: keyof typeof TEST_USERS = 'primary'): TestUser => {
  return TEST_USERS[type];
};

export const validateTestUserCredentials = (): void => {
  if (!process.env.TEST_USER || !process.env.TEST_PASSWORD) {
    throw new Error('TEST_USER and TEST_PASSWORD environment variables are required for testing');
  }
};

// Mock user objects for Supabase auth testing
export const testUsers = {
  authenticatedUser: {
    id: 'test-user-id-1',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    role: 'authenticated'
  }
};

// Mock session objects for Supabase auth testing
export const testSessions = {
  authenticatedSession: {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: testUsers.authenticatedUser
  }
};

// User scenarios for different test cases
export const userScenarios = {
  authentication: {
    validCredentials: {
      email: 'test@example.com',
      password: 'validPassword123!'
    },
    invalidCredentials: {
      email: 'test@example.com',
      password: 'wrongPassword'
    },
    invalidEmail: {
      email: 'invalid-email',
      password: 'validPassword123!'
    },
    weakPassword: {
      email: 'test@example.com',
      password: '123'
    }
  },
  registration: {
    unconfirmedUser: {
      id: 'unconfirmed-user-id',
      email: 'unconfirmed@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      role: 'authenticated'
    }
  },
  passwordReset: {
    nonExistentUser: {
      email: 'nonexistent@example.com'
    }
  }
};

// Helper functions for creating test users and sessions
export const createTestUser = (overrides = {}) => ({
  ...testUsers.authenticatedUser,
  ...overrides
});

export const createTestSession = (overrides = {}) => ({
  ...testSessions.authenticatedSession,
  ...overrides
});