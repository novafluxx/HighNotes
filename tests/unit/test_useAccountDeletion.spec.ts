import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAccountDeletion } from '~/composables/useAccountDeletion'

// Mock dependencies
vi.mock('#imports', () => ({
  useSupabaseClient: () => mockSupabaseClient,
  useSupabaseUser: () => ({ value: mockUser }),
  useRouter: () => mockRouter,
  useOfflineNotes: () => mockOfflineNotes,
  useNotes: () => mockNotes,
  readonly: (ref: any) => ref
}))

const mockSupabaseClient = {
  functions: {
    invoke: vi.fn()
  },
  auth: {
    signOut: vi.fn()
  }
}

const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
}

const mockRouter = {
  push: vi.fn()
}

const mockOfflineNotes = {
  clearAllOfflineData: vi.fn(),
  enqueueOperation: vi.fn()
}

const mockNotes = {
  unsubscribeFromNotes: vi.fn()
}

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('useAccountDeletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigator.onLine = true
  })

  it('should reject invalid confirmation phrase', async () => {
    const { deleteAccount } = useAccountDeletion()
    
    const result = await deleteAccount('WRONG_PHRASE')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid confirmation phrase')
    expect(mockSupabaseClient.functions.invoke).not.toHaveBeenCalled()
  })

  it('should queue deletion when offline', async () => {
    navigator.onLine = false
    const { deleteAccount } = useAccountDeletion()
    
    const result = await deleteAccount('DELETE_MY_ACCOUNT')
    
    expect(result.success).toBe(true)
    expect(result.error).toContain('queued')
    expect(mockOfflineNotes.enqueueOperation).toHaveBeenCalledWith({
      type: 'delete-account',
      data: { confirmation: 'DELETE_MY_ACCOUNT' },
      timestamp: expect.any(Number)
    })
    expect(mockSupabaseClient.functions.invoke).not.toHaveBeenCalled()
  })

  it('should successfully delete account when online', async () => {
    mockSupabaseClient.functions.invoke.mockResolvedValue({
      data: { success: true },
      error: null
    })
    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })
    
    const { deleteAccount } = useAccountDeletion()
    
    const result = await deleteAccount('DELETE_MY_ACCOUNT')
    
    expect(result.success).toBe(true)
    expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('delete-account', {
      body: { confirmation: 'DELETE_MY_ACCOUNT' }
    })
    expect(mockNotes.unsubscribeFromNotes).toHaveBeenCalled()
    expect(mockOfflineNotes.clearAllOfflineData).toHaveBeenCalled()
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('should handle server errors gracefully', async () => {
    mockSupabaseClient.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Server error' }
    })
    
    const { deleteAccount } = useAccountDeletion()
    
    const result = await deleteAccount('DELETE_MY_ACCOUNT')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Server error')
    expect(mockSupabaseClient.auth.signOut).not.toHaveBeenCalled()
  })

  it('should handle network errors gracefully', async () => {
    mockSupabaseClient.functions.invoke.mockRejectedValue(new Error('Network error'))
    
    const { deleteAccount } = useAccountDeletion()
    
    const result = await deleteAccount('DELETE_MY_ACCOUNT')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('An unexpected error occurred')
  })

  it('should clean up local data correctly', async () => {
    const { cleanupLocalData } = useAccountDeletion()
    
    await cleanupLocalData()
    
    expect(mockNotes.unsubscribeFromNotes).toHaveBeenCalled()
    expect(mockOfflineNotes.clearAllOfflineData).toHaveBeenCalled()
  })
})
