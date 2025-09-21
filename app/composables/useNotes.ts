import { ref, computed, watch, onScopeDispose } from 'vue';
import { useRouter } from 'vue-router';
import { type Note } from '~/types';
import type { Database } from '~/types/database.types';
import { useToast } from '#imports';
import debounce from 'lodash-es/debounce';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useOnline } from '@vueuse/core';

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

  // --- Offline Support ---
  const isOnline = useOnline();
  const {
    getCachedNotes,
    getCachedNoteById,
    cacheNotesBulk,
    cacheNote,
    removeCachedNote,
    enqueue,
    readQueueFIFO,
    clearQueueItems,
    replaceLocalId,
  } = useOfflineNotes();
  // Background prefetcher for full note content
  const { schedulePrefetchForUser } = useNotesPrefetch();
  const syncing = ref(false);
  const genLocalId = () => `local-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;

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
  // Limit visible characters to 5000 for frontend, but DB allows up to 10000 (HTML included)
  const CONTENT_MAX_LENGTH = 5000;

  const isTitleTooLong = computed(() => {
    return (selectedNote.value?.title?.length ?? 0) >= TITLE_MAX_LENGTH;
  });

  const isContentTooLong = computed(() => {
    return (currentEditorContent.value?.length ?? 0) >= CONTENT_MAX_LENGTH;
  });

  const isSaveDisabled = computed(() => {
    return loading.value ||
           isTitleTooLong.value ||
           isContentTooLong.value ||
           !selectedNote.value?.title?.trim() ||
           (!!selectedNote.value?.id && !isNoteDirty.value);
  });

  // --- Realtime Subscriptions ---
  let channel: RealtimeChannel | null = null;

  const subscribeToNotes = (uid: string) => {
    // Clean up existing channel if any
    if (channel) {
      client.removeChannel(channel);
      channel = null;
    }

    channel = client
      .channel(`notes:${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${uid}` },
        (payload: any) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const newRow = payload.new as Note | null;
          const oldRow = payload.old as Note | null;

          if (eventType === 'INSERT' && newRow) {
            const exists = notes.value.some(n => n.id === newRow.id);
            if (!exists) {
              notes.value.unshift(newRow);
            }
          }

          if (eventType === 'UPDATE' && newRow) {
            const i = notes.value.findIndex(n => n.id === newRow.id);
            if (i !== -1) {
              notes.value[i] = { ...notes.value[i], ...newRow } as Note;
            }
            if (selectedNote.value?.id === newRow.id) {
              selectedNote.value = { ...(selectedNote.value as Note), ...newRow } as Note;
              currentEditorContent.value = selectedNote.value.content ?? '';
            }
          }

          if (eventType === 'DELETE' && oldRow) {
            const id = oldRow.id;
            notes.value = notes.value.filter(n => n.id !== id);
            if (selectedNote.value?.id === id) {
              selectedNote.value = null;
              originalSelectedNote.value = null;
              currentEditorContent.value = '';
            }
          }
        }
      )
      .subscribe();
  };

  watch(
    () => user.value?.id,
    (uid) => {
      if (uid) {
        subscribeToNotes(uid);
      } else if (channel) {
        client.removeChannel(channel);
        channel = null;
      }
    },
    { immediate: true }
  );

  onScopeDispose(() => {
    if (channel) {
      client.removeChannel(channel);
      channel = null;
    }
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

    // Offline: serve from cache
    if (!isOnline.value) {
      try {
        const cached = await getCachedNotes(user.value.id);
        notes.value = query ? cached.filter(n => n.title?.toLowerCase().includes((query || '').toLowerCase())) : cached;
        hasMoreNotes.value = false;
      } finally {
        if (loadMore) {
          loadingMore.value = false;
        } else {
          loading.value = false;
        }
      }
      return;
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

      // Update cache with the latest list (partial: id/title/updated_at)
      // We preserve any locally cached content entries; this bulk put keeps index up to date.
      await cacheNotesBulk(fetchedNotes as unknown as Note[]);

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

      // Defer background prefetch of full note content (cap 100) to idle on fast networks
      if (!loadMore && (!query || query.trim() === '')) {
        try {
          schedulePrefetchForUser(user.value.id, 100);
        } catch {}
      }

    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.add({ title: 'Error fetching notes', description: (error as Error).message, color: 'error', duration: 5000 });
      // Fallback to cache when online fetch fails
      try {
        const cached = await getCachedNotes(user.value!.id);
        notes.value = cached;
        hasMoreNotes.value = false;
      } catch {}
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
      currentEditorContent.value = note.content || ''; // Initialize live content
    };

    // If the passed note stub doesn't have full content, fetch it.
    if (typeof noteStub.content !== 'string') {
      // Offline path: hydrate from cache
      if (!isOnline.value) {
        const cached = await getCachedNoteById(noteStub.id!);
        if (cached) {
          setSelection(cached);
          return;
        }
        // Fallback: set minimal selection
        setSelection({ ...noteStub, content: '' } as Note);
        return;
      }
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
        await cacheNote(fullNote as Note);

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

      // If offline, cache and queue
      if (!isOnline.value) {
        const nowIso = new Date().toISOString();
        // Assign a local id for new notes
        if (!selectedNote.value.id) {
          selectedNote.value.id = genLocalId();
          selectedNote.value.created_at = nowIso;
        }
        selectedNote.value.updated_at = nowIso;

        // Update in-memory list optimistically
        const existingIdx = notes.value.findIndex(n => n.id === selectedNote.value!.id);
        if (existingIdx !== -1) {
          notes.value[existingIdx] = { ...(selectedNote.value as Note) };
        } else {
          notes.value.unshift({ ...(selectedNote.value as Note) });
        }

        await cacheNote(selectedNote.value as Note);
        await enqueue({
          id: genLocalId(),
          user_id: user.value!.id,
          type: (selectedNote.value as Note).id?.startsWith('local-') && originalSelectedNote.value?.id === null ? 'create' : 'update',
          note: selectedNote.value as Note,
          timestamp: Date.now(),
        });

        originalSelectedNote.value = JSON.parse(JSON.stringify(selectedNote.value));
        if (!silent) {
          toast.add({ title: 'Saved locally (offline)', icon: 'i-lucide-wifi-off', color: 'info', duration: 2500 });
        }
        return;
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

        // Update cache with saved note
        await cacheNote(savedNote as Note);

        if (!silent) {
          toast.add({ title: 'Note saved!', icon: 'i-lucide-check-circle', color: 'success', duration: 2000 });
        }

      } else {
        throw new Error('Failed to retrieve saved note data.');
      }

    } catch (error) {
      console.error('Error saving note:', error);
      // Fallback to offline on network/server error
      try {
        const nowIso = new Date().toISOString();
        if (!selectedNote.value!.id) {
          selectedNote.value!.id = genLocalId();
          selectedNote.value!.created_at = nowIso;
        }
        selectedNote.value!.updated_at = nowIso;
        await cacheNote(selectedNote.value as Note);
        await enqueue({
          id: genLocalId(),
          user_id: user.value!.id,
          type: (selectedNote.value as Note).id!.startsWith('local-') && originalSelectedNote.value?.id === null ? 'create' : 'update',
          note: selectedNote.value as Note,
          timestamp: Date.now(),
        });
        originalSelectedNote.value = JSON.parse(JSON.stringify(selectedNote.value));
        toast.add({ title: 'Saved locally (will sync)', icon: 'i-lucide-wifi-off', color: 'info', duration: 2500 });
      } catch (e) {
        toast.add({ title: 'Error saving note', description: (error as Error).message, color: 'error', duration: 5000 });
      }
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
    // Derive a non-null user id for type safety
    const uid = user.value?.id;
    if (!uid) {
      // Should not happen due to guard above, but keeps TS and runtime safe
      loading.value = false;
      return;
    }

    try {
      // Offline delete: update state/cache/queue only
      if (!isOnline.value) {
        notes.value = notes.value.filter(note => note.id !== noteIdToDelete);
        await removeCachedNote(noteIdToDelete);
        // Remove any queued create/update for this note
        const items = await readQueueFIFO(uid);
        const idsToClear = items.filter(i => (i.note?.id === noteIdToDelete) || (i.note_id === noteIdToDelete)).map(i => i.id);
        await clearQueueItems(idsToClear);
        await enqueue({ id: genLocalId(), user_id: uid, type: 'delete', note_id: noteIdToDelete, timestamp: Date.now() });

        selectedNote.value = null;
        originalSelectedNote.value = null;
        currentEditorContent.value = '';
        isDeleteModalOpen.value = false;
        toast.add({ title: 'Deleted locally (offline)', icon: 'i-lucide-wifi-off', color: 'info', duration: 2000 });
        return;
      }

      const { error } = await client
        .from('notes')
        .delete()
        .eq('id', noteIdToDelete)
        .eq('user_id', uid);

      if (error) throw error;

      notes.value = notes.value.filter(note => note.id !== noteIdToDelete);
      await removeCachedNote(noteIdToDelete);

      selectedNote.value = null;
      originalSelectedNote.value = null;
      currentEditorContent.value = ''; // Reset editor content
      isDeleteModalOpen.value = false;
      toast.add({ title: 'Note deleted', icon: 'i-lucide-trash', color: 'info', duration: 2000 });

    } catch (error) {
      console.error('Error deleting note:', error);
      toast.add({ title: 'Error deleting note', description: (error as Error).message, color: 'error', duration: 5000 });
    } finally {
      loading.value = false;
    }
  };

  // Sync queue when coming online
  const syncPendingQueue = async () => {
    if (!isOnline.value || !isLoggedIn.value || !user.value || syncing.value) return;
    syncing.value = true;
    try {
      const uid = user.value.id;
      const items = await readQueueFIFO(uid);
      // Track id replacements within this run to avoid duplicate creates
      const idMap = new Map<string, string>(); // localId -> serverId
      const processed: string[] = [];
      let skippedAny = false;
      for (const item of items) {
        try {
          // Normalize any local ids using known mappings from earlier in this run
          if (item.note?.id && idMap.has(item.note.id)) {
            item.note.id = idMap.get(item.note.id)!;
          }
          if (item.note_id && idMap.has(item.note_id)) {
            item.note_id = idMap.get(item.note_id)!;
          }

          if (item.type === 'create' && item.note) {
            const localId = item.note.id as string;
            const noteForServer = { ...item.note, id: null } as Note;
            const { data: saved } = await client.functions.invoke('save-note', { body: { note: noteForServer } });
            if (saved?.id) {
              await replaceLocalId(localId, saved.id);
              idMap.set(localId, saved.id);
              // Update in-memory list
              const idx = notes.value.findIndex(n => n.id === localId);
              if (idx !== -1) notes.value[idx] = saved;
              else notes.value.unshift(saved);
              await cacheNote(saved as Note);
              // Update selection if this was the currently selected note
              if (selectedNote.value?.id === localId) {
                selectedNote.value = saved as Note;
                originalSelectedNote.value = JSON.parse(JSON.stringify(saved));
                currentEditorContent.value = (saved as Note).content ?? '';
              }
            }
          }
          if (item.type === 'update' && item.note) {
            // If it's still a local id and we don't yet know its server id, skip for now
            if (item.note.id && item.note.id.startsWith('local-') && !idMap.has(item.note.id)) {
              skippedAny = true;
              continue;
            } else {
              const { data: saved } = await client.functions.invoke('save-note', { body: { note: item.note } });
              if (saved) {
                const idx = notes.value.findIndex(n => n.id === saved.id);
                if (idx !== -1) notes.value[idx] = saved;
                else notes.value.unshift(saved);
                await cacheNote(saved as Note);
                if (selectedNote.value?.id === saved.id) {
                  selectedNote.value = saved as Note;
                  originalSelectedNote.value = JSON.parse(JSON.stringify(saved));
                  currentEditorContent.value = (saved as Note).content ?? '';
                }
              }
            }
          }
          if (item.type === 'delete' && item.note_id) {
            if (item.note_id.startsWith('local-') && !idMap.has(item.note_id)) {
              // If never synced, just ensure removed locally
              await removeCachedNote(item.note_id);
            } else {
              const idToDelete = idMap.get(item.note_id) || item.note_id;
              await client.from('notes').delete().eq('id', idToDelete).eq('user_id', uid);
              await removeCachedNote(item.note_id);
            }
          }
          if (item.type === 'delete-account' && item.data?.confirmation) {
            // Process queued account deletion inline to avoid circular dependency
            const { data, error } = await client.functions.invoke('delete-account', {
              body: { confirmation: item.data.confirmation }
            });
            
            if (data?.success) {
              // Account deletion successful - local cleanup will happen on logout
              console.log('Queued account deletion processed successfully');
            } else {
              console.error('Failed to process queued account deletion:', error);
              // Don't mark as processed so it can be retried
              continue;
            }
          }
          processed.push(item.id);
        } catch (e) {
          // Stop on first failure to preserve order
          break;
        }
      }
      if (processed.length) await clearQueueItems(processed);
      // If we skipped any items (waiting for id mapping), run sync again once
      if (skippedAny && processed.length) {
        // Let the event loop breathe and then re-run
        setTimeout(() => {
          syncPendingQueue();
        }, 0);
      }
    } finally {
      syncing.value = false;
    }
  };

  watch(isOnline, (online) => {
    if (online) {
      syncPendingQueue();
      // Refresh list to ensure server truth wins
      fetchNotes(false, searchQuery.value || null);
    }
  });

  const unsubscribeFromNotes = () => {
    if (channel) {
      client.removeChannel(channel);
      channel = null;
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
    currentEditorContent, // Expose currentEditorContent
    unsubscribeFromNotes,
  };
}
