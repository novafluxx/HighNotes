<template>
  <div class="notes-page">
    <AppHeader /> <!-- Use the shared header component -->
    <div class="main-content">
      <!-- Hamburger toggle for mobile -->
      <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle sidebar" :aria-expanded="sidebarOpen">
        <span :class="{ 'open': sidebarOpen }">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </span>
      </button>
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
import type { User } from '@supabase/supabase-js';
import { type Note } from '~/types'; // Import the Note type
import { useAuth } from '~/composables/useAuth';
import { useSupabase } from '~/composables/useSupabase';
import AppHeader from '~/components/AppHeader.vue';

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
import { onMounted, onUnmounted } from 'vue';
onMounted(() => {
  checkMobile();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkMobile);
  }
});
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobile);
  }
});
// No direct assignment to sidebarOpen at the top level (SSR-safe)


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

const supabase = useSupabase(); // Get Supabase client via composable
const { user, isLoggedIn, loading: authLoading } = useAuth(); // Get auth state and user via composable
const router = useRouter(); // Get router instance

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

// Fetch notes function
const fetchNotes = async () => {
  if (!user.value) return;
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.value.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    // Use type assertion carefully or validate data if necessary
    notes.value = data as Note[]; // Supabase provides typed data based on select, cast might be okay if confident
    // Alternatively, for more safety:
    // notes.value = data ? data.map(item => item as Note) : [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    statusMessage.value = 'Failed to load notes.';
  } finally {
    loading.value = false;
  }
}

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
const createNewNote = () => {
  if (!user.value) return;
  const newNote: Note = {
    id: '', // Will be assigned by DB
    user_id: user.value.id,
    title: 'New Note',
    content: '',
    updated_at: new Date().toISOString(), // Provide a default timestamp
  };
  selectedNote.value = newNote;
  // Reset originalSelectedNote when creating a new one
  originalSelectedNote.value = { ...newNote, id: null }; // Mark as unsaved
  statusMessage.value = 'Editing new note...';
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
      const { data, error } = await supabase
        .from('notes')
        .update(noteDataToSave) // Pass only data fields, not id
        .eq('id', selectedNote.value.id)
        .select()
        .single(); // Get the updated record
      if (error) throw error;
      savedNoteData = data as Note; // Cast carefully
    } else {
      // Insert new note
      const { data, error } = await supabase
        .from('notes')
        .insert(noteDataToSave) // Pass only data fields, not id
        .select()
        .single(); // Get the inserted record
      if (error) throw error;
      savedNoteData = data as Note; // Cast carefully
    }

    if (savedNoteData) {
      statusMessage.value = 'Note saved successfully!';
      // Update the list and selection
      await fetchNotes(); // Re-fetch to get the latest list + updated_at timestamps
      // Clear the selection and form
      selectedNote.value = null;
      originalSelectedNote.value = null;
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
  if (!selectedNote.value || !selectedNote.value.id || !confirm('Are you sure you want to delete this note?')) return;
  loading.value = true;
  statusMessage.value = 'Deleting...';
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', selectedNote.value.id);

    if (error) throw error;

    statusMessage.value = 'Note deleted.';
    selectedNote.value = null;
    originalSelectedNote.value = null;
    await fetchNotes(); // Refresh the list
  } catch (error) {
    console.error('Error deleting note:', error);
    statusMessage.value = 'Error deleting note.';
  } finally {
    loading.value = false;
  }
}

// Check authentication on mount and fetch notes
onMounted(async () => {
  // Auth check is now handled by useAuth composable.
  // We might need to wait for authLoading to be false before fetching notes
  // or redirecting if not logged in.

  // Watch for auth state to settle before fetching notes or redirecting
  watch(authLoading, (newVal) => {
    if (newVal === false) { // Wait until auth check is complete
      if (!isLoggedIn.value) {
        console.log('User not logged in, redirecting...');
        router.push('/');
      } else {
        console.log('User logged in, fetching notes...');
        fetchNotes();
      }
    }
  }, { immediate: true }); // immediate: true to run the check initially
});
</script>

<style scoped>
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

/* Hamburger toggle styles */
.sidebar-toggle {
  display: none;
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 120;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
}
.sidebar-toggle span {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 2rem;
  height: 2rem;
  justify-content: center;
  align-items: center;
}
.sidebar-toggle .bar {
  width: 1.8rem;
  height: 0.22rem;
  background: var(--pico-primary-focus);
  border-radius: 2px;
  transition: all 0.3s;
}
.sidebar-toggle span.open .bar:nth-child(1) {
  transform: translateY(0.44rem) rotate(45deg);
}
.sidebar-toggle span.open .bar:nth-child(2) {
  opacity: 0;
}
.sidebar-toggle span.open .bar:nth-child(3) {
  transform: translateY(-0.44rem) rotate(-45deg);
}

@media (max-width: 600px) {
  .sidebar-toggle {
    display: block;
  }
  .main-content {
    grid-template-columns: 1fr !important;
    padding: 0;
    position: relative;
  }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 80vw;
    max-width: 320px;
    background: var(--pico-card-background-color);
    color: var(--pico-card-color);
    z-index: 110;
    box-shadow: 2px 0 16px 0 rgba(0,0,0,0.18);
    border-right: 1px solid var(--pico-muted-border-color);
    will-change: transform, opacity;
  }
  .editor-area {
    margin-left: 0 !important;
    width: 100vw;
    min-width: 0;
  }
}

.notes-page { /* Keep basic page structure if needed */
  min-height: 100vh;
}

.main-content {
  display: flex;
  flex-grow: 1; /* Take remaining horizontal space */
  padding: 1.5rem;
  overflow-y: auto; /* Enable vertical scrolling for the editor */
  display: flex; /* Use flex to center placeholder */
  flex-direction: column;
}

.editor-area article {
  width: 100%; /* Ensure form takes full width */
}

.placeholder-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; /* Center vertically */
  text-align: center;
  color: var(--pico-muted-color);
}

/* Form button adjustments */
article form .grid {
  margin-top: 1rem;
  grid-template-columns: auto auto 1fr; /* Adjust button layout */
  gap: 1rem;
}

/* Optional: Style form elements for better spacing/look */
article form label {
  margin-bottom: 1rem;
}
article form input[type="text"] {
  margin-bottom: 0.5rem; /* Space between title input and content label */
}
article form textarea {
  resize: vertical; /* Allow vertical resize only */
}

/* Add back the necessary layout styles */
.notes-page {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Full viewport height */
}

/* Header is handled by AppHeader now */

.main-content {
  flex-grow: 1; /* Takes remaining vertical space */
  display: grid;
  grid-template-columns: 300px 1fr; /* Sidebar width + Editor area */
  gap: 1rem; /* Gap between sidebar and editor */
  padding: 1rem;
  overflow: hidden; /* Prevent overall page scroll */
  background-color: var(--pico-main-background); /* Use PicoCSS variables */
}

.sidebar {
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Allow sidebar scrolling if needed */
  border-right: 1px solid var(--pico-muted-border-color);
  padding-right: 1rem;
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

.editor-area {
  overflow-y: auto; /* Allow editor scrolling */
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
