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

  // --- Computed Properties for Validation/State ---
  const isNoteDirty = computed(() => {
    if (!selectedNote.value) {
      return false;
    }
    // If it's a new note (no ID), it's dirty if title or content is not empty
    if (!selectedNote.value.id) {
      return !!selectedNote.value.title || !!selectedNote.value.content;
    }
    // If it's an existing note, compare with original
    if (!originalSelectedNote.value) return false; // Should not happen if id exists, but safety check
    return (
      selectedNote.value.title !== originalSelectedNote.value.title ||
      selectedNote.value.content !== originalSelectedNote.value.content
    );
  });
  const TITLE_MAX_LENGTH = 255;
  const CONTENT_MAX_LENGTH = 10000;

  const isTitleTooLong = computed(() => {
    return (selectedNote.value?.title?.length ?? 0) >= TITLE_MAX_LENGTH;
  });

  const isContentTooLong = computed(() => {
    return (selectedNote.value?.content?.length ?? 0) >= CONTENT_MAX_LENGTH;
  });

  const isSaveDisabled = computed(() => {
    return loading.value ||
           isTitleTooLong.value ||
           isContentTooLong.value ||
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
          .replace(/[!&|:()']/g, '\\$&')
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
    if (!isLoggedIn.value || !user.value) return;

    if (!noteStub) {
      selectedNote.value = null;
      originalSelectedNote.value = null;
      return;
    }

    if (selectedNote.value?.id === noteStub.id && typeof selectedNote.value.content === 'string') {
        // isMobile check will be handled by the component
        return;
    }

    selectedNote.value = noteStub;
    originalSelectedNote.value = JSON.parse(JSON.stringify(noteStub));

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

            selectedNote.value = fullNote;
            originalSelectedNote.value = JSON.parse(JSON.stringify(fullNote));

            const index = notes.value.findIndex(n => n.id === fullNote.id);
            if (index !== -1) {
                notes.value[index] = fullNote;
            }

        } catch (error) {
            console.error('Error fetching full note:', error);
            toast.add({ title: 'Error loading note', description: (error as Error).message, color: 'error', duration: 5000 });
            selectedNote.value = null;
            originalSelectedNote.value = null;
        } finally {
            loading.value = false;
        }
    }
    // isMobile check will be handled by the component
  };

  // Create New Note
  const createNewNote = () => {
    if (!isLoggedIn.value || !user.value) return;

    const tempNewNote: Note = {
      id: null,
      user_id: user.value!.id,
      title: '',
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    selectedNote.value = tempNewNote;
    originalSelectedNote.value = JSON.parse(JSON.stringify(tempNewNote));
    // isMobile check will be handled by the component
  };

  // Save Note (Insert or Update)
  const saveNote = async () => {
    if (!selectedNote.value || !isLoggedIn.value || isSaveDisabled.value) return;

    loading.value = true;

    const noteToUpdate = {
      title: selectedNote.value.title,
      content: selectedNote.value.content,
    };

    try {
      let savedNoteData: Note | null = null;
      let operationError: Error | null = null;

      if (selectedNote.value.id) {
        const { data, error } = await client
          .from('notes')
          .update({ ...noteToUpdate, updated_at: new Date().toISOString() })
          .eq('id', selectedNote.value.id)
          .select()
          .single();
        savedNoteData = data;
        operationError = error as Error | null;
      } else {
        const noteToInsert = {
          user_id: user.value!.id,
          title: selectedNote.value.title || 'Untitled Note',
          content: selectedNote.value.content,
        };
        const { data, error } = await client
          .from('notes')
          .insert(noteToInsert)
          .select()
          .single();
        savedNoteData = data;
        operationError = error as Error | null;
      }

      if (operationError) throw operationError;

      if (savedNoteData) {
        if (selectedNote.value.id) {
          const index = notes.value.findIndex(n => n.id === savedNoteData!.id);
          if (index !== -1) {
            notes.value[index] = savedNoteData;
          } else {
            notes.value.unshift(savedNoteData);
          }
        } else {
          notes.value.unshift(savedNoteData);
        }

        selectNote(savedNoteData);
        toast.add({ title: 'Note saved!', icon: 'i-heroicons-check-circle', color: 'success', duration: 2000 });

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
    isContentTooLong,
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
  };
}