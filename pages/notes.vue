<template>
  <!-- Main container with flex column layout -->
  <div class="flex flex-col h-screen overflow-hidden">
    <AppHeader :is-mobile="isMobile" @toggle-sidebar="toggleSidebar" />

    <!-- Main content area with flex row layout -->
    <div class="flex flex-1 overflow-hidden relative">

      <!-- Sidebar with transition - wrapped in ClientOnly to prevent hydration issues -->
      <ClientOnly>
        <transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="transform -translate-x-full opacity-0"
          enter-to-class="transform translate-x-0 opacity-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="transform translate-x-0 opacity-100"
          leave-to-class="transform -translate-x-full opacity-0"
        >
          <!-- Sidebar itself - conditional rendering/styling based on mobile/open state -->
          <aside 
             v-if="sidebarOpen || !isMobile" 
             class="flex flex-col w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto"
             :class="{ 'absolute inset-y-0 left-0 z-30': isMobile && sidebarOpen }" 
             @click.self="isMobile ? sidebarOpen = false : null" 
        >
          <!-- Sidebar Header -->
          <div class="flex flex-col p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">My Notes</h3>
            <ClientOnly>
              <UButton label="New Note" @click.prevent="createNewNote" :loading="loading" block icon="i-heroicons-plus-circle"/>
              <template #fallback>
                <!-- Optional: Add a placeholder skeleton or similar -->
                <USkeleton class="h-8 w-full" /> 
              </template>
            </ClientOnly>
          </div>

          <!-- Notes List -->
          <div class="flex-1 p-2 space-y-1 overflow-y-auto">
            <template v-if="notes.length">
              <!-- Using button/div for list items for easier styling/event handling -->
              <button 
                v-for="note in notes" 
                :key="note.id!" 
                @click.prevent="selectNote(note)" 
                :disabled="loading && selectedNote?.id === note.id"
                class="w-full text-left p-2 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                :class="[
                  selectedNote?.id === note.id 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 font-semibold' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                ]"
              >
                <span class="block text-sm font-medium truncate">{{ note.title || 'Untitled Note' }}</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1">{{ formatDate(note.updated_at) }}</span>
              </button>
            </template>
            <!-- Empty/Loading States -->
            <p v-else-if="!loading" class="px-2 py-4 text-sm text-center text-gray-500 dark:text-gray-400">No notes yet.</p>
            <div v-else class="px-2 py-4 space-y-2">
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-10 w-full" />
            </div>
<!-- Load More Button -->
            <div v-if="hasMoreNotes && notes.length > 0" class="p-2 text-center">
              <UButton
                variant="soft"
                @click="fetchNotes(true)"
                :loading="loadingMore"
                :disabled="loadingMore"
                label="Load More Notes"
                block
                icon="i-heroicons-arrow-down-circle"
              />
            </div>
          </div>
        </aside>
        </transition>
        <template #fallback>
          <!-- Empty fallback to prevent flash -->
        </template>
      </ClientOnly>

      <!-- Editor Area -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-800">
        <!-- Show form only if a note is selected -->
        <template v-if="selectedNote">
          <UForm :state="selectedNote" @submit.prevent="saveNote" class="space-y-4">
            <!-- Title Input -->
            <UFormField label="Title" name="title">
              <UInput 
                v-model="selectedNote.title" 
                required 
                :disabled="loading" 
                :maxlength="TITLE_MAX_LENGTH"
                placeholder="Note Title"
              />
              <span class="text-xs text-gray-400 mt-1 block">{{ selectedNote.title?.length || 0 }} / {{ TITLE_MAX_LENGTH }}</span>
              <template #error>
                 <span v-if="isTitleTooLong" class="text-red-500 text-xs">Title cannot exceed {{ TITLE_MAX_LENGTH }} characters.</span>
              </template>
            </UFormField>

            <!-- Content Textarea -->
            <UFormField label="Content" name="content">
              <UTextarea 
                v-model="selectedNote.content" 
                :rows="10" 
                :disabled="loading" 
                :maxlength="CONTENT_MAX_LENGTH"
                placeholder="Start writing your note..."
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-primary-500"
              />
              <span class="text-xs text-gray-400 mt-1 block">{{ selectedNote.content?.length || 0 }} / {{ CONTENT_MAX_LENGTH }}</span>
              <template #error>
                <span v-if="isContentTooLong" class="text-red-500 text-xs">Content cannot exceed {{ CONTENT_MAX_LENGTH }} characters.</span>
               </template>
            </UFormField>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
               <!-- Status Message -->
               <!-- Removed statusMessage paragraph -->
               
              <UButton 
                type="button" 
                label="Delete Note" 
                color="error" 
                variant="soft" 
                @click="deleteNote" 
                :disabled="!selectedNote.id || loading" 
                :loading="loading && selectedNote?.id === originalSelectedNote?.id" 
                icon="i-heroicons-trash" 
              />
              <UButton 
                type="submit" 
                label="Save Note" 
                :disabled="isSaveDisabled" 
                :loading="loading && selectedNote?.id === originalSelectedNote?.id" 
                icon="i-heroicons-check-circle" 
              />
            </div>
          </UForm>
        </template>
        <!-- Placeholder when no note is selected -->
        <div v-else class="flex items-center justify-center h-full">
          <p class="text-lg text-gray-500 dark:text-gray-400 italic">Select a note or create a new one.</p>
        </div>
      </main>

      <!-- Mobile Overlay for Sidebar -->
      <div 
        v-if="isMobile && sidebarOpen" 
        class="fixed inset-0 z-20 bg-[rgba(0,0,0,0.1)]" 
        @click="sidebarOpen = false"
      ></div>

    </div>
<!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" :ui="{ footer: 'justify-end' }">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
      </template>

      <template #body>
        <p class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete the note titled "<strong>{{ selectedNote?.title || 'Untitled Note' }}</strong>"?
          <br>
          This action cannot be undone.
        </p>
      </template>

      <template #footer>
        <UButton label="Cancel" color="neutral" variant="outline" @click="isDeleteModalOpen = false" :disabled="loading" />
        <UButton label="Confirm Delete" color="error" @click="confirmDeleteNote" :loading="loading" icon="i-heroicons-trash" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// --- Imports and Setup --- (Largely unchanged)
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { type Note } from '~/types'; // Import the Note type
// AppHeader auto-imported by Nuxt
import type { Database } from '~/types/database.types'; // Import generated DB types
import { useToast } from '#imports' // Added import

// --- Responsive Sidebar State ---
// Initialize with SSR-safe defaults that prevent flash
const sidebarOpen = ref(false); // Always start closed to prevent flash
const isMobile = ref(true); // Default to mobile for SSR to prevent flash

const checkMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 768; // Use md breakpoint
    // Default sidebar state based on mobile status
    if (!isMobile.value) sidebarOpen.value = true; 
    else sidebarOpen.value = false; // Closed by default on mobile
  }
};

// --- Supabase Setup --- (Unchanged)
const router = useRouter();
const client = useSupabaseClient<Database>();
const user = useSupabaseUser();
const isLoggedIn = computed(() => !!user.value);

// --- Reactive State --- (Unchanged)
const notes = ref<Note[]>([]);
const selectedNote = ref<Note | null>(null);
const originalSelectedNote = ref<Note | null>(null); // For dirty checking
const loading = ref(false); // For initial load or major actions (save/delete/select)
const loadingMore = ref(false); // Specifically for loading more notes
// Removed statusMessage ref
const isDeleteModalOpen = ref(false); // State for delete confirmation modal
const toast = useToast() // Initialize toast
const currentPage = ref(1);
const notesPerPage = 30; // Number of notes to fetch per page
const hasMoreNotes = ref(true); // Assume there might be more notes initially

// --- Computed Properties for Validation/State --- (Modified)
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
  const titleLength = selectedNote.value?.title?.length;
  return typeof titleLength === 'number' && titleLength > TITLE_MAX_LENGTH -1;
});

const isContentTooLong = computed(() => {
  const contentLength = selectedNote.value?.content?.length;
  return typeof contentLength === 'number' && contentLength > CONTENT_MAX_LENGTH -1;
});

const isSaveDisabled = computed(() => {
  // Disable if loading, title/content too long, or (if it's an existing note) it's not dirty
  return loading.value ||
         isTitleTooLong.value ||
         isContentTooLong.value ||
         (!!selectedNote.value?.id && !isNoteDirty.value); // Only check dirty for existing notes
});

// --- Utility Functions --- (Unchanged)
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

// --- Core Logic Functions (CRUD, Select, Toggle) --- (Unchanged)

// Fetch notes function with pagination
const fetchNotes = async (loadMore = false) => {
  if (!isLoggedIn.value || !user.value || (loadMore && !hasMoreNotes.value)) return; // Check login and if more notes exist

  if (loadMore) {
    loadingMore.value = true;
    currentPage.value++;
  } else {
    loading.value = true; // Use main loading for initial fetch/refresh
    currentPage.value = 1;
    notes.value = []; // Clear existing notes for a fresh load
    hasMoreNotes.value = true; // Reset assumption
    selectedNote.value = null; // Deselect note on refresh
    originalSelectedNote.value = null;
  }

  const from = (currentPage.value - 1) * notesPerPage;
  const to = from + notesPerPage - 1;

  try {
    const { data, error } = await client
      .from('notes')
      .select('id, user_id, title, updated_at') // Select only necessary fields
      .eq('user_id', user.value.id)
      .order('updated_at', { ascending: false })
      .range(from, to); // Apply pagination range

    if (error) throw error;

    const fetchedNotes = data || [];
    if (loadMore) {
      notes.value.push(...fetchedNotes); // Append new notes
    } else {
      notes.value = fetchedNotes; // Replace notes for initial load
    }

    // Update hasMoreNotes flag
    hasMoreNotes.value = fetchedNotes.length === notesPerPage;

    // No need to clear status message anymore

    // If a note was selected previously, check if its stub still exists after refresh (not loadMore)
    if (!loadMore && selectedNote.value?.id) {
        const stillExists = notes.value.some(n => n.id === selectedNote.value?.id);
        if (!stillExists) {
            selectedNote.value = null;
            originalSelectedNote.value = null;
        }
    }

  } catch (error) {
    console.error('Error fetching notes:', error);
    // Toast is already added on the next line for errors
    toast.add({ title: 'Error fetching notes', description: (error as Error).message, color: 'error', duration: 5000 });
    if (!loadMore) notes.value = []; // Clear notes on initial load error
    hasMoreNotes.value = false; // Stop trying to load more on error
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
  if (currentUser && !previousUser) { // User logged in
    fetchNotes(false); // Fetch initial page
  } else if (!currentUser && previousUser) { // User logged out
    notes.value = [];
    selectedNote.value = null;
    originalSelectedNote.value = null;
    router.push('/login'); // Redirect to login on logout
  }
}, { immediate: true }); // Run immediately to fetch notes if already logged in

// --- Lifecycle Hooks ---
// Use immediate execution for client-side
if (process.client) {
  checkMobile();
}

onMounted(() => {
  // Re-check in case it wasn't set properly
  checkMobile();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkMobile);
  }
  // Initial fetch is handled by the user watcher
});

// --- Select Note --- (MODIFIED: Fetch full content on demand)
const selectNote = async (noteStub: Note | null) => { // Allow null to deselect
  if (!noteStub) {
    selectedNote.value = null;
    originalSelectedNote.value = null;
    // No status message to clear
    return;
  }

  // If the note is already selected and fully loaded, do nothing
  if (selectedNote.value?.id === noteStub.id && typeof selectedNote.value.content === 'string') {
      if (isMobile.value) sidebarOpen.value = false; // Still close sidebar on mobile
      return;
  }

  // Check if content is already loaded (simple check assumes content is string)
  // We use the stub from the list first
  selectedNote.value = noteStub; 
  originalSelectedNote.value = JSON.parse(JSON.stringify(noteStub)); // Keep a copy of the stub initially
  // No status message to clear

  if (typeof noteStub.content !== 'string') { // Content not loaded yet
      loading.value = true;
      try {
          const { data: fullNote, error } = await client
              .from('notes')
              .select('*') // Fetch all columns for the selected note
              .eq('id', noteStub.id!)
              .single();

          if (error) throw error;
          if (!fullNote) throw new Error('Note not found');

          // Update the selected note and its original copy with full data
          selectedNote.value = fullNote;
          originalSelectedNote.value = JSON.parse(JSON.stringify(fullNote));
          // No status message to clear

          // Update the note in the main list as well so we don't fetch again
          const index = notes.value.findIndex(n => n.id === fullNote.id);
          if (index !== -1) {
              notes.value[index] = fullNote;
          }

      } catch (error) {
          console.error('Error fetching full note:', error);
          // Toast is already added on the next line for errors
          toast.add({ title: 'Error loading note', description: (error as Error).message, color: 'error', duration: 5000 }); // <-- MODIFIED color
          selectedNote.value = null; // Deselect on error
          originalSelectedNote.value = null;
      } finally {
          loading.value = false;
      }
  }

  // Close sidebar on mobile after selection or load attempt
  if (isMobile.value) {
    sidebarOpen.value = false;
  }
};

// --- Create New Note --- (MODIFIED: Creates temporary local note)
const createNewNote = () => {
  if (!isLoggedIn.value || !user.value) return;

  // Create a temporary note object without an ID
  const tempNewNote: Note = {
    // No id, created_at, updated_at yet
    id: null, // Explicitly null to signify it's new
    user_id: user.value!.id, // Add non-null assertion
    title: '', // Start with empty title
    content: '', // Start with empty content
    created_at: new Date().toISOString(), // Temporary, will be set by DB
    updated_at: new Date().toISOString(), // Temporary, will be set by DB
  };

  // Set the selected note to this temporary object
  selectedNote.value = tempNewNote;
  // Set original to a copy for dirty checking (representing the initial empty state)
  originalSelectedNote.value = JSON.parse(JSON.stringify(tempNewNote));
  // No status message to clear

  // Close sidebar on mobile if open
  if (isMobile.value) sidebarOpen.value = false;
};

// --- Save Note (Insert or Update) --- (MODIFIED)
const saveNote = async () => {
  if (!selectedNote.value || !isLoggedIn.value || isSaveDisabled.value) return; // Use isSaveDisabled computed

  loading.value = true;

  const noteToUpdate = {
    title: selectedNote.value.title,
    content: selectedNote.value.content,
    // updated_at will be set by the database trigger/default
  };

  try {
    let savedNoteData: Note | null = null;
    let operationError: Error | null = null;

    if (selectedNote.value.id) {
      // --- UPDATE existing note ---
      const { data, error } = await client
        .from('notes')
        .update({ ...noteToUpdate, updated_at: new Date().toISOString() }) // Explicitly set updated_at on update
        .eq('id', selectedNote.value.id)
        .select()
        .single();
      savedNoteData = data;
      operationError = error as Error | null; // Cast SupabaseError
    } else {
      // --- INSERT new note ---
      const noteToInsert = {
        user_id: user.value!.id, // Add non-null assertion
        title: selectedNote.value.title || 'Untitled Note', // Use default if empty
        content: selectedNote.value.content,
      };
      const { data, error } = await client
        .from('notes')
        .insert(noteToInsert)
        .select()
        .single();
      savedNoteData = data;
      operationError = error as Error | null; // Cast SupabaseError
    }

    if (operationError) throw operationError;

    if (savedNoteData) {
      if (selectedNote.value.id) {
        // Update existing note in the list
        // Update existing note in the list (or add if somehow missing)
        const index = notes.value.findIndex(n => n.id === savedNoteData!.id);
        if (index !== -1) {
          notes.value[index] = savedNoteData;
        } else {
          // If the updated note wasn't in the currently loaded pages, add it to the top
          notes.value.unshift(savedNoteData);
        }
      } else {
        // Add new note to the beginning of the list
        notes.value.unshift(savedNoteData);
        // Potentially reset pagination if desired, or just let it be at the top
      }

      // TASK 2: Update selection with saved data to keep editor open
      selectNote(savedNoteData); // New behavior: Keep editor open with updated data
      toast.add({ title: 'Note saved!', icon: 'i-heroicons-check-circle', color: 'success', duration: 2000 })

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

// --- Delete Note --- (Logic mostly unchanged, relies on selectedNote.id)
const deleteNote = () => {
  // Open the confirmation modal instead of using confirm()
  if (!selectedNote.value?.id || !isLoggedIn.value) return;
  isDeleteModalOpen.value = true;
};

// --- Confirm Delete Note --- (Logic unchanged)
const confirmDeleteNote = async () => {
  if (!selectedNote.value?.id || !isLoggedIn.value) return;

  loading.value = true; // Use main loading indicator
  const noteIdToDelete = selectedNote.value.id; // Store ID before potentially clearing selection

  try {
    const { error } = await client
      .from('notes')
      .delete()
      .eq('id', noteIdToDelete);

    if (error) throw error;

    // Remove the note from the local list
    notes.value = notes.value.filter(note => note.id !== noteIdToDelete);

    // Clear selection
    selectedNote.value = null;
    originalSelectedNote.value = null;
    isDeleteModalOpen.value = false; // Close modal
    // Toast is added on the next line for success
    toast.add({ title: 'Note deleted', icon: 'i-heroicons-trash', color: 'info', duration: 2000 }); // Use info color

    // Optionally: Check if we need to load more notes if the list becomes too short
    // This might be complex, could be simpler to let the user click "Load More" if needed.

  } catch (error) {
    console.error('Error deleting note:', error);
    // Toast is added on the next line for errors
    toast.add({ title: 'Error deleting note', description: (error as Error).message, color: 'error', duration: 5000 });
  } finally {
    loading.value = false;
  }
};

// --- Sidebar Toggle ---
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

</script>

<style scoped>
/* Add any component-specific styles here */
/* Ensure sidebar has a max-height or similar if content might overflow */
aside {
  max-height: calc(100vh - 4rem); /* Adjust based on header height */
}
</style>
