<template>
  <div class="notes-page">
    <AppHeader :is-mobile="isMobile" @toggle-sidebar="toggleSidebar" /> <!-- Use the shared header component -->
    <div class="main-content">
      <!-- Sidebar with transition -->
      <transition name="sidebar-slide">
        <aside v-show="sidebarOpen || !isMobile" class="sidebar" :class="{ 'mobile': isMobile, 'open': sidebarOpen }" @click.self="isMobile ? sidebarOpen = false : null">
          <div class="sidebar-header">
            <h3>My Notes</h3>
            <button @click.prevent="createNewNote" :aria-busy="loading">New Note</button>
          </div>
          <div class="notes-list" v-if="notes.length">
            <a href="#" v-for="note in notes" :key="note.id!" @click.prevent="selectNote(note)" :aria-busy="loading && selectedNote?.id === note.id" :class="{ 'active': selectedNote?.id === note.id }">
              <span class="note-title">{{ note.title || 'Untitled Note' }}</span>
              <span class="note-date">{{ formatDate(note.updated_at) }}</span>
            </a>
          </div>
          <p v-else-if="!loading" class="no-notes">No notes yet.</p>
          <p v-else aria-busy="true" class="loading-notes">Loading notes...</p>
        </aside>
      </transition>

      <main class="editor-area">
        <article v-if="selectedNote">
          <form @submit.prevent="saveNote">
            <label for="title">
              Title
              <input type="text" id="title" name="title" v-model="selectedNote.title" required :disabled="loading">
              <small v-if="isTitleTooLong" class="error-message">Title cannot exceed {{ TITLE_MAX_LENGTH }} characters.</small>
            </label>
            <label for="content">
              Content
              <textarea id="content" name="content" v-model="selectedNote.content" rows="10" :disabled="loading"></textarea>
              <small v-if="isContentTooLong" class="error-message">Content cannot exceed {{ CONTENT_MAX_LENGTH }} characters.</small>
            </label>
            <div class="grid">
              <button type="submit" :disabled="isSaveDisabled" :aria-busy="loading">Save Note</button>
              <button type="button" class="contrast" @click="deleteNote" :disabled="!selectedNote.id || loading" :aria-busy="loading">Delete Note</button>
              <!-- Optional Spacer -->
              <div></div>
            </div>
            <p v-if="statusMessage">{{ statusMessage }}</p>
          </form>
        </article>
        <div v-else class="placeholder-content">
          <p>Select a note or create a new one.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { type Note } from '~/types'; // Import the Note type
import AppHeader from '~/components/AppHeader.vue';
import type { Database } from '~/database.types'; // Import generated DB types

// Responsive sidebar state
const sidebarOpen = ref(false);
const isMobile = ref(false);

// Watch for window resize to update isMobile
const checkMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 600;
    if (!isMobile.value) sidebarOpen.value = true;
    else sidebarOpen.value = false;
  }
};

// Theme setup
const theme = ref('light');

// === Setup ===
const router = useRouter();

// Use the composables provided by the supabase module (auto-imported)
const client = useSupabaseClient<Database>(); // Add Database generic

// Get reactive user state directly from the Supabase module
const user = useSupabaseUser();

// Define isLoggedIn based on the reactive user ref
const isLoggedIn = computed(() => !!user.value);

// Reactive state
const notes = ref<Note[]>([]);
const selectedNote = ref<Note | null>(null);
const originalSelectedNote = ref<Note | null>(null);
const loading = ref(false);
const statusMessage = ref('');

// Computed property to check if the selected note has changed
const isNoteDirty = computed(() => {
  if (!selectedNote.value || !originalSelectedNote.value) return false;
  return (
    selectedNote.value.title !== originalSelectedNote.value.title ||
    selectedNote.value.content !== originalSelectedNote.value.content
  );
});

// Computed properties for length validation
const isTitleTooLong = computed(() => {
  return selectedNote.value ? selectedNote.value.title.length > TITLE_MAX_LENGTH : false;
});

const isContentTooLong = computed(() => {
  // Check if note exists AND content exists before checking length
  return selectedNote.value && selectedNote.value.content
    ? selectedNote.value.content.length > CONTENT_MAX_LENGTH
    : false;
});

// Combine validation checks for button disabling
const isSaveDisabled = computed(() => {
  return !isNoteDirty.value || loading.value || isTitleTooLong.value || isContentTooLong.value;
});

// Define constants for validation
const TITLE_MAX_LENGTH = 255;
const CONTENT_MAX_LENGTH = 10000;

// Helper function for date formatting
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Example format: 'Sep 26, 2024' - adjust options as needed
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// === Note Fetching ===
// Fetch notes function
const fetchNotes = async () => {
  if (!user.value) {
    return;
  }
  loading.value = true;
  // statusMessage.value = 'Fetching notes...'; // Maybe too noisy
  try {
    const { data, error } = await client
      .from('notes')
      .select('*')
      .eq('user_id', user.value.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }
    // Use double assertion for type safety
    notes.value = data as unknown as Note[] || [];
    if (notes.value.length > 0) {
      // Automatically select the most recently updated note
      if (!selectedNote.value?.id) { // Only auto-select if no note is currently selected
        selectNote(notes.value[0]);
      }
    }
  } catch (error) {
    console.error('Error fetching notes:', error);
    statusMessage.value = 'Failed to load notes.';
  } finally {
    loading.value = false;
  }
}

// --- Watcher for User State --- // NEW
watch(user, (currentUser) => { // Watch the user ref from useSupabaseUser
  if (currentUser) { // Check if the user object exists (is not null)
    // User is logged in, fetch their notes
    fetchNotes();
  } else {
    // If no user, potentially clear notes or handle logged-out state
    notes.value = [];
    selectedNote.value = null;
  }
}, { immediate: true }); // Run immediately on load

// --- Lifecycle Hook ---
// --- Single onMounted Hook ---
onMounted(() => {
  // Theme initialization
  const savedTheme = localStorage.getItem('theme');
  theme.value = savedTheme || 'light';
  document.documentElement.setAttribute('data-theme', theme.value);

  // Resize listener and initial check
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkMobile);
    checkMobile(); // Initial check
    sidebarOpen.value = !isMobile.value; // Set initial sidebar state
  }

  // Cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', checkMobile);
    }
  };
});

// Select note function
const selectNote = (note: Note) => {
  if (loading.value) return; // Prevent changing note while saving/deleting
  selectedNote.value = { ...note }; // Clone to allow editing without modifying the list directly
  originalSelectedNote.value = { ...note }; // Store original for comparison
  statusMessage.value = '';
  // Close sidebar on mobile after selecting a note
  if (isMobile.value) sidebarOpen.value = false;
}

// Create new note function
const createNewNote = async () => {
  if (!user.value) {
    statusMessage.value = 'Error: You must be logged in.';
    return;
  }

  console.log('Attempting to insert note for user ID:', user.value.id);

  const newNoteData: Omit<Note, 'id' | 'created_at' | 'updated_at'> = {
    title: 'Untitled Note',
    content: '',
    user_id: user.value.id, // Add user_id
  };

  loading.value = true;
  try {
    const { data, error } = await client
      .from('notes')
      .insert(newNoteData)
      .select()
      .single(); // Get the inserted record

    if (error) throw error;
    // Ensure data has the expected structure (basic check)
    if (!data || typeof data.id !== 'string') {
      throw new Error('Invalid data returned after creating note.');
    }
    // Cast the returned data to our Note type (via unknown)
    const createdNote = data as unknown as Note;
    // Refresh the list in the sidebar *after* successful creation
    await fetchNotes();
    // Directly select the note we just created using the data returned from Supabase
    selectNote(createdNote);
    statusMessage.value = 'Note created.';
    setTimeout(() => statusMessage.value = '', 3000); // Clear message
  } catch (error) {
    console.error('Error creating note:', error);
    statusMessage.value = 'Error creating note.';
    setTimeout(() => statusMessage.value = '', 3000); // Clear message on error too
  } finally {
    loading.value = false;
  }
}

// Save note function (handles create and update)
const saveNote = async () => {
  if (!selectedNote.value || !user.value) return;
  loading.value = true;
  statusMessage.value = 'Saving...';
  const { id, ...noteDataToSave } = selectedNote.value;
  noteDataToSave.updated_at = new Date().toISOString(); // Always update timestamp
  noteDataToSave.user_id = user.value.id; // Ensure user_id is set

  try {
    let savedNoteData: Note | null = null;
    if (selectedNote.value.id) {
      // Update existing note
      const { data, error } = await client
        .from('notes')
        .update(noteDataToSave) // Pass only data fields, not id
        .eq('id', selectedNote.value.id)
        .select()
        .single(); // Get the updated record
      if (error) throw error;
      // Use double assertion for type safety
      savedNoteData = data as unknown as Note;
    } else {
      // Insert new note
      const { data, error } = await client
        .from('notes')
        .insert(noteDataToSave) // Pass only data fields, not id
        .select()
        .single(); // Get the inserted record
      if (error) throw error;
      // Use double assertion for type safety
      savedNoteData = data as unknown as Note;
    }

    if (savedNoteData) {
      statusMessage.value = 'Note saved.';
      originalSelectedNote.value = null; // Clear original state after successful save
      await fetchNotes(); // Refresh list to show updated timestamp/new note
      selectedNote.value = null; // Clear the selection to hide the editor
      setTimeout(() => statusMessage.value = '', 3000); // Clear message
    }
  } catch (error) {
    console.error('Error saving note:', error);
    statusMessage.value = 'Error saving note.';
  } finally {
    loading.value = false;
  }
}

// Delete note function
const deleteNote = async () => {
  if (!selectedNote.value || !selectedNote.value.id || !user.value) {
    statusMessage.value = 'Cannot delete: Note not selected or user not logged in.';
    return;
  }
 
  loading.value = true;
  statusMessage.value = 'Deleting...';
  try {
    const { error } = await client
      .from('notes')
      .delete()
      .match({ id: selectedNote.value.id, user_id: user.value.id }); // Ensure user owns the note

    if (error) throw error;

    statusMessage.value = 'Note deleted.';
    selectedNote.value = null;
    originalSelectedNote.value = null;
    await fetchNotes(); // Refresh the list
    setTimeout(() => statusMessage.value = '', 3000); // Clear message
  } catch (error) {
    console.error('Error deleting note:', error);
    statusMessage.value = 'Error deleting note.';
  } finally {
    loading.value = false;
  }
}

// Toggle sidebar function
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
}
</script>

<style scoped>
/* Add relative positioning to the main page container */
.notes-page {
  display: flex;
  flex-direction: column; /* Stack header and main content vertically */
  height: 100vh;
  overflow: hidden; /* Prevent scrolling on the main page */
  position: relative; /* Added for absolute positioning context */
}

/* NEW: Add flex styles for main layout */
.main-content {
  display: flex;
  flex-grow: 1; /* Allow main content to fill remaining vertical space if AppHeader shrinks */
  overflow: hidden; /* Prevent overflow within the main area */
}

.editor-area {
  flex-grow: 1; /* Make editor area fill remaining horizontal space */
  overflow-y: auto; /* Allow editor scrolling */
  padding: 1rem; /* Add some padding inside the editor */
  min-width: 0; /* Prevent content from breaking flex layout */
}

/* Sidebar slide transition */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.38s cubic-bezier(.4,2,.6,1), opacity 0.32s ease;
}
.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.sidebar-slide-enter-to,
.sidebar-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* Removed Hamburger toggle styles */

/* Sidebar Styles */
.sidebar {
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Allow sidebar scrolling if needed */
  border-right: 1px solid var(--pico-muted-border-color);
  padding-right: 1rem;
  min-width: 250px; /* Add minimum width for non-mobile view */
  flex-shrink: 0; /* Prevent sidebar from shrinking */
}

.sidebar-header {
  display: flex;
  flex-direction: column; /* Stack items vertically */
  align-items: flex-start; /* Align items to the start (left) */
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--pico-muted-border-color);
}

.sidebar-header h3 {
  margin-bottom: 0.5rem; /* Add space below the title */
}

.notes-list a {
  display: block;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  text-decoration: none;
  border-radius: var(--pico-border-radius);
  transition: background-color 0.2s ease;
  color: var(--pico-primary-focus);
}

.notes-list a:hover {
  background-color: var(--pico-muted-background);
}

.notes-list a.active {
  background-color: var(--pico-primary-background);
  color: var(--pico-primary-inverse);
  font-weight: bold;
}

.note-title {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-date {
  display: block;
  font-size: 0.8em;
  color: var(--pico-muted-color);
}

.no-notes,
.loading-notes {
  text-align: center;
  color: var(--pico-muted-color);
  margin-top: 1rem;
}

.placeholder-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--pico-muted-color);
  font-style: italic;
}

/* Adjust form layout if needed */
form .grid {
  grid-template-columns: 1fr 1fr auto; /* Adjust button layout */
}

textarea {
  resize: vertical; /* Allow vertical resize */
}

.status-message {
  margin-top: 1rem;
  font-style: italic;
}

/* Ensure loading states look right */
[aria-busy="true"] {
  cursor: wait;
}

/* Add styles for validation messages */
.error-message {
  color: var(--pico-color-red);
  font-size: 0.8em;
  display: block; /* Ensure it takes its own line */
  margin-top: 0.25rem;
}
</style>
