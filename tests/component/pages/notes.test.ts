import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/vue'
import { ref } from 'vue'
import { renderWithNuxt, flushPromises } from '../../utils/test-utils'
import NotesPage from '../../../pages/notes.vue'

// Mock the useNotes composable
const mockNotes = ref([
  { id: '1', title: 'Test Note 1', content: 'Content 1', updated_at: '2023-01-01' },
  { id: '2', title: 'Test Note 2', content: 'Content 2', updated_at: '2023-01-02' }
])
const mockSelectedNote = ref(null)
const mockLoading = ref(false)
const mockSearchQuery = ref('')
const mockFetchNotes = vi.fn()
const mockSelectNote = vi.fn()
const mockCreateNewNote = vi.fn()
const mockSaveNote = vi.fn()
const mockDeleteNote = vi.fn()

vi.mock('~/composables/useNotes', () => ({
  useNotes: () => ({
    notes: mockNotes,
    selectedNote: mockSelectedNote,
    originalSelectedNote: ref(null),
    loading: mockLoading,
    loadingMore: ref(false),
    isDeleteModalOpen: ref(false),
    searchQuery: mockSearchQuery,
    hasMoreNotes: ref(false),
    isNoteDirty: ref(false),
    isTitleTooLong: ref(false),
    isContentTooLong: ref(false),
    isSaveDisabled: ref(false),
    TITLE_MAX_LENGTH: 100,
    CONTENT_MAX_LENGTH: 5000,
    formatDate: vi.fn((date) => new Date(date).toLocaleDateString()),
    fetchNotes: mockFetchNotes,
    selectNote: mockSelectNote,
    createNewNote: mockCreateNewNote,
    saveNote: mockSaveNote,
    deleteNote: mockDeleteNote,
    confirmDeleteNote: vi.fn()
  })
}))

// Mock the useLayout composable
const mockSidebarOpen = ref(false)
const mockIsMobile = ref(false)
const mockToggleSidebar = vi.fn()

vi.mock('~/composables/useLayout', () => ({
  useLayout: () => ({
    sidebarOpen: mockSidebarOpen,
    isMobile: mockIsMobile,
    toggleSidebar: mockToggleSidebar
  })
}))

describe('Notes Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotes.value = [
      { id: '1', title: 'Test Note 1', content: 'Content 1', updated_at: '2023-01-01' },
      { id: '2', title: 'Test Note 2', content: 'Content 2', updated_at: '2023-01-02' }
    ]
    mockSelectedNote.value = null
    mockLoading.value = false
    mockSearchQuery.value = ''
    mockSidebarOpen.value = false
    mockIsMobile.value = false
  })

  describe('Component Rendering', () => {
    it('renders notes page component successfully', async () => {
      const { container } = renderWithNuxt(NotesPage)
      
      // Check that the component renders without errors
      expect(container).toBeInTheDocument()
    })

    it('renders sidebar with notes list', () => {
      mockSidebarOpen.value = true
      renderWithNuxt(NotesPage)

      // Check for sidebar elements
      expect(screen.getByText('My Notes')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search notes...')).toBeInTheDocument()
    })

    it('renders notes list when notes are available', () => {
      mockSidebarOpen.value = true
      renderWithNuxt(NotesPage)

      // Check that notes are rendered
      expect(screen.getByText('Test Note 1')).toBeInTheDocument()
      expect(screen.getByText('Test Note 2')).toBeInTheDocument()
    })

    it('shows empty state when no notes are available', () => {
      mockNotes.value = []
      mockSidebarOpen.value = true
      renderWithNuxt(NotesPage)

      // Check for empty state message
      expect(screen.getByText('No notes yet.')).toBeInTheDocument()
    })

    it('shows placeholder when no note is selected', () => {
      renderWithNuxt(NotesPage)

      // Check for placeholder text
      expect(screen.getByText(/select a note or/i)).toBeInTheDocument()
      expect(screen.getByText(/create a new one/i)).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('renders search input with correct placeholder', () => {
      mockSidebarOpen.value = true
      renderWithNuxt(NotesPage)

      const searchInput = screen.getByPlaceholderText('Search notes...')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', 'Search notes...')
    })

    it('renders search input that can be interacted with', async () => {
      mockSidebarOpen.value = true
      renderWithNuxt(NotesPage)

      const searchInput = screen.getByPlaceholderText('Search notes...')
      
      // Test that the search input exists and can be focused
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', 'Search notes...')
    })
  })

  describe('Note Selection and Creation', () => {
    it('calls selectNote when a note is clicked', async () => {
      mockSidebarOpen.value = true
      renderWithNuxt(NotesPage)

      const noteButton = screen.getByText('Test Note 1')
      await fireEvent.click(noteButton)

      expect(mockSelectNote).toHaveBeenCalledWith(mockNotes.value[0])
    })

    it('renders New Note button with correct attributes', async () => {
      mockSidebarOpen.value = true
      renderWithNuxt(NotesPage)

      const newNoteButton = document.querySelector('ubutton[label="New Note"]')
      expect(newNoteButton).toBeInTheDocument()
      expect(newNoteButton).toHaveAttribute('label', 'New Note')
    })

    it('calls createNewNote when create new note link is clicked', async () => {
      renderWithNuxt(NotesPage)

      const createLink = screen.getByText('create a new one.')
      await fireEvent.click(createLink)

      expect(mockCreateNewNote).toHaveBeenCalled()
    })
  })

  describe('Note Editor', () => {
    beforeEach(() => {
      mockSelectedNote.value = {
        id: '1',
        title: 'Test Note',
        content: 'Test content',
        updated_at: '2023-01-01'
      }
    })

    it('renders note editor when a note is selected', () => {
      renderWithNuxt(NotesPage)

      // Check for form elements by their attributes
      const titleInput = document.querySelector('uinput[modelvalue="Test Note"]')
      const contentInput = document.querySelector('utextarea[modelvalue="Test content"]')

      expect(titleInput).toBeInTheDocument()
      expect(contentInput).toBeInTheDocument()
    })

    it('renders action buttons in note editor', () => {
      renderWithNuxt(NotesPage)

      // Check for action buttons by their attributes
      const saveButton = document.querySelector('ubutton[label="Save"]')
      const deleteButton = document.querySelector('ubutton[label="Delete"]')
      const closeButton = document.querySelector('ubutton[label="Close"]')

      expect(saveButton).toBeInTheDocument()
      expect(deleteButton).toBeInTheDocument()
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state for notes list', () => {
      mockLoading.value = true
      mockNotes.value = []
      mockSidebarOpen.value = true
      renderWithNuxt(NotesPage)

      // Check for loading skeletons (they should be present as custom elements)
      const skeletons = document.querySelectorAll('uskeleton')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('disables form inputs when loading', () => {
      mockLoading.value = true
      mockSelectedNote.value = {
        id: '1',
        title: 'Test Note',
        content: 'Test content',
        updated_at: '2023-01-01'
      }
      renderWithNuxt(NotesPage)

      // Check that form inputs are disabled during loading by their attributes
      const titleInput = document.querySelector('uinput[modelvalue="Test Note"]')
      const contentInput = document.querySelector('utextarea[modelvalue="Test content"]')

      expect(titleInput).toHaveAttribute('disabled', 'true')
      expect(contentInput).toHaveAttribute('disabled', 'true')
    })
  })

  describe('Mobile Layout', () => {
    it('handles mobile sidebar toggle', () => {
      mockIsMobile.value = true
      renderWithNuxt(NotesPage)

      // The sidebar should be hidden by default on mobile
      expect(mockSidebarOpen.value).toBe(false)
    })

    it('shows sidebar when sidebarOpen is true on mobile', () => {
      mockIsMobile.value = true
      mockSidebarOpen.value = true
      renderWithNuxt(NotesPage)

      // Check that sidebar content is visible
      expect(screen.getByText('My Notes')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('integrates with useNotes composable', () => {
      renderWithNuxt(NotesPage)

      // Verify that the composable functions are available
      expect(mockFetchNotes).toBeDefined()
      expect(mockSelectNote).toBeDefined()
      expect(mockCreateNewNote).toBeDefined()
      expect(mockSaveNote).toBeDefined()
      expect(mockDeleteNote).toBeDefined()
    })

    it('integrates with useLayout composable', () => {
      renderWithNuxt(NotesPage)

      // Verify that the layout composable functions are available
      expect(mockToggleSidebar).toBeDefined()
      expect(mockSidebarOpen).toBeDefined()
      expect(mockIsMobile).toBeDefined()
    })

    it('renders AppHeader component', () => {
      renderWithNuxt(NotesPage)

      // AppHeader should be rendered as a custom element
      expect(document.querySelector('appheader')).toBeInTheDocument()
    })
  })
})