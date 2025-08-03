import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { type Note } from '~/types';
import type { Database } from '~/types/database.types';
import { useToast } from '#imports';
import { debounce } from 'lodash-es';

export function useNotes() {
  // --- Supabase Setup ---
  const router = useRouter();
  const client = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const isLoggedIn = computed(() => !!user.value);

  // --- Reactive State ---
  const notes = ref<Note[]>([]);
  const selectedNote = ref<Note | null>(null);
  const originalSelectedNote = ref<Note | null>(null); // For dirty checking
  const loading = ref(false); // For initial load or major actions (save/delete/select)
  const loadingMore = ref(false); // Specifically for loading more notes
  const isDeleteModalOpen = ref(false); // State for delete confirmation modal
  const toast = useToast(); // Initialize toast
  const currentPage = ref(1);
  const notesPerPage = 30; // Number of notes to fetch per page
  const hasMoreNotes = ref(true); // Assume there might be more notes initially
  const searchQuery = ref(''); // Reactive variable for search input
  const currentEditorContent = ref<string>(''); // Live content from the editor

  // --- Computed Properties for Validation/State ---
  const isNoteDirty = computed(() => {
    if (!selectedNote.value || !originalSelectedNote.value) {
      return false;
    }

    const titleChanged = selectedNote.value.title !== originalSelectedNote.value.title;
    const contentChanged = currentEditorContent.value !== originalSelectedNote.value.content;

    return titleChanged || contentChanged;
  });
  const TITLE_MAX_LENGTH = 255;
  const CONTENT_MAX_LENGTH = 10000; // Reverted to a more reasonable value for text content

  const isTitleTooLong = computed(() => {
    return (selectedNote.value?.title?.length ?? 0) >= TITLE_MAX_LENGTH;
  });

  const isSaveDisabled = computed(() => {
    return loading.value ||
           isTitleTooLong.value ||
           !selectedNote.value?.title?.trim() ||
           (!!selectedNote.value?.id && !isNoteDirty.value);
  });

  // --- Utility Functions ---
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // --- Core Logic Functions (CRUD, Select) ---

  // Fetch notes function with pagination
  const fetchNotes = async (loadMore = false, query: string | null = null) => {
    if (!isLoggedIn.value || !user.value || (loadMore && !hasMoreNotes.value)) return;

    if (loadMore) {
      loadingMore.value = true;
      currentPage.value++;
    } else {
      loading.value = true;
      currentPage.value = 1;
      notes.value = [];
      hasMoreNotes.value = true;
      selectedNote.value = null;
      originalSelectedNote.value = null;
      currentEditorContent.value = ''; // Reset editor content
    }

    const from = (currentPage.value - 1) * notesPerPage;
    const to = from + notesPerPage - 1;

    try {
      let supabaseQuery = client
        .from('notes')
        .select('id, user_id, title, updated_at')
        .eq('user_id', user.value.id)
        .order('updated_at', { ascending: false });

      if (query && query.trim() !== '') {
        const escapedQuery = query.trim()
          .replace(/[!&|:()']/g, '\$&')
          .split(/\s+/)
          .map(term => `${term}:*`)
          .join(' & ');
        
        supabaseQuery = supabaseQuery.textSearch('search_vector', escapedQuery, {
          config: 'english'
        });
        hasMoreNotes.value = false;
      } else {
         supabaseQuery = supabaseQuery.range(from, to);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      const fetchedNotes = data || [];
      if (loadMore && (!query || query.trim() === '')) {
        notes.value.push(...fetchedNotes);
      } else {
        notes.value = fetchedNotes;
      }

      if (!query || query.trim() === '') {
        hasMoreNotes.value = fetchedNotes.length === notesPerPage;
      }

      if (!loadMore && selectedNote.value?.id) {
          const stillExists = notes.value.some(n => n.id === selectedNote.value?.id);
          if (!stillExists) {
              selectedNote.value = null;
              originalSelectedNote.value = null;
              currentEditorContent.value = ''; // Reset editor content
          }
      }

    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.add({ title: 'Error fetching notes', description: (error as Error).message, color: 'error', duration: 5000 });
      if (!loadMore) notes.value = [];
      hasMoreNotes.value = false;
    } finally {
      if (loadMore) {
        loadingMore.value = false;
      } else {
        loading.value = false;
      }
    }
  };

  // Watcher for User State
  watch(user, (currentUser, previousUser) => {
    if (currentUser && !previousUser) {
      fetchNotes(false);
    } else if (!currentUser && previousUser) {
      notes.value = [];
      selectedNote.value = null;
      originalSelectedNote.value = null;
      currentEditorContent.value = ''; // Reset editor content
      router.push('/login');
    }
  }, { immediate: true });

  // Debounce the fetchNotes call
  const debouncedFetchNotes = debounce((query: string | null) => {
    fetchNotes(false, query);
  }, 500);

  watch(searchQuery, (newQuery, oldQuery) => {
    const trimmedQuery = newQuery ? newQuery.trim() : '';
    const trimmedOldQuery = oldQuery ? oldQuery.trim() : '';

    if (trimmedQuery.length >= 3) {
      debouncedFetchNotes(trimmedQuery);
    } else if (trimmedOldQuery.length >= 3 && trimmedQuery.length < 3) {
      debouncedFetchNotes(null);
    } else if (trimmedQuery === '' && trimmedOldQuery !== '') {
       debouncedFetchNotes(null);
    }
  });

  // Select Note
  const selectNote = async (noteStub: Note | null) => {
    // If switching to a different note and the current one is dirty, save it silently.
    if (isNoteDirty.value && selectedNote.value?.id !== noteStub?.id) {
      await saveNote(true);
    }

    if (!isLoggedIn.value || !user.value) return;

    if (!noteStub) {
      selectedNote.value = null;
      originalSelectedNote.value = null;
      currentEditorContent.value = ''; // Reset editor content
      return;
    }

    // Avoid reloading the same note if it's already fully loaded.
    if (selectedNote.value?.id === noteStub.id && typeof selectedNote.value.content === 'string') {
      return;
    }

    // Function to set the selected note state
    const setSelection = (note: Note) => {
      selectedNote.value = note;
      originalSelectedNote.value = JSON.parse(JSON.stringify(note));
      currentEditorContent.value = note.content; // Initialize live content
    };

    // If the passed note stub doesn't have full content, fetch it.
    if (typeof noteStub.content !== 'string') {
      loading.value = true;
      try {
        const { data: fullNote, error } = await client
          .from('notes')
          .select('*')
          .eq('id', noteStub.id!)
          .eq('user_id', user.value.id)
          .single();

        if (error) throw error;
        if (!fullNote) throw new Error('Note not found');

        // Update the main notes list with the full content
        const index = notes.value.findIndex(n => n.id === fullNote.id);
        if (index !== -1) {
          notes.value[index] = fullNote;
        }
        
        setSelection(fullNote);

      } catch (error) {
        console.error('Error fetching full note:', error);
        toast.add({ title: 'Error loading note', description: (error as Error).message, color: 'error', duration: 5000 });
        selectedNote.value = null;
        originalSelectedNote.value = null;
        currentEditorContent.value = ''; // Reset editor content
      } finally {
        loading.value = false;
      }
    } else {
      // If the note stub already has full content (e.g., after creating a new note).
      setSelection(noteStub);
    }
  };

  // Create New Note
  const createNewNote = () => {
    if (!isLoggedIn.value || !user.value) return;

    const tempNewNote: Note = {
      id: null,
      user_id: user.value!.id,
      title: '',
      content: '', // Initialize as empty string
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    selectedNote.value = tempNewNote;
    originalSelectedNote.value = JSON.parse(JSON.stringify(tempNewNote));
    currentEditorContent.value = ''; // Reset editor content
    // isMobile check will be handled by the component
  };

  // Save Note (Insert or Update)
  const saveNote = async (silent = false) => {
    if (!selectedNote.value || !isLoggedIn.value || isSaveDisabled.value) return;

    loading.value = true;

    try {
      // Ensure selectedNote.value.content is updated with the latest from the editor
      if (selectedNote.value) {
        selectedNote.value.content = currentEditorContent.value;
      }

      const { data: savedNote, error } = await client.functions.invoke('save-note', {
        body: { note: selectedNote.value },
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message);
      }

      if (savedNote) {
        const index = notes.value.findIndex(n => n.id === savedNote.id);
        if (index !== -1) {
          notes.value[index] = savedNote;
        } else {
          notes.value.unshift(savedNote);
        }

        selectedNote.value = savedNote;
        originalSelectedNote.value = JSON.parse(JSON.stringify(savedNote));
        currentEditorContent.value = savedNote.content; // Update live content after save

        if (!silent) {
          toast.add({ title: 'Note saved!', icon: 'i-heroicons-check-circle', color: 'success', duration: 2000 });
        }

      } else {
        throw new Error('Failed to retrieve saved note data.');
      }

    } catch (error) {
      console.error('Error saving note:', error);
      toast.add({ title: 'Error saving note', description: (error as Error).message, color: 'error', duration: 5000 });
    } finally {
      loading.value = false;
    }
  };

  // Delete Note
  const deleteNote = () => {
    if (!selectedNote.value?.id || !isLoggedIn.value) return;
    isDeleteModalOpen.value = true;
  };

  // Confirm Delete Note
  const confirmDeleteNote = async () => {
    if (!selectedNote.value?.id || !isLoggedIn.value) return;

    loading.value = true;
    const noteIdToDelete = selectedNote.value.id;

    try {
      const { error } = await client
        .from('notes')
        .delete()
        .eq('id', noteIdToDelete);

      if (error) throw error;

      notes.value = notes.value.filter(note => note.id !== noteIdToDelete);

      selectedNote.value = null;
      originalSelectedNote.value = null;
      currentEditorContent.value = ''; // Reset editor content
      isDeleteModalOpen.value = false;
      toast.add({ title: 'Note deleted', icon: 'i-heroicons-trash', color: 'info', duration: 2000 });

    } catch (error) {
      console.error('Error deleting note:', error);
      toast.add({ title: 'Error deleting note', description: (error as Error).message, color: 'error', duration: 5000 });
    } finally {
      loading.value = false;
    }
  };

  return {
    notes,
    selectedNote,
    originalSelectedNote,
    loading,
    loadingMore,
    isDeleteModalOpen,
    searchQuery,
    hasMoreNotes,
    isNoteDirty,
    isTitleTooLong,
    isSaveDisabled,
    TITLE_MAX_LENGTH,
    CONTENT_MAX_LENGTH,
    formatDate,
    fetchNotes,
    selectNote,
    createNewNote,
    saveNote,
    deleteNote,
    confirmDeleteNote,
    currentEditorContent, // Expose currentEditorContent
  };
}
