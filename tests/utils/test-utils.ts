import { render, type RenderOptions } from '@testing-library/vue'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import { vi, type MockedFunction } from 'vitest'
import type { Component, App } from 'vue'

// Types for test utilities
export interface TestRenderOptions extends RenderOptions {
  router?: Router
  route?: {
    path?: string
    params?: Record<string, string>
    query?: Record<string, string>
    hash?: string
    name?: string | null
    meta?: Record<string, any>
  }
  user?: {
    id: string
    email: string
    authenticated: boolean
  } | null
  supabaseClient?: any
  globalProperties?: Record<string, any>
}

export interface TestRouterOptions {
  initialRoute?: string
  routes?: Array<{
    path: string
    name?: string
    component: Component
  }>
}

// Create a test router with minimal routes
export function createTestRouter(options: TestRouterOptions = {}) {
  const { initialRoute = '/', routes = [] } = options
  
  const defaultRoutes = [
    { path: '/', name: 'index', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    { path: '/signup', name: 'signup', component: { template: '<div>Signup</div>' } },
    { path: '/notes', name: 'notes', component: { template: '<div>Notes</div>' } },
    { path: '/reset', name: 'reset', component: { template: '<div>Reset</div>' } },
    { path: '/confirm', name: 'confirm', component: { template: '<div>Confirm</div>' } },
    ...routes
  ]

  const router = createRouter({
    history: createWebHistory(),
    routes: defaultRoutes
  })

  // Set initial route
  router.push(initialRoute)

  return router
}

// Mock Nuxt composables and provide context
export function createNuxtMocks(options: TestRenderOptions = {}) {
  const { route = {}, user = null, supabaseClient = null } = options

  // Mock router
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    resolve: vi.fn(),
    getRoutes: vi.fn(() => []),
    hasRoute: vi.fn(() => true),
    removeRoute: vi.fn(),
    addRoute: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn(),
    isReady: vi.fn(() => Promise.resolve()),
    currentRoute: {
      value: {
        path: route.path || '/',
        params: route.params || {},
        query: route.query || {},
        hash: route.hash || '',
        name: route.name || null,
        meta: route.meta || {},
        matched: [],
        redirectedFrom: undefined,
        fullPath: route.path || '/'
      }
    },
    options: { history: createWebHistory(), routes: [] }
  }

  // Mock Nuxt app context
  const mockNuxtApp = {
    $router: mockRouter,
    $route: mockRouter.currentRoute.value,
    provide: vi.fn(),
    hook: vi.fn(),
    callHook: vi.fn(),
    runWithContext: vi.fn((fn) => fn())
  }

  // Mock Supabase user and session
  const mockSupabaseUser = ref(user)
  const mockSupabaseSession = ref(user ? { user, access_token: 'mock-token' } : null)

  // Mock Supabase client
  const defaultSupabaseClient = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn()
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    }))
  }

  return {
    mockRouter,
    mockNuxtApp,
    mockSupabaseUser,
    mockSupabaseSession,
    mockSupabaseClient: supabaseClient || defaultSupabaseClient
  }
}

// Custom render function with Nuxt context
export function renderWithNuxt(
  component: Component,
  options: TestRenderOptions = {}
) {
  const {
    router,
    route,
    user,
    supabaseClient,
    globalProperties = {},
    ...renderOptions
  } = options

  // Create mocks
  const mocks = createNuxtMocks({ route, user, supabaseClient })

  // Create test router if not provided
  const testRouter = router || createTestRouter({ 
    initialRoute: route?.path || '/' 
  })

  // Mock Nuxt composables
  vi.mocked(useNuxtApp).mockReturnValue(mocks.mockNuxtApp)
  vi.mocked(useRouter).mockReturnValue(mocks.mockRouter)
  vi.mocked(useRoute).mockReturnValue(mocks.mockRouter.currentRoute.value)
  vi.mocked(useSupabaseUser).mockReturnValue(mocks.mockSupabaseUser)
  vi.mocked(useSupabaseSession).mockReturnValue(mocks.mockSupabaseSession)
  vi.mocked(useSupabaseClient).mockReturnValue(mocks.mockSupabaseClient)

  // Global app configuration
  const global = {
    plugins: [testRouter],
    config: {
      globalProperties: {
        $router: mocks.mockRouter,
        $route: mocks.mockRouter.currentRoute.value,
        ...globalProperties
      }
    },
    ...renderOptions.global
  }

  const result = render(component, {
    ...renderOptions,
    global
  })

  return {
    ...result,
    router: testRouter,
    mocks
  }
}

// Helper to wait for Vue's next tick and any pending promises
export async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}

// Helper to trigger and wait for user events
export async function userEvent(element: Element, event: string, options: any = {}) {
  const { fireEvent } = await import('@testing-library/vue')
  await fireEvent[event](element, options)
  await flushPromises()
}

// Helper to find elements with better error messages
export function getByTestId(container: HTMLElement, testId: string) {
  const element = container.querySelector(`[data-testid="${testId}"]`)
  if (!element) {
    throw new Error(`Unable to find element with data-testid="${testId}"`)
  }
  return element
}

// Helper to check if element exists without throwing
export function queryByTestId(container: HTMLElement, testId: string) {
  return container.querySelector(`[data-testid="${testId}"]`)
}

// Mock factory for consistent test data
export function createMockFactory<T>(defaultData: T) {
  return (overrides: Partial<T> = {}): T => ({
    ...defaultData,
    ...overrides
  })
}

// Export commonly used testing utilities
export * from '@testing-library/vue'
export { vi } from 'vitest'