import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useNotes } from '~/composables/useNotes'
import { 
  createMockSupabaseClient, 
  createMockDatabaseError,
  createMockUser,
  createMockSession,
  type SupabaseTestOptions 
} from '../../utils/supabase-test-utils'
import { testUsers, testSessions } from '../../fixtures/users'
import { testNotes, createTestNote } from '../../fixtures/notes'

// Mock the composables at the module level
vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}))

vi.mock('@nuxtjs/supabase', () => ({
  useSupabaseClient: vi.fn(),
  useSupabaseUser: vi.fn(),
  useSupabaseSession: vi.fn()
}))

vi.mock('#imports', () => ({
  useToast: vi.fn()
}))

// Mock lodash-es - return the function directly to avoid debouncing in tests
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn) => fn)
}))

// Import the mocked functions after mocking
import { useRouter } from 'vue-router'
import { useSupabaseClient, useSupabaseUser, useSupabaseSession } from '@nuxtjs/supabase'
import { useToast } from '#imports'

describe('useNotes', () => {
  let mockRouter: any
  let mockSupabaseClient: any
  let mockSupabaseUser: any
  let mockSupabaseSession: any
  let mockToast: any

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
    mockSupabaseUser = ref(testUsers.authenticatedUser)
    mockSupabaseSession = ref(testSessions.authenticatedSession)
    
    mockToast = {
      add: vi.fn()
    }
    
    // Setup mock implementations
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useSupabaseClient).mockReturnValue(mockSupabaseClient)
    vi.mocked(useSupabaseUser).mockReturnValue(mockSupabaseUser)
    vi.mocked(useSupabaseSession).mockReturnValue(mockSupabaseSession)
    vi.mocked(useToast).mockReturnValue(mockToast)
    
    // Also set up global mocks
    global.useSupabaseClient.mockReturnValue(mockSupabaseClient)
    global.useSupabaseUser.mockReturnValue(mockSupabaseUser)
    global.useSupabaseSession.mockReturnValue(mockSupabaseSession)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default state', async () => {
      // Mock the query builder to return empty results quickly
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: [], error: null })
      })
      
      const { 
        notes, 
        selectedNote, 
        loadingMore, 
        isDeleteModalOpen,
        searchQuery,
        hasMoreNotes
      } = useNotes()
      
      // Wait for initial fetch to complete
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(notes.value).toEqual([])
      expect(selectedNote.value).toBeNull()
      expect(loadingMore.value).toBe(false)
      expect(isDeleteModalOpen.value).toBe(false)
      expect(searchQuery.value).toBe('')
      expect(hasMoreNotes.value).toBe(false) // Will be false for empty results
    })

    it('should provide all necessary methods', () => {
      const {
        fetchNotes,
        selectNote,
        createNewNote,
        saveNote,
        deleteNote,
        confirmDeleteNote,
        formatDate
      } = useNotes()
      
      expect(typeof fetchNotes).toBe('function')
      expect(typeof selectNote).toBe('function')
      expect(typeof createNewNote).toBe('function')
      expect(typeof saveNote).toBe('function')
      expect(typeof deleteNote).toBe('function')
      expect(typeof confirmDeleteNote).toBe('function')
      expect(typeof formatDate).toBe('function')
    })
  })

  describe('fetchNotes function', () => {
    it('should fetch notes successfully', async () => {
      // Arrange
      const mockNotes = [testNotes.note1, testNotes.note2]
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: mockNotes, error: null })
      })
      
      const { fetchNotes, notes, loading } = useNotes()
      
      // Act
      await fetchNotes()
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notes')
      expect(notes.value).toEqual(mockNotes)
      expect(loading.value).toBe(false)
    })

    it('should handle fetch errors gracefully', async () => {
      // Arrange
      const dbError = createMockDatabaseError('Failed to fetch notes')
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: null, error: dbError })
      })
      
      const { fetchNotes, notes } = useNotes()
      
      // Act
      await fetchNotes()
      
      // Assert
      expect(notes.value).toEqual([])
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Error fetching notes',
        description: 'Failed to fetch notes',
        color: 'error',
        duration: 5000
      })
    })

    it('should handle pagination correctly', async () => {
      // Arrange
      const mockNotes = Array.from({ length: 30 }, (_, i) => 
        createTestNote({ id: `note-${i}`, title: `Note ${i}` })
      )
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: mockNotes, error: null })
      })
      
      const { fetchNotes, notes, hasMoreNotes } = useNotes()
      
      // Act
      await fetchNotes()
      
      // Assert
      expect(notes.value).toEqual(mockNotes)
      expect(hasMoreNotes.value).toBe(true) // Should be true for exactly 30 notes
    })

    it('should handle search functionality', async () => {
      // Arrange
      const searchResults = [testNotes.searchableNote]
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: searchResults, error: null })
      })
      
      const { fetchNotes, notes } = useNotes()
      
      // Act
      await fetchNotes(false, 'javascript')
      
      // Assert
      expect(notes.value).toEqual(searchResults)
    })

    it('should redirect to login when user is not authenticated', async () => {
      // Arrange
      mockSupabaseUser.value = null
      
      const { fetchNotes } = useNotes()
      
      // Act
      await fetchNotes()
      
      // Assert
      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })
  })

  describe('selectNote function', () => {
    it('should select a note successfully', async () => {
      // Arrange
      const noteToSelect = testNotes.note1
      const { selectNote, selectedNote, originalSelectedNote } = useNotes()
      
      // Act
      await selectNote(noteToSelect)
      
      // Assert
      expect(selectedNote.value).toEqual(noteToSelect)
      expect(originalSelectedNote.value).toEqual(noteToSelect)
    })

    it('should clear selection when null is passed', async () => {
      // Arrange
      const { selectNote, selectedNote, originalSelectedNote } = useNotes()
      
      // Act
      await selectNote(null)
      
      // Assert
      expect(selectedNote.value).toBeNull()
      expect(originalSelectedNote.value).toBeNull()
    })

    it('should fetch full note content when needed', async () => {
      // Arrange
      const noteStub = { ...testNotes.note1, content: undefined }
      const fullNote = testNotes.note1
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: fullNote, error: null })
      })
      
      const { selectNote, selectedNote, loading } = useNotes()
      
      // Act
      await selectNote(noteStub)
      
      // Assert
      expect(selectedNote.value).toEqual(fullNote)
      expect(loading.value).toBe(false)
    })

    it('should handle errors when fetching full note', async () => {
      // Arrange
      const noteStub = { ...testNotes.note1, content: undefined }
      const dbError = createMockDatabaseError('Note not found')
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: dbError })
      })
      
      const { selectNote, selectedNote } = useNotes()
      
      // Act
      await selectNote(noteStub)
      
      // Assert
      expect(selectedNote.value).toBeNull()
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Error loading note',
        description: 'Note not found',
        color: 'error',
        duration: 5000
      })
    })
  })

  describe('createNewNote function', () => {
    it('should create a new note template', () => {
      // Arrange
      const { createNewNote, selectedNote, originalSelectedNote } = useNotes()
      
      // Act
      createNewNote()
      
      // Assert
      expect(selectedNote.value).toMatchObject({
        id: null,
        user_id: testUsers.authenticatedUser.id,
        title: '',
        content: ''
      })
      expect(originalSelectedNote.value).toMatchObject({
        id: null,
        user_id: testUsers.authenticatedUser.id,
        title: '',
        content: ''
      })
    })

    it('should not create note when user is not authenticated', () => {
      // Arrange
      mockSupabaseUser.value = null
      const { createNewNote, selectedNote } = useNotes()
      
      // Act
      createNewNote()
      
      // Assert
      expect(selectedNote.value).toBeNull()
    })
  })

  describe('saveNote function', () => {
    it('should save a new note successfully', async () => {
      // Arrange
      const newNote = createTestNote({ id: null, title: 'New Note', content: 'New content' })
      const savedNote = createTestNote({ id: 'new-note-id', title: 'New Note', content: 'New content' })
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: savedNote, error: null })
      })
      
      const { saveNote, selectedNote, notes } = useNotes()
      selectedNote.value = newNote
      
      // Act
      await saveNote()
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notes')
      expect(notes.value).toContain(savedNote)
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Note saved!',
        icon: 'i-heroicons-check-circle',
        color: 'success',
        duration: 2000
      })
    })

    it('should update an existing note successfully', async () => {
      // Arrange
      const existingNote = testNotes.note1
      const updatedNote = { ...existingNote, title: 'Updated Title' }
      
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedNote, error: null })
      })
      
      const { saveNote, selectedNote, notes } = useNotes()
      selectedNote.value = updatedNote
      notes.value = [existingNote]
      
      // Act
      await saveNote()
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notes')
      expect(notes.value[0]).toEqual(updatedNote)
    })

    it('should handle save errors gracefully', async () => {
      // Arrange
      const newNote = createTestNote({ id: null, title: 'New Note', content: 'New content' })
      const dbError = createMockDatabaseError('Save failed')
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: dbError })
      })
      
      const { saveNote, selectedNote } = useNotes()
      selectedNote.value = newNote
      
      // Act
      await saveNote()
      
      // Assert
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Error saving note',
        description: 'Save failed',
        color: 'error',
        duration: 5000
      })
    })

    it('should not save when note is invalid', async () => {
      // Arrange
      const { saveNote, selectedNote } = useNotes()
      selectedNote.value = null
      
      // Act
      await saveNote()
      
      // Assert
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })
  })

  describe('deleteNote function', () => {
    it('should open delete confirmation modal', () => {
      // Arrange
      const { deleteNote, selectedNote, isDeleteModalOpen } = useNotes()
      selectedNote.value = testNotes.note1
      
      // Act
      deleteNote()
      
      // Assert
      expect(isDeleteModalOpen.value).toBe(true)
    })

    it('should not open modal when no note is selected', () => {
      // Arrange
      const { deleteNote, selectedNote, isDeleteModalOpen } = useNotes()
      selectedNote.value = null
      
      // Act
      deleteNote()
      
      // Assert
      expect(isDeleteModalOpen.value).toBe(false)
    })
  })

  describe('confirmDeleteNote function', () => {
    it('should delete note successfully', async () => {
      // Arrange
      const noteToDelete = testNotes.note1
      
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })
      
      const { confirmDeleteNote, selectedNote, notes, isDeleteModalOpen } = useNotes()
      selectedNote.value = noteToDelete
      notes.value = [noteToDelete, testNotes.note2]
      
      // Act
      await confirmDeleteNote()
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notes')
      expect(notes.value).not.toContain(noteToDelete)
      expect(selectedNote.value).toBeNull()
      expect(isDeleteModalOpen.value).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Note deleted',
        icon: 'i-heroicons-trash',
        color: 'info',
        duration: 2000
      })
    })

    it('should handle delete errors gracefully', async () => {
      // Arrange
      const noteToDelete = testNotes.note1
      const dbError = createMockDatabaseError('Delete failed')
      
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: dbError })
      })
      
      const { confirmDeleteNote, selectedNote } = useNotes()
      selectedNote.value = noteToDelete
      
      // Act
      await confirmDeleteNote()
      
      // Assert
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Error deleting note',
        description: 'Delete failed',
        color: 'error',
        duration: 5000
      })
    })
  })

  describe('computed properties', () => {
    it('should calculate isNoteDirty correctly for new notes', () => {
      // Arrange
      const { selectedNote, originalSelectedNote, isNoteDirty } = useNotes()
      
      // Act - new note with content
      selectedNote.value = createTestNote({ id: null, title: 'New', content: 'Content' })
      originalSelectedNote.value = createTestNote({ id: null, title: '', content: '' })
      
      // Assert
      expect(isNoteDirty.value).toBe(true)
    })

    it('should calculate isNoteDirty correctly for existing notes', () => {
      // Arrange
      const { selectedNote, originalSelectedNote, isNoteDirty } = useNotes()
      const originalNote = testNotes.note1
      
      // Act - modified existing note
      selectedNote.value = { ...originalNote, title: 'Modified Title' }
      originalSelectedNote.value = originalNote
      
      // Assert
      expect(isNoteDirty.value).toBe(true)
    })

    it('should calculate isSaveDisabled correctly', () => {
      // Arrange
      const { selectedNote, isSaveDisabled } = useNotes()
      
      // Act - note with empty title
      selectedNote.value = createTestNote({ title: '', content: 'Content' })
      
      // Assert
      expect(isSaveDisabled.value).toBe(true)
    })

    it('should validate title and content length', () => {
      // Arrange
      const { selectedNote, isTitleTooLong, isContentTooLong } = useNotes()
      
      // Act - long title and content
      selectedNote.value = createTestNote({
        title: 'a'.repeat(300), // Over 255 limit
        content: 'b'.repeat(15000) // Over 10000 limit
      })
      
      // Assert
      expect(isTitleTooLong.value).toBe(true)
      expect(isContentTooLong.value).toBe(true)
    })
  })

  describe('formatDate utility', () => {
    it('should format valid dates correctly', () => {
      // Arrange
      const { formatDate } = useNotes()
      const testDate = '2024-01-15T10:30:00.000Z'
      
      // Act
      const formatted = formatDate(testDate)
      
      // Assert
      expect(formatted).toMatch(/Jan 15, 2024/)
    })

    it('should handle invalid dates gracefully', () => {
      // Arrange
      const { formatDate } = useNotes()
      
      // Act
      const formatted = formatDate('invalid-date')
      
      // Assert
      expect(formatted).toBe('Invalid Date')
    })

    it('should handle undefined dates', () => {
      // Arrange
      const { formatDate } = useNotes()
      
      // Act
      const formatted = formatDate(undefined)
      
      // Assert
      expect(formatted).toBe('')
    })
  })

  describe('search functionality', () => {
    it('should handle search query changes', async () => {
      // Arrange
      const { searchQuery, fetchNotes } = useNotes()
      const fetchNotesSpy = vi.spyOn({ fetchNotes }, 'fetchNotes')
      
      // Act
      searchQuery.value = 'test query'
      
      // Note: The actual debounced search would be tested in integration tests
      // Here we just verify the search query is reactive
      expect(searchQuery.value).toBe('test query')
    })
  })

  describe('user state changes', () => {
    it('should clear notes when user logs out', async () => {
      // Arrange
      const { notes, selectedNote } = useNotes()
      notes.value = [testNotes.note1, testNotes.note2]
      selectedNote.value = testNotes.note1
      
      // Act - simulate user logout
      mockSupabaseUser.value = null
      await nextTick()
      
      // Assert
      expect(notes.value).toEqual([])
      expect(selectedNote.value).toBeNull()
      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })
  })
})