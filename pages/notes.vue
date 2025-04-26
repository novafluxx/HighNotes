<template>
  <div class="notes-page">
    <nav class="container-fluid header-nav">
      <ul>
        <li><strong>High Notes</strong></li>
      </ul>
      <ul>
        <li>
          <button @click="toggleTheme" class="theme-toggle" :aria-label="`Switch to ${isDarkMode ? 'light' : 'dark'} mode`">
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
        </li>
        <li v-if="user" class="user-menu-container">
          <a href="#" @click.prevent="toggleUserMenu" class="user-email-link" aria-haspopup="true" :aria-expanded="isUserMenuOpen">
            {{ user.email }} &#9660; <!-- Down arrow indicator -->
          </a>
          <transition name="slide-fade">
            <div v-if="isUserMenuOpen" class="user-menu-dropdown" ref="userMenuRef">
              <a href="#" @click.prevent="handleLogout" class="dropdown-item">Logout</a>
              <!-- Add other menu items here if needed -->
            </div>
          </transition>
        </li>
      </ul>
    </nav>

    <div class="main-content">
      <aside class="sidebar">
        <div class="sidebar-header">
           <h3>My Notes</h3>
           <button @click="createNewNote" :disabled="loading" class="outline small">New Note</button>
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

      <main class="editor-area">
        <article v-if="selectedNote">
          <form @submit.prevent="saveNote">
            <label for="title">
              Title
              <input type="text" id="title" name="title" v-model="selectedNote.title" required :disabled="loading">
            </label>
            <label for="content">
              Content
              <textarea id="content" name="content" v-model="selectedNote.content" rows="10" :disabled="loading"></textarea>
            </label>
            <div class="grid">
              <button type="submit" :disabled="!isNoteDirty || loading" :aria-busy="loading">Save Note</button>
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
import { ref, onMounted, watch, computed, nextTick, onUnmounted } from 'vue'
import { createClient, AuthError, type User } from '@supabase/supabase-js'
import { useRouter, useRuntimeConfig } from '#app'

// Define Note type
interface Note {
  id: string | null; // Null for new notes
  user_id: string;
  title: string;
  content: string | null;
  inserted_at?: string;
  updated_at?: string;
}

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

// Supabase setup
const config = useRuntimeConfig()
const supabaseUrl = config.public.supabaseUrl as string
const supabaseKey = config.public.supabaseKey as string
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in runtimeConfig')
}
const supabase = createClient(supabaseUrl, supabaseKey)
const router = useRouter()

const user = ref<User | null>(null)
const notes = ref<Note[]>([])
const selectedNote = ref<Note | null>(null)
const originalSelectedNote = ref<Note | null>(null) // For dirty checking
const loading = ref(false)
const statusMessage = ref('')
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null); // Ref for the dropdown element
const isDarkMode = ref(false); // Theme state

// Computed property to check if the selected note has changed
const isNoteDirty = computed(() => {
  if (!selectedNote.value || !originalSelectedNote.value) return false;
  return (
    selectedNote.value.title !== originalSelectedNote.value.title ||
    selectedNote.value.content !== originalSelectedNote.value.content
  );
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
    notes.value = data as Note[];
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
}

// Create new note function
const createNewNote = () => {
  if (!user.value) return;
  selectedNote.value = {
    id: null, // Indicates new note
    user_id: user.value.id,
    title: '',
    content: ''
  };
  originalSelectedNote.value = { ...selectedNote.value }; // Store original
  statusMessage.value = '';
}

// Save note function (handles create and update)
const saveNote = async () => {
  if (!selectedNote.value || !user.value || loading.value) return;
  loading.value = true;
  statusMessage.value = 'Saving...';

  const noteToSave = {
    user_id: user.value.id,
    title: selectedNote.value.title || 'Untitled Note', // Ensure title isn't empty
    content: selectedNote.value.content
  };

  try {
    let data: Note | null = null;
    let error: AuthError | Error | null = null;

    if (selectedNote.value.id) {
      // Update existing note
      const { data: updateData, error: updateError } = await supabase
        .from('notes')
        .update(noteToSave)
        .eq('id', selectedNote.value.id)
        .select()
        .single();
      data = updateData as Note;
      error = updateError;
    } else {
      // Create new note
      const { data: insertData, error: insertError } = await supabase
        .from('notes')
        .insert(noteToSave)
        .select()
        .single();
      data = insertData as Note;
      error = insertError;
    }

    if (error) throw error;

    if (data) {
      statusMessage.value = 'Note saved successfully!';
      // Update the list and selection
      await fetchNotes(); // Re-fetch to get the latest list + updated_at timestamps
      // Clear the selection and form
      selectedNote.value = null;
      originalSelectedNote.value = null;
    }
  } catch (err) {
    console.error('Error saving note:', err);
    statusMessage.value = `Error saving note: ${(err instanceof Error) ? err.message : String(err)}`;
  } finally {
    loading.value = false;
    // Clear status message after a delay
    setTimeout(() => { if (statusMessage.value === 'Note saved successfully!') statusMessage.value = ''; }, 3000);
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
    } catch (err) {
        console.error('Error deleting note:', err);
        statusMessage.value = `Error deleting note: ${(err instanceof Error) ? err.message : String(err)}`;
    } finally {
        loading.value = false;
         setTimeout(() => { if (statusMessage.value === 'Note deleted.') statusMessage.value = ''; }, 3000);
    }
}

// Logout function
const logout = async () => {
  loading.value = true;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    user.value = null;
    router.push('/'); // Redirect to login
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    loading.value = false;
  }
}

// --- User Menu Logic ---
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false;
}

// Wrapper for logout that also closes the menu
const handleLogout = async () => {
  closeUserMenu();
  await logout();
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  // Close if click is outside dropdown and not on the trigger link
  if (
    userMenuRef.value &&
    !userMenuRef.value.contains(target) &&
    !target.closest('.user-email-link')
  ) {
    closeUserMenu();
  }
};

// Watch the menu state to add/remove the global listener
watch(isUserMenuOpen, (isOpen) => {
  if (isOpen) {
    // Use nextTick to ensure the menu is rendered before adding listener
    nextTick(() => {
      document.addEventListener('click', handleClickOutside);
    });
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

// Cleanup listener on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
// --- End User Menu Logic ---

// --- Theme Logic ---
const applyTheme = (dark: boolean) => {
  const theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  isDarkMode.value = dark;
  if (process.client) {
      localStorage.setItem('theme', theme);
  }
}

const toggleTheme = () => {
  applyTheme(!isDarkMode.value);
}

const initializeTheme = () => {
  if (!process.client) return; // Only run on client

  const storedTheme = localStorage.getItem('theme');
  let preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (storedTheme) {
    applyTheme(storedTheme === 'dark');
  } else {
    applyTheme(preferDark);
  }
}
// --- End Theme Logic ---

// Check authentication on mount and fetch notes
onMounted(async () => {
  initializeTheme(); // Set initial theme

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    router.push('/'); // Redirect if not logged in
  } else {
    user.value = session.user;
    await fetchNotes();
  }

  // Listen for auth changes (e.g., token refresh, logout elsewhere)
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        user.value = null;
        router.push('/');
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        user.value = session.user;
        // Optionally re-fetch notes if user changes, though unlikely in SPA context without refresh
        // fetchNotes();
    }
  });
});

// Watch for changes in selectedNote to potentially clear status message
watch(selectedNote, (newVal, oldVal) => {
  if (newVal?.id !== oldVal?.id) {
    statusMessage.value = ''; // Clear status when changing notes
  }
});
</script>

<style scoped>
.notes-page {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Full viewport height */
  overflow: hidden; /* Prevent body scrolling */
}

.header-nav {
  flex-shrink: 0; /* Prevent header from shrinking */
  border-bottom: 1px solid var(--pico-muted-border-color);
}

.main-content {
  display: flex;
  flex-grow: 1; /* Take remaining vertical space */
  overflow: hidden; /* Important for child scrolling */
}

.sidebar {
  width: 280px; /* Fixed width for the sidebar */
  flex-shrink: 0; /* Prevent sidebar from shrinking */
  border-right: 1px solid var(--pico-muted-border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Enable vertical scrolling for the sidebar */
  padding: 1rem;
  background-color: var(--pico-card-background-color); /* Slightly different background? */
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--pico-muted-border-color);
}

.sidebar-header h3 {
    margin-bottom: 0;
}

.sidebar-header button.small { /* Adjust Pico button size if needed */
  padding: 0.25rem 0.5rem;
  font-size: 0.875em;
}

.notes-list {
  flex-grow: 1; /* Allow list to take up remaining space */
  /* overflow-y: auto; already handled by .sidebar */
}

.notes-list a {
  display: block;
  padding: 0.75rem 0.5rem;
  margin-bottom: 0.5rem;
  text-decoration: none;
  border-radius: var(--pico-border-radius);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notes-list a:hover {
  background-color: var(--pico-muted-background-color);
}

.notes-list a.active {
  border-color: var(--pico-primary-border);
  background-color: var(--pico-primary-background);
  color: var(--pico-primary-inverse);
}

.notes-list a .note-title {
  display: block;
  font-weight: 600; /* Make title slightly bolder */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* Add ellipsis if title is too long */
  margin-bottom: 0.25rem;
}

.notes-list a .note-date {
  display: block;
  font-size: 0.8em;
  color: var(--pico-muted-color);
}

.notes-list a.active .note-date {
    color: var(--pico-primary-inverse); /* Adjust date color for active note */
    opacity: 0.8;
}


.no-notes,
.loading-notes {
    text-align: center;
    color: var(--pico-muted-color);
    margin-top: 2rem;
}

.editor-area {
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


/* Remove old grid styles if they existed */
/* .grid { display: block; } Remove if you had .grid */

/* Adjust nav styles from previous implementation if necessary */
nav ul:last-child {
  align-items: center;
}
nav ul:last-child li {
  margin-left: 1rem;
}
nav ul:last-child button {
  margin-bottom: 0;
}

/* Form button adjustments */
article form .grid {
  margin-top: 1rem;
  grid-template-columns: auto auto 1fr; /* Save, Delete, Spacer */
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

/* User Menu Specific Styles */
.user-menu-container {
  position: relative; /* Needed for absolute positioning of dropdown */
  margin-left: 1rem; /* Adjust spacing */
}

.user-email-link {
  cursor: pointer;
  text-decoration: none;
  color: var(--pico-contrast); /* Or primary color */
  padding: 0.5rem; /* Add some padding for easier clicking */
}

.user-email-link:hover {
  text-decoration: underline;
}

.user-menu-dropdown {
  position: absolute;
  top: 100%; /* Position below the email link */
  right: 0;
  background-color: var(--pico-card-background-color);
  border: 1px solid var(--pico-muted-border-color);
  border-radius: var(--pico-border-radius);
  box-shadow: var(--pico-card-box-shadow);
  padding: 0.5rem 0; /* Padding top/bottom */
  min-width: 150px; /* Adjust as needed */
  z-index: 10; /* Ensure it's above other content */
  margin-top: 0.5rem; /* Small gap */
}

.dropdown-item {
  display: block;
  padding: 0.5rem 1rem; /* Padding left/right */
  color: var(--pico-contrast);
  text-decoration: none;
  white-space: nowrap;
}

.dropdown-item:hover {
  background-color: var(--pico-muted-background-color);
}

/* Transition Styles */
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Theme Toggle Styles */
.theme-toggle {
  background: none;
  border: none;
  padding: 0.5rem; /* Match user link padding */
  cursor: pointer;
  font-size: 1.2em; /* Make icon slightly larger */
  line-height: 1; /* Prevent extra spacing */
  color: var(--pico-contrast);
}
.theme-toggle:hover {
  opacity: 0.8;
}
</style>
