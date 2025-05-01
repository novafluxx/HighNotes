<template>
  <!-- Main container with flex column layout -->
  <div class="flex flex-col h-screen overflow-hidden">
    <AppHeader :is-mobile="isMobile" @toggle-sidebar="toggleSidebar" />

    <!-- Main content area with flex row layout -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Sidebar with transition -->
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
           v-show="sidebarOpen || !isMobile" 
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
          </div>
        </aside>
      </transition>

      <!-- Editor Area -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-800">
        <!-- Show form only if a note is selected -->
        <template v-if="selectedNote">
          <UForm :state="selectedNote" @submit.prevent="saveNote" class="space-y-4">
            <!-- Title Input -->
            <UFormField label="Title" name="title">
               <template #label>
                 <div class="flex justify-between items-center">
                   <span>Title</span>
                   <span class="text-xs text-gray-500 dark:text-gray-400">{{ selectedNote.title?.length || 0 }} / {{ TITLE_MAX_LENGTH }}</span>
                 </div>
               </template>
              <UInput 
                v-model="selectedNote.title" 
                required 
                :disabled="loading" 
                :maxlength="TITLE_MAX_LENGTH"
                placeholder="Note Title"
              />
              <template #error>
                 <span v-if="isTitleTooLong" class="text-red-500 text-xs">Title cannot exceed {{ TITLE_MAX_LENGTH }} characters.</span>
              </template>
            </UFormField>

            <!-- Content Textarea -->
            <UFormField label="Content" name="content">
               <template #label>
                 <div class="flex justify-between items-center">
                   <span>Content</span>
                   <span class="text-xs text-gray-500 dark:text-gray-400">{{ selectedNote.content?.length || 0 }} / {{ CONTENT_MAX_LENGTH }}</span>
                 </div>
               </template>
              <UTextarea 
                v-model="selectedNote.content" 
                :rows="10" 
                :disabled="loading" 
                :maxlength="CONTENT_MAX_LENGTH"
                placeholder="Start writing your note..."
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-primary-500"
              />
              <template #error>
                <span v-if="isContentTooLong" class="text-red-500 text-xs">Content cannot exceed {{ CONTENT_MAX_LENGTH }} characters.</span>
               </template>
            </UFormField>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
               <!-- Status Message -->
               <p v-if="statusMessage" class="text-sm text-gray-600 dark:text-gray-300 mr-auto self-center">{{ statusMessage }}</p>
               
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
        class="fixed inset-0 bg-black bg-opacity-25 z-20" 
        @click="sidebarOpen = false"
      ></div>

    </div>
  </div>
</template>

<script setup lang="ts">
// --- Imports and Setup --- (Largely unchanged)
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { type Note } from '~/types'; // Import the Note type
// AppHeader auto-imported by Nuxt
import type { Database } from '~/database.types'; // Import generated DB types

// --- Responsive Sidebar State --- (Unchanged)
const sidebarOpen = ref(false);
const isMobile = ref(false);

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
const loading = ref(false);
const statusMessage = ref('');

// --- Computed Properties for Validation/State --- (Modified)
const isNoteDirty = computed(() => {
  if (!selectedNote.value || !originalSelectedNote.value) {
    return false;
  }
  return (
    selectedNote.value.title !== originalSelectedNote.value.title ||
    selectedNote.value.content !== originalSelectedNote.value.content
  );
});

const TITLE_MAX_LENGTH = 255;
const CONTENT_MAX_LENGTH = 10000;

const isTitleTooLong = computed(() => {
  const titleLength = selectedNote.value?.title?.length;
  return typeof titleLength === 'number' && titleLength > TITLE_MAX_LENGTH;
});

const isContentTooLong = computed(() => {
  const contentLength = selectedNote.value?.content?.length;
  return typeof contentLength === 'number' && contentLength > CONTENT_MAX_LENGTH;
});

const isSaveDisabled = computed(() => {
  return !isNoteDirty.value || loading.value || isTitleTooLong.value || isContentTooLong.value;
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

// Fetch notes function
const fetchNotes = async () => {
  if (!isLoggedIn.value || !user.value) return; // Check if user is logged in
  loading.value = true;
  statusMessage.value = 'Loading notes...';
  try {
    const { data, error } = await client
      .from('notes')
      .select('*')
      .eq('user_id', user.value.id) // Fetch only notes for the current user
      .order('updated_at', { ascending: false });

    if (error) throw error;

    notes.value = data || [];
    statusMessage.value = ''; // Clear loading message

    // If a note was selected previously, try to re-select it by id
    if (selectedNote.value) {
      const reselected = notes.value.find(n => n.id === selectedNote.value?.id);
      if (reselected) {
        selectNote(reselected); // Re-apply selection with potentially updated data
      } else {
        selectedNote.value = null; // Deselect if it no longer exists
        originalSelectedNote.value = null;
      }
    } else if (notes.value.length > 0) {
       // Optionally select the first note if none was selected
       // selectNote(notes.value[0]); 
    }

  } catch (error) {
    console.error('Error fetching notes:', error);
    statusMessage.value = 'Error fetching notes.';
    notes.value = []; // Clear notes on error
  } finally {
    loading.value = false;
  }
};

// Watcher for User State
watch(user, (currentUser, previousUser) => {
  if (currentUser && !previousUser) { // User logged in
    fetchNotes();
  } else if (!currentUser && previousUser) { // User logged out
    notes.value = [];
    selectedNote.value = null;
    originalSelectedNote.value = null;
    router.push('/login'); // Redirect to login on logout
  }
}, { immediate: true }); // Run immediately to fetch notes if already logged in

// --- Lifecycle Hooks --- (Unchanged)
onMounted(() => {
  checkMobile();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkMobile);
  }
  // Initial fetch is handled by the user watcher
});

// --- Select Note --- (Unchanged)
const selectNote = (note: Note) => {
  // Simple deep copy for dirty checking comparison
  originalSelectedNote.value = JSON.parse(JSON.stringify(note)); 
  selectedNote.value = note;
  statusMessage.value = ''; // Clear any previous status
  // Close sidebar on mobile after selection
  if (isMobile.value) {
    sidebarOpen.value = false;
  }
};

// --- Create New Note --- (Unchanged logic, adapted for state)
const createNewNote = async () => {
  if (!isLoggedIn.value || !user.value) return;
  loading.value = true;
  statusMessage.value = 'Creating new note...';

  // Define the type for insertion explicitly, excluding fields managed by DB (id, created_at, updated_at)
  // Ensure required fields (user_id, title) are present.
  const newNoteData: { user_id: string; title: string; content: string | null } = {
    user_id: user.value.id,
    title: 'Untitled Note',
    content: '', // Initialize content, can be empty string or null depending on schema
  };

  try {
    // Insert the note
    const { data, error } = await client
      .from('notes')
      .insert(newNoteData)
      .select()
      .single(); // Select the newly created note data

    if (error) throw error;

    if (data) {
        notes.value.unshift(data); // Add to the top of the local list
        selectNote(data); // Select the new note
        statusMessage.value = 'New note created.';
    } else {
        throw new Error('Failed to retrieve new note data after creation.');
    }

  } catch (error) {
    console.error('Error creating new note:', error);
    statusMessage.value = 'Error creating note.';
  } finally {
    loading.value = false;
    setTimeout(() => { if (statusMessage.value === 'New note created.') statusMessage.value = ''; }, 3000);
  }
};

// --- Save Note (Update) --- (Unchanged)
const saveNote = async () => {
  if (!selectedNote.value || !isNoteDirty.value || !isLoggedIn.value) return;

  loading.value = true;
  statusMessage.value = 'Saving...';

  const noteToUpdate = {
    title: selectedNote.value.title,
    content: selectedNote.value.content,
    updated_at: new Date().toISOString(), // Explicitly set updated_at
  };

  try {
    const { data, error } = await client
      .from('notes')
      .update(noteToUpdate)
      .eq('id', selectedNote.value.id!) // Ensure ID is present
      .select()
      .single();

    if (error) throw error;

    if (data) {
      // Update the note in the local list
      const index = notes.value.findIndex(n => n.id === data.id);
      if (index !== -1) {
        notes.value[index] = data;
      }
      // Re-select to update originalSelectedNote for dirty checking
      selectNote(data);
      statusMessage.value = 'Note saved!';
    } else {
      throw new Error('Failed to retrieve updated note data.');
    }

  } catch (error) {
    console.error('Error saving note:', error);
    statusMessage.value = 'Error saving note.';
  } finally {
    loading.value = false;
    setTimeout(() => { if (statusMessage.value === 'Note saved!') statusMessage.value = ''; }, 3000);
  }
};

// --- Delete Note --- (Unchanged)
const deleteNote = async () => {
  if (!selectedNote.value?.id || !isLoggedIn.value) return;

  // Confirmation dialog
  if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
    return;
  }

  loading.value = true;
  statusMessage.value = 'Deleting...';
  const noteIdToDelete = selectedNote.value.id;

  try {
    const { error } = await client
      .from('notes')
      .delete()
      .eq('id', noteIdToDelete);

    if (error) throw error;

    statusMessage.value = 'Note deleted.';
    // Find index and remove from local array *before* deselecting
    const index = notes.value.findIndex(n => n.id === noteIdToDelete);
    if (index !== -1) {
        notes.value.splice(index, 1);
    }
    // Deselect note
    selectedNote.value = null;
    originalSelectedNote.value = null;
    // No need to fetch notes again, already removed locally
    // await fetchNotes(); // Refresh the list - Redundant if spliced correctly
    
  } catch (error) {
    console.error('Error deleting note:', error);
    statusMessage.value = 'Error deleting note.';
  } finally {
    loading.value = false;
    setTimeout(() => { if (statusMessage.value === 'Note deleted.') statusMessage.value = ''; }, 3000);
  }
}

// --- Toggle Sidebar --- (Unchanged)
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
}
</script>
