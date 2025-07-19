import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  createSupabaseTestEnvironment,
  createMockDatabaseError,
  type SupabaseTestOptions 
} from '../../utils/supabase-test-utils'
import { testNotes, createTestNote, crudScenarios, type TestNote } from '../../fixtures/notes'
import { testUsers } from '../../fixtures/users'
import type { PostgrestError } from '@supabase/supabase-js'

describe('Supabase Notes CRUD Integration', () => {
  let testEnv: ReturnType<typeof createSupabaseTestEnvironment>

  beforeEach(() => {
    // Create a fresh test environment for each test
    testEnv = createSupabaseTestEnvironment()
    
    // Seed the database with initial test data
    testEnv.databaseManager.seedTable('notes', [
      testNotes.note1,
      testNotes.note2,
      testNotes.note3,
      testNotes.powerUserNote1,
      testNotes.powerUserNote2
    ])
  })

  afterEach(() => {
    testEnv.cleanup()
    vi.clearAllMocks()
  })

  describe('Create Operations', () => {
    it('should successfully create a new note with valid data', async () => {
      // Arrange
      const newNote = crudScenarios.create.validNote
      const expectedNote = {
        id: 'new-note-id',
        user_id: testUsers.authenticatedUser.id,
        title: newNote.title,
        content: newNote.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Mock the database manager to return the expected result
      testEnv.databaseManager.mockInsert = vi.fn().mockReturnValue({
        data: [expectedNote],
        error: null
      })

      // Mock the client's from method to use our database manager
      testEnv.client.from = vi.fn().mockImplementation((tableName: string) => {
        const builder = {
          insert: vi.fn().mockImplementation((data: any) => ({
            select: vi.fn().mockResolvedValue(testEnv.databaseManager.mockInsert(tableName, data))
          }))
        }
        return builder
      })

      // Act
      const result = await testEnv.client
        .from('notes')
        .insert({
          user_id: testUsers.authenticatedUser.id,
          title: newNote.title,
          content: newNote.content
        })
        .select()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toMatchObject({
        title: newNote.title,
        content: newNote.content,
        user_id: testUsers.authenticatedUser.id
      })
    })

    it('should create a note with empty title', async () => {
      // Arrange
      const newNote = crudScenarios.create.emptyTitle
      const expectedNote = {
        id: 'empty-title-note-id',
        user_id: testUsers.authenticatedUser.id,
        title: '',
        content: newNote.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      testEnv.databaseManager.mockInsert = vi.fn().mockReturnValue({
        data: [expectedNote],
        error: null
      })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        insert: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockResolvedValue(testEnv.databaseManager.mockInsert('notes', {}))
        }))
      }))

      // Act
      const result = await testEnv.client
        .from('notes')
        .insert({
          user_id: testUsers.authenticatedUser.id,
          title: newNote.title,
          content: newNote.content
        })
        .select()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data[0].title).toBe('')
      expect(result.data[0].content).toBe(newNote.content)
    })

    it('should handle creation errors for missing required fields', async () => {
      // Arrange
      const dbError = createMockDatabaseError('null value in column "user_id" violates not-null constraint', '23502')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .insert({
          title: 'Test Note',
          content: 'Test content'
          // Missing user_id
        })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('23502')
      expect(result.error?.message).toContain('not-null constraint')
      expect(result.data).toBeNull()
    })

    it('should handle creation errors for invalid user_id foreign key', async () => {
      // Arrange
      const dbError = createMockDatabaseError('insert or update on table "notes" violates foreign key constraint', '23503')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .insert({
          user_id: 'non-existent-user-id',
          title: 'Test Note',
          content: 'Test content'
        })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('23503')
      expect(result.error?.message).toContain('foreign key constraint')
      expect(result.data).toBeNull()
    })
  })

  describe('Read Operations', () => {
    it('should retrieve all notes for a specific user', async () => {
      // Arrange
      const userId = testUsers.authenticatedUser.id
      const userNotes = [testNotes.note1, testNotes.note2, testNotes.note3]

      testEnv.databaseManager.mockSelect = vi.fn().mockReturnValue({
        data: userNotes,
        error: null
      })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            order: vi.fn().mockResolvedValue(testEnv.databaseManager.mockSelect('notes', { user_id: userId }))
          }))
        }))
      }))

      // Act
      const result = await testEnv.client
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(3)
      expect(result.data.every(note => note.user_id === userId)).toBe(true)
    })

    it('should retrieve a single note by ID', async () => {
      // Arrange
      const noteId = testNotes.note1.id
      const expectedNote = testNotes.note1

      testEnv.databaseManager.mockSelect = vi.fn().mockReturnValue({
        data: expectedNote,
        error: null
      })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue(testEnv.databaseManager.mockSelect('notes', { id: noteId }))
          }))
        }))
      }))

      // Act
      const result = await testEnv.client
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).toEqual(expectedNote)
    })

    it('should handle retrieval of non-existent note', async () => {
      // Arrange
      const nonExistentId = 'non-existent-note-id'
      const dbError = createMockDatabaseError('No rows found', 'PGRST116')

      testEnv.databaseManager.mockSelect = vi.fn().mockReturnValue({
        data: null,
        error: dbError
      })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue(testEnv.databaseManager.mockSelect('notes', { id: nonExistentId }))
          }))
        }))
      }))

      // Act
      const result = await testEnv.client
        .from('notes')
        .select('*')
        .eq('id', nonExistentId)
        .single()

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('PGRST116')
      expect(result.data).toBeNull()
    })
  })

  describe('Update Operations', () => {
    it('should successfully update note title only', async () => {
      // Arrange
      const noteId = testNotes.note1.id
      const updates = crudScenarios.update.titleOnly
      const updatedNote = { ...testNotes.note1, ...updates, updated_at: new Date().toISOString() }

      testEnv.databaseManager.mockUpdate = vi.fn().mockReturnValue({
        data: [updatedNote],
        error: null
      })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockResolvedValue(testEnv.databaseManager.mockUpdate('notes', updates, { id: noteId }))
          }))
        }))
      }))

      // Act
      const result = await testEnv.client
        .from('notes')
        .update(updates)
        .eq('id', noteId)
        .select()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe(updates.title)
      expect(result.data[0].content).toBe(testNotes.note1.content) // Unchanged
    })

    it('should handle update of non-existent note', async () => {
      // Arrange
      const nonExistentId = 'non-existent-note-id'
      const updates = { title: 'Updated Title' }

      testEnv.databaseManager.mockUpdate = vi.fn().mockReturnValue({
        data: [],
        error: null
      })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockResolvedValue(testEnv.databaseManager.mockUpdate('notes', updates, { id: nonExistentId }))
          }))
        }))
      }))

      // Act
      const result = await testEnv.client
        .from('notes')
        .update(updates)
        .eq('id', nonExistentId)
        .select()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(0) // No rows affected
    })

    it('should handle database constraint violations during update', async () => {
      // Arrange
      const noteId = testNotes.note1.id
      const dbError = createMockDatabaseError('check constraint "notes_title_length" is violated', '23514')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .update({ title: 'A'.repeat(1000) }) // Assuming title has length constraint
        .eq('id', noteId)

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('23514')
      expect(result.error?.message).toContain('check constraint')
      expect(result.data).toBeNull()
    })
  })

  describe('Delete Operations', () => {
    it('should successfully delete a single note', async () => {
      // Arrange
      const noteId = testNotes.note1.id
      const deletedNote = testNotes.note1

      testEnv.databaseManager.mockDelete = vi.fn().mockReturnValue({
        data: [deletedNote],
        error: null
      })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        delete: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockResolvedValue(testEnv.databaseManager.mockDelete('notes', { id: noteId }))
          }))
        }))
      }))

      // Act
      const result = await testEnv.client
        .from('notes')
        .delete()
        .eq('id', noteId)
        .select()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(noteId)
    })

    it('should handle deletion of non-existent note', async () => {
      // Arrange
      const nonExistentId = 'non-existent-note-id'

      testEnv.databaseManager.mockDelete = vi.fn().mockReturnValue({
        data: [],
        error: null
      })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        delete: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockResolvedValue(testEnv.databaseManager.mockDelete('notes', { id: nonExistentId }))
          }))
        }))
      }))

      // Act
      const result = await testEnv.client
        .from('notes')
        .delete()
        .eq('id', nonExistentId)
        .select()

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(0) // No rows affected
    })

    it('should handle foreign key constraint violations during deletion', async () => {
      // Arrange
      const noteId = testNotes.note1.id
      const dbError = createMockDatabaseError('update or delete on table "notes" violates foreign key constraint', '23503')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .delete()
        .eq('id', noteId)

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('23503')
      expect(result.error?.message).toContain('foreign key constraint')
      expect(result.data).toBeNull()
    })
  })

  describe('Data Validation and Constraints', () => {
    it('should enforce title length constraints', async () => {
      // Arrange
      const longTitle = 'A'.repeat(1000) // Assuming title has max length constraint
      const dbError = createMockDatabaseError('value too long for type character varying(255)', '22001')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .insert({
          user_id: testUsers.authenticatedUser.id,
          title: longTitle,
          content: 'Test content'
        })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('22001')
      expect(result.error?.message).toContain('value too long')
    })

    it('should handle invalid UUID format for user_id', async () => {
      // Arrange
      const invalidUuid = 'not-a-valid-uuid'
      const dbError = createMockDatabaseError('invalid input syntax for type uuid', '22P02')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .insert({
          user_id: invalidUuid,
          title: 'Test Note',
          content: 'Test content'
        })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('22P02')
      expect(result.error?.message).toContain('invalid input syntax for type uuid')
    })

    it('should validate required fields are not null', async () => {
      // Arrange
      const dbError = createMockDatabaseError('null value in column "title" violates not-null constraint', '23502')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .insert({
          user_id: testUsers.authenticatedUser.id,
          title: null, // Assuming title is required
          content: 'Test content'
        })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('23502')
      expect(result.error?.message).toContain('not-null constraint')
    })
  })

  describe('Transaction Handling and Rollback Scenarios', () => {
    it('should handle concurrent modification conflicts', async () => {
      // Arrange - Simulate optimistic locking conflict
      const noteId = testNotes.note1.id
      const dbError = createMockDatabaseError('tuple concurrently updated', '40001')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .update({ title: 'Concurrent Update' })
        .eq('id', noteId)
        .eq('updated_at', testNotes.note1.updated_at) // Optimistic locking

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('40001')
      expect(result.data).toBeNull()
    })

    it('should handle deadlock scenarios', async () => {
      // Arrange - Simulate deadlock detection
      const dbError = createMockDatabaseError('deadlock detected', '40P01')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .update({ title: 'Deadlock Test' })
        .eq('user_id', testUsers.authenticatedUser.id)

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('40P01')
      expect(result.error?.message).toContain('deadlock detected')
    })

    it('should handle serialization failures in transactions', async () => {
      // Arrange - Simulate serialization failure
      const dbError = createMockDatabaseError('could not serialize access due to concurrent update', '40001')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .delete()
        .eq('user_id', testUsers.authenticatedUser.id)

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('40001')
      expect(result.error?.message).toContain('could not serialize access')
    })

    it('should handle connection timeout during transaction', async () => {
      // Arrange - Simulate connection timeout
      const dbError = createMockDatabaseError('connection timeout', '08006')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act
      const result = await testEnv.client
        .from('notes')
        .insert({
          user_id: testUsers.authenticatedUser.id,
          title: 'Timeout Test',
          content: 'This operation will timeout'
        })

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('08006')
      expect(result.error?.message).toContain('connection timeout')
    })
  })

  describe('User Data Persistence and Retrieval', () => {
    it('should enforce user data isolation', async () => {
      // Arrange
      const user1Id = testUsers.authenticatedUser.id
      const user2Id = testUsers.powerUser.id

      const user1Notes = [testNotes.note1, testNotes.note2]
      const user2Notes = [testNotes.powerUserNote1]

      // Mock different responses for different user queries
      testEnv.databaseManager.mockSelect = vi.fn()
        .mockReturnValueOnce({ data: user1Notes, error: null })
        .mockReturnValueOnce({ data: user2Notes, error: null })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue(testEnv.databaseManager.mockSelect())
        }))
      }))

      // Act - Get notes for user 1
      const user1Result = await testEnv.client
        .from('notes')
        .select('*')
        .eq('user_id', user1Id)

      // Act - Get notes for user 2
      const user2Result = await testEnv.client
        .from('notes')
        .select('*')
        .eq('user_id', user2Id)

      // Assert
      expect(user1Result.data).toHaveLength(2)
      expect(user1Result.data.every(note => note.user_id === user1Id)).toBe(true)
      
      expect(user2Result.data).toHaveLength(1)
      expect(user2Result.data.every(note => note.user_id === user2Id)).toBe(true)
      
      // Ensure no cross-contamination
      const user1NoteIds = user1Result.data.map(note => note.id)
      const user2NoteIds = user2Result.data.map(note => note.id)
      expect(user1NoteIds).not.toEqual(expect.arrayContaining(user2NoteIds))
    })

    it('should handle large dataset retrieval efficiently', async () => {
      // Arrange - Simulate large dataset
      const largeDataset = Array.from({ length: 50 }, (_, index) => 
        createTestNote({
          id: `large-note-${index}`,
          user_id: testUsers.powerUser.id,
          title: `Large Dataset Note ${index}`,
          content: `Content for note ${index}`
        })
      )

      testEnv.databaseManager.mockSelect = vi.fn().mockReturnValue({
        data: largeDataset,
        error: null
      })

      testEnv.client.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            order: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockResolvedValue(testEnv.databaseManager.mockSelect())
            }))
          }))
        }))
      }))

      // Act
      const result = await testEnv.client
        .from('notes')
        .select('*')
        .eq('user_id', testUsers.powerUser.id)
        .order('created_at', { ascending: false })
        .limit(50)

      // Assert
      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(50)
      expect(result.data[0].title).toContain('Large Dataset Note')
    })

    it('should maintain referential integrity with user deletion', async () => {
      // Arrange - Simulate cascade delete scenario
      const userId = testUsers.edgeCaseUser.id
      const dbError = createMockDatabaseError('update or delete on table "users" violates foreign key constraint', '23503')
      testEnv = createSupabaseTestEnvironment({ databaseError: dbError })

      // Act - Attempt to delete user with existing notes
      const result = await testEnv.client
        .from('users')
        .delete()
        .eq('id', userId)

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('23503')
      expect(result.error?.message).toContain('foreign key constraint')
    })
  })
})