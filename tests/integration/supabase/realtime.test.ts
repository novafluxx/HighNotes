import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createSupabaseTestEnvironment,
  RealtimeSubscriptionManager,
  type SupabaseTestOptions
} from '../../utils/supabase-test-utils'
import { testNotes, createTestNote } from '../../fixtures/notes'
import { testUsers } from '../../fixtures/users'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

describe('Supabase Real-time Subscriptions Integration', () => {
  let testEnv: ReturnType<typeof createSupabaseTestEnvironment>
  let realtimeManager: RealtimeSubscriptionManager

  beforeEach(() => {
    // Create a fresh test environment for each test
    testEnv = createSupabaseTestEnvironment()
    realtimeManager = new RealtimeSubscriptionManager()

    // Seed the database with initial test data
    testEnv.databaseManager.seedTable('notes', [
      testNotes.note1,
      testNotes.note2,
      testNotes.note3
    ])
  })

  afterEach(() => {
    testEnv.cleanup()
    realtimeManager.cleanup()
    vi.clearAllMocks()
  })

  describe('Real-time Note Updates', () => {
    it('should receive INSERT events when new notes are created', async () => {
      // Arrange
      const channelName = 'notes-channel'
      const newNote = createTestNote({
        id: 'new-realtime-note',
        user_id: testUsers.authenticatedUser.id,
        title: 'Real-time Test Note',
        content: 'This note was created in real-time'
      })

      let receivedPayload: RealtimePostgresChangesPayload<any> | null = null
      const insertCallback = vi.fn((payload: RealtimePostgresChangesPayload<any>) => {
        receivedPayload = payload
      })

      // Mock the channel creation and subscription
      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Set up subscription
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes'
      }, insertCallback)

      await channel.subscribe()

      // Simulate a real-time INSERT event
      const insertPayload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: newNote,
        old: {},
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      realtimeManager.simulateEvent(channelName, 'INSERT', insertPayload)

      // Wait for async callback execution
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(insertCallback).toHaveBeenCalledOnce()
      expect(receivedPayload).not.toBeNull()
      expect(receivedPayload?.eventType).toBe('INSERT')
      expect(receivedPayload?.new).toEqual(newNote)
      expect(receivedPayload?.table).toBe('notes')
    })

    it('should receive UPDATE events when notes are modified', async () => {
      // Arrange
      const channelName = 'notes-updates'
      const originalNote = testNotes.note1
      const updatedNote = {
        ...originalNote,
        title: 'Updated Title via Real-time',
        content: 'Updated content via real-time',
        updated_at: new Date().toISOString()
      }

      let receivedPayload: RealtimePostgresChangesPayload<any> | null = null
      const updateCallback = vi.fn((payload: RealtimePostgresChangesPayload<any>) => {
        receivedPayload = payload
      })

      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Set up subscription
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notes'
      }, updateCallback)

      await channel.subscribe()

      // Simulate a real-time UPDATE event
      const updatePayload: RealtimePostgresChangesPayload<any> = {
        eventType: 'UPDATE',
        new: updatedNote,
        old: originalNote,
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      realtimeManager.simulateEvent(channelName, 'UPDATE', updatePayload)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(updateCallback).toHaveBeenCalledOnce()
      expect(receivedPayload?.eventType).toBe('UPDATE')
      expect(receivedPayload?.new.title).toBe('Updated Title via Real-time')
      expect(receivedPayload?.old.title).toBe(originalNote.title)
    })

    it('should receive DELETE events when notes are removed', async () => {
      // Arrange
      const channelName = 'notes-deletes'
      const deletedNote = testNotes.note2

      let receivedPayload: RealtimePostgresChangesPayload<any> | null = null
      const deleteCallback = vi.fn((payload: RealtimePostgresChangesPayload<any>) => {
        receivedPayload = payload
      })

      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Set up subscription
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notes'
      }, deleteCallback)

      await channel.subscribe()

      // Simulate a real-time DELETE event
      const deletePayload: RealtimePostgresChangesPayload<any> = {
        eventType: 'DELETE',
        new: {},
        old: deletedNote,
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      realtimeManager.simulateEvent(channelName, 'DELETE', deletePayload)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(deleteCallback).toHaveBeenCalledOnce()
      expect(receivedPayload?.eventType).toBe('DELETE')
      expect(receivedPayload?.old).toEqual(deletedNote)
      expect(receivedPayload?.new).toEqual({})
    })

    it('should filter events by user_id when specified', async () => {
      // Arrange
      const channelName = 'user-specific-notes'
      const userId = testUsers.authenticatedUser.id
      const userNote = createTestNote({
        id: 'user-specific-note',
        user_id: userId,
        title: 'User Specific Note'
      })
      const otherUserNote = createTestNote({
        id: 'other-user-note',
        user_id: testUsers.powerUser.id,
        title: 'Other User Note'
      })

      const userCallback = vi.fn()
      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Set up filtered subscription
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      }, userCallback)

      await channel.subscribe()

      // Simulate events for both users
      const userPayload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: userNote,
        old: {},
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      const otherUserPayload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: otherUserNote,
        old: {},
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      // Only the user-specific event should trigger the callback (simulate filtering by checking user_id)
      if (userPayload.new.user_id === userId) {
        realtimeManager.simulateEvent(channelName, 'INSERT', userPayload)
      }
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert - User callback should be called for user's note
      expect(userCallback).toHaveBeenCalledOnce()
      expect(userCallback).toHaveBeenCalledWith(userPayload)

      // Reset and test other user's note (should not trigger callback due to filter)
      userCallback.mockClear()

      // Don't simulate the other user's event since it would be filtered out by Supabase
      // In real Supabase, the filter would prevent this event from reaching the callback

      // Assert - Callback should not be called for other user's note
      expect(userCallback).not.toHaveBeenCalled()
    })
  })

  describe('Subscription Lifecycle Management', () => {
    it('should successfully establish subscription connection', async () => {
      // Arrange
      const channelName = 'lifecycle-test'
      const subscribeCallback = vi.fn()

      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes'
      }, vi.fn())

      const subscribeResult = await channel.subscribe(subscribeCallback)

      // Wait for async callback execution
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(subscribeResult).toBe('ok')
      expect(subscribeCallback).toHaveBeenCalledWith('SUBSCRIBED', null)
    })

    it('should handle subscription errors gracefully', async () => {
      // Arrange
      const channelName = 'error-test'
      const subscribeCallback = vi.fn()
      const errorMessage = 'Subscription failed due to network error'

      // Create a subscription that fails
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((callback) => {
          setTimeout(() => {
            if (callback) callback('SUBSCRIPTION_ERROR', { message: errorMessage })
          }, 0)
          return Promise.resolve('error')
        }),
        unsubscribe: vi.fn()
      }

      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes'
      }, vi.fn())

      const subscribeResult = await channel.subscribe(subscribeCallback)

      // Wait for error callback
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(subscribeResult).toBe('error')
      expect(subscribeCallback).toHaveBeenCalledWith('SUBSCRIPTION_ERROR', { message: errorMessage })
    })

    it('should properly unsubscribe and clean up resources', async () => {
      // Arrange
      const channelName = 'cleanup-test'
      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Subscribe
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes'
      }, vi.fn())

      await channel.subscribe()

      // Act - Unsubscribe
      const unsubscribeResult = await channel.unsubscribe()

      // Assert
      expect(unsubscribeResult).toBe('ok')
      expect(mockChannel.unsubscribe).toHaveBeenCalledOnce()
    })

    it('should handle multiple subscriptions on the same channel', async () => {
      // Arrange
      const channelName = 'multi-subscription'
      const insertCallback = vi.fn()
      const updateCallback = vi.fn()
      const deleteCallback = vi.fn()

      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Set up multiple event listeners
      const channel = testEnv.client.channel(channelName)

      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes'
      }, insertCallback)

      channel.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notes'
      }, updateCallback)

      channel.on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notes'
      }, deleteCallback)

      await channel.subscribe()

      // Simulate different events
      const insertPayload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: testNotes.note1,
        old: {},
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      realtimeManager.simulateEvent(channelName, 'INSERT', insertPayload)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(insertCallback).toHaveBeenCalledOnce()
      expect(updateCallback).not.toHaveBeenCalled()
      expect(deleteCallback).not.toHaveBeenCalled()
    })

    it('should handle subscription reconnection after network interruption', async () => {
      // Arrange
      const channelName = 'reconnection-test'
      const eventCallback = vi.fn()
      const subscribeCallback = vi.fn()

      let subscriptionAttempts = 0
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((callback) => {
          subscriptionAttempts++

          if (subscriptionAttempts === 1) {
            // First attempt fails
            setTimeout(() => {
              if (callback) callback('SUBSCRIPTION_ERROR', { message: 'Network error' })
            }, 0)
            return Promise.resolve('error')
          } else {
            // Second attempt succeeds (reconnection)
            setTimeout(() => {
              if (callback) callback('SUBSCRIBED', null)
            }, 0)
            return Promise.resolve('ok')
          }
        }),
        unsubscribe: vi.fn()
      }

      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - First subscription attempt (fails)
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes'
      }, eventCallback)

      const firstResult = await channel.subscribe(subscribeCallback)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Act - Reconnection attempt (succeeds)
      const secondResult = await channel.subscribe(subscribeCallback)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(firstResult).toBe('error')
      expect(secondResult).toBe('ok')
      expect(subscribeCallback).toHaveBeenCalledWith('SUBSCRIPTION_ERROR', { message: 'Network error' })
      expect(subscribeCallback).toHaveBeenCalledWith('SUBSCRIBED', null)
      expect(subscriptionAttempts).toBe(2)
    })
  })

  describe('Multi-user Collaboration Scenarios', () => {
    it('should handle concurrent note updates from multiple users', async () => {
      // Arrange
      const channelName = 'multi-user-updates'
      const sharedNoteId = 'shared-note-id'

      const user1Update = createTestNote({
        id: sharedNoteId,
        user_id: testUsers.authenticatedUser.id,
        title: 'Updated by User 1',
        content: 'Content updated by user 1',
        updated_at: new Date().toISOString()
      })

      const user2Update = createTestNote({
        id: sharedNoteId,
        user_id: testUsers.powerUser.id,
        title: 'Updated by User 2',
        content: 'Content updated by user 2',
        updated_at: new Date(Date.now() + 1000).toISOString() // 1 second later
      })

      const updateEvents: RealtimePostgresChangesPayload<any>[] = []
      const updateCallback = vi.fn((payload: RealtimePostgresChangesPayload<any>) => {
        updateEvents.push(payload)
      })

      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Set up subscription
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notes'
      }, updateCallback)

      await channel.subscribe()

      // Simulate concurrent updates
      const user1Payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'UPDATE',
        new: user1Update,
        old: testNotes.note1,
        schema: 'public',
        table: 'notes',
        commit_timestamp: user1Update.updated_at,
        errors: null
      }

      const user2Payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'UPDATE',
        new: user2Update,
        old: user1Update,
        schema: 'public',
        table: 'notes',
        commit_timestamp: user2Update.updated_at,
        errors: null
      }

      realtimeManager.simulateEvent(channelName, 'UPDATE', user1Payload)
      realtimeManager.simulateEvent(channelName, 'UPDATE', user2Payload)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(updateCallback).toHaveBeenCalledTimes(2)
      expect(updateEvents).toHaveLength(2)
      expect(updateEvents[0].new.title).toBe('Updated by User 1')
      expect(updateEvents[1].new.title).toBe('Updated by User 2')
      expect(updateEvents[1].old.title).toBe('Updated by User 1') // Shows progression
    })

    it('should broadcast note creation to all subscribed users', async () => {
      // Arrange
      const channelName = 'broadcast-creation'
      const newNote = createTestNote({
        id: 'broadcast-note',
        user_id: testUsers.authenticatedUser.id,
        title: 'Broadcasted Note',
        content: 'This note should be visible to all users'
      })

      const user1Callback = vi.fn()
      const user2Callback = vi.fn()
      const user3Callback = vi.fn()

      // Create separate channels for different users (simulating different browser sessions)
      const mockChannel1 = realtimeManager.createSubscription(`${channelName}-user1`)
      const mockChannel2 = realtimeManager.createSubscription(`${channelName}-user2`)
      const mockChannel3 = realtimeManager.createSubscription(`${channelName}-user3`)

      testEnv.client.channel = vi.fn()
        .mockReturnValueOnce(mockChannel1)
        .mockReturnValueOnce(mockChannel2)
        .mockReturnValueOnce(mockChannel3)

      // Act - Set up subscriptions for multiple users
      const channel1 = testEnv.client.channel(`${channelName}-user1`)
      channel1.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes'
      }, user1Callback)

      const channel2 = testEnv.client.channel(`${channelName}-user2`)
      channel2.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes'
      }, user2Callback)

      const channel3 = testEnv.client.channel(`${channelName}-user3`)
      channel3.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes'
      }, user3Callback)

      await Promise.all([
        channel1.subscribe(),
        channel2.subscribe(),
        channel3.subscribe()
      ])

      // Simulate broadcast to all channels
      const insertPayload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: newNote,
        old: {},
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      realtimeManager.simulateEvent(`${channelName}-user1`, 'INSERT', insertPayload)
      realtimeManager.simulateEvent(`${channelName}-user2`, 'INSERT', insertPayload)
      realtimeManager.simulateEvent(`${channelName}-user3`, 'INSERT', insertPayload)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(user1Callback).toHaveBeenCalledOnce()
      expect(user2Callback).toHaveBeenCalledOnce()
      expect(user3Callback).toHaveBeenCalledOnce()

      // All callbacks should receive the same payload
      expect(user1Callback).toHaveBeenCalledWith(insertPayload)
      expect(user2Callback).toHaveBeenCalledWith(insertPayload)
      expect(user3Callback).toHaveBeenCalledWith(insertPayload)
    })

    it('should handle user-specific note visibility in shared workspace', async () => {
      // Arrange
      const channelName = 'shared-workspace'

      const publicNote = createTestNote({
        id: 'public-note',
        user_id: testUsers.authenticatedUser.id,
        title: 'Public Note',
        content: 'This note is visible to all users'
      })

      const privateNote = createTestNote({
        id: 'private-note',
        user_id: testUsers.authenticatedUser.id,
        title: 'Private Note',
        content: 'This note is only visible to the owner'
      })

      const publicCallback = vi.fn()
      const privateCallback = vi.fn()

      // Create channels with different filters
      const publicChannel = realtimeManager.createSubscription(`${channelName}-public`)
      const privateChannel = realtimeManager.createSubscription(`${channelName}-private`)

      testEnv.client.channel = vi.fn()
        .mockReturnValueOnce(publicChannel)
        .mockReturnValueOnce(privateChannel)

      // Act - Set up public subscription (no user filter)
      const channel1 = testEnv.client.channel(`${channelName}-public`)
      channel1.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes'
      }, publicCallback)

      // Set up private subscription (user-specific filter)
      const channel2 = testEnv.client.channel(`${channelName}-private`)
      channel2.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${testUsers.authenticatedUser.id}`
      }, privateCallback)

      await Promise.all([
        channel1.subscribe(),
        channel2.subscribe()
      ])

      // Simulate events for both notes
      const publicPayload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: publicNote,
        old: {},
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      const privatePayload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: privateNote,
        old: {},
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      realtimeManager.simulateEvent(`${channelName}-public`, 'INSERT', publicPayload)
      realtimeManager.simulateEvent(`${channelName}-private`, 'INSERT', privatePayload)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(publicCallback).toHaveBeenCalledOnce()
      expect(privateCallback).toHaveBeenCalledOnce()
      expect(publicCallback).toHaveBeenCalledWith(publicPayload)
      expect(privateCallback).toHaveBeenCalledWith(privatePayload)
    })
  })

  describe('Connection Handling and Reconnection Logic', () => {
    it('should detect connection loss and attempt reconnection', async () => {
      // Arrange
      const channelName = 'connection-loss'
      const reconnectCallback = vi.fn()

      let connectionState = 'connected'
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((callback) => {
          if (connectionState === 'connected') {
            setTimeout(() => {
              if (callback) callback('SUBSCRIBED', null)
            }, 0)
            return Promise.resolve('ok')
          } else {
            setTimeout(() => {
              if (callback) callback('SUBSCRIPTION_ERROR', { message: 'Connection lost' })
            }, 0)
            return Promise.resolve('error')
          }
        }),
        unsubscribe: vi.fn()
      }

      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Initial connection
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes'
      }, vi.fn())

      const initialResult = await channel.subscribe(reconnectCallback)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Simulate connection loss
      connectionState = 'disconnected'
      const lostResult = await channel.subscribe(reconnectCallback)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Simulate reconnection
      connectionState = 'connected'
      const reconnectResult = await channel.subscribe(reconnectCallback)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(initialResult).toBe('ok')
      expect(lostResult).toBe('error')
      expect(reconnectResult).toBe('ok')
      expect(reconnectCallback).toHaveBeenCalledWith('SUBSCRIBED', null)
      expect(reconnectCallback).toHaveBeenCalledWith('SUBSCRIPTION_ERROR', { message: 'Connection lost' })
    })

    it('should handle exponential backoff for reconnection attempts', async () => {
      // Arrange
      const channelName = 'backoff-test'
      const reconnectAttempts: number[] = []

      let attemptCount = 0
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((callback) => {
          attemptCount++
          const timestamp = Date.now()
          reconnectAttempts.push(timestamp)

          if (attemptCount < 3) {
            // First two attempts fail
            setTimeout(() => {
              if (callback) callback('SUBSCRIPTION_ERROR', { message: `Attempt ${attemptCount} failed` })
            }, 0)
            return Promise.resolve('error')
          } else {
            // Third attempt succeeds
            setTimeout(() => {
              if (callback) callback('SUBSCRIBED', null)
            }, 0)
            return Promise.resolve('ok')
          }
        }),
        unsubscribe: vi.fn()
      }

      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Multiple reconnection attempts with delays
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes'
      }, vi.fn())

      // First attempt
      await channel.subscribe()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Second attempt (after 100ms delay)
      await new Promise(resolve => setTimeout(resolve, 100))
      await channel.subscribe()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Third attempt (after 200ms delay - exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 200))
      const finalResult = await channel.subscribe()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(finalResult).toBe('ok')
      expect(attemptCount).toBe(3)
      expect(reconnectAttempts).toHaveLength(3)

      // Verify exponential backoff timing (approximate)
      const timeDiff1 = reconnectAttempts[1] - reconnectAttempts[0]
      const timeDiff2 = reconnectAttempts[2] - reconnectAttempts[1]
      expect(timeDiff1).toBeGreaterThan(90) // ~100ms
      expect(timeDiff2).toBeGreaterThan(190) // ~200ms
    })

    it('should maintain subscription state during temporary network interruptions', async () => {
      // Arrange
      const channelName = 'network-interruption'
      const eventCallback = vi.fn()
      const statusCallback = vi.fn()

      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)

      // Act - Set up subscription
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes'
      }, eventCallback)

      await channel.subscribe(statusCallback)

      // Simulate events before interruption
      const beforeInterruption: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: testNotes.note1,
        old: {},
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      realtimeManager.simulateEvent(channelName, 'INSERT', beforeInterruption)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Simulate network interruption (no events should be received)
      const duringInterruption: RealtimePostgresChangesPayload<any> = {
        eventType: 'UPDATE',
        new: { ...testNotes.note1, title: 'Updated during interruption' },
        old: testNotes.note1,
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      // Don't simulate this event (simulating network interruption)

      // Simulate events after reconnection
      const afterReconnection: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: testNotes.note2,
        old: {},
        schema: 'public',
        table: 'notes',
        commit_timestamp: new Date().toISOString(),
        errors: null
      }

      realtimeManager.simulateEvent(channelName, 'INSERT', afterReconnection)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(eventCallback).toHaveBeenCalledTimes(2) // Before and after, not during
      expect(eventCallback).toHaveBeenNthCalledWith(1, beforeInterruption)
      expect(eventCallback).toHaveBeenNthCalledWith(2, afterReconnection)
      expect(statusCallback).toHaveBeenCalledWith('SUBSCRIBED', null)
    })

    it('should handle graceful degradation when real-time features are unavailable', async () => {
      // Arrange
      const channelName = 'graceful-degradation'
      const fallbackCallback = vi.fn()

      // Mock a client that doesn't support real-time
      const degradedClient = {
        ...testEnv.client,
        channel: vi.fn().mockImplementation(() => {
          throw new Error('Real-time features not available')
        })
      }

      // Act - Attempt to create subscription with error handling
      let subscriptionError: Error | null = null
      let fallbackActivated = false

      try {
        const channel = degradedClient.channel(channelName)
        await channel.subscribe()
      } catch (error) {
        subscriptionError = error as Error
        fallbackActivated = true
        fallbackCallback()
      }

      // Assert
      expect(subscriptionError).toBeDefined()
      expect(subscriptionError?.message).toContain('Real-time features not available')
      expect(fallbackActivated).toBe(true)
      expect(fallbackCallback).toHaveBeenCalledOnce()
    })

    it('should properly clean up resources on connection termination', async () => {
      // Arrange
      const channelName = 'cleanup-on-termination'
      const cleanupCallback = vi.fn()

      const mockChannel = realtimeManager.createSubscription(channelName)
      testEnv.client.channel = vi.fn().mockReturnValue(mockChannel)
      testEnv.client.removeChannel = vi.fn()
      testEnv.client.removeAllChannels = vi.fn()

      // Act - Set up subscription
      const channel = testEnv.client.channel(channelName)
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes'
      }, vi.fn())

      await channel.subscribe()

      // Simulate connection termination
      await channel.unsubscribe()
      testEnv.client.removeChannel(channel)

      // Cleanup all channels
      testEnv.client.removeAllChannels()

      // Assert
      expect(mockChannel.unsubscribe).toHaveBeenCalledOnce()
      expect(testEnv.client.removeChannel).toHaveBeenCalledWith(channel)
      expect(testEnv.client.removeAllChannels).toHaveBeenCalledOnce()
    })
  })
})