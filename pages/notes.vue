<template>
  <div class="container">
    <nav class="container-fluid">
      <ul>
        <li><strong>High Notes</strong></li>
      </ul>
      <ul>
        <li v-if="user">Logged in as {{ user.email }}</li>
        <li><button @click="logout" class="secondary outline" :disabled="loading">Logout</button></li>
      </ul>
    </nav>

    <div class="grid">
      <aside>
        <h3>My Notes</h3>
        <button @click="createNewNote" :disabled="loading">New Note +</button>
        <div v-if="notes.length">
          <a href="#" v-for="note in notes" :key="note.id" @click.prevent="selectNote(note)" :aria-busy="loading && selectedNote?.id === note.id" :class="{ 'secondary': selectedNote?.id === note.id }">
            {{ note.title || 'Untitled Note' }}
          </a>
        </div>
        <p v-else-if="!loading">No notes yet. Create one!</p>
        <p v-else aria-busy="true">Loading notes...</p>
      </aside>

      <article>
        <form v-if="selectedNote" @submit.prevent="saveNote">
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
          </div>
          <p v-if="statusMessage">{{ statusMessage }}</p>
        </form>
        <div v-else>
          <p>Select a note from the left, or create a new one.</p>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
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
      // Reselect the saved note (important for newly created notes to get their ID)
      const newlySavedNote = notes.value.find(n => n.id === data!.id);
      if (newlySavedNote) {
        selectNote(newlySavedNote);
      } else if (!selectedNote.value.id) { // If it was a new note, clear selection
        selectedNote.value = null;
        originalSelectedNote.value = null;
      }
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

// Check authentication on mount and fetch notes
onMounted(async () => {
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
  /* PicoCSS handles most styling, add custom overrides here */
  aside {
    padding-right: 1rem;
    border-right: 1px solid var(--pico-muted-border-color);
    display: flex;
    flex-direction: column;
  }
  aside > h3 {
    margin-bottom: 1rem;
  }
  aside > button { /* New Note button */
    margin-bottom: 1rem;
  }
  aside > div > a { /* Note links */
    display: block;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    text-decoration: none;
    border-radius: var(--pico-border-radius);
    border: 1px solid transparent; /* Placeholder for consistent spacing */
    cursor: pointer;
  }
  aside > div > a:hover {
    background-color: var(--pico-muted-background-color);
  }
  aside > div > a.secondary { /* Style for selected note */
    border-color: var(--pico-secondary-border);
    background-color: var(--pico-secondary-background);
    color: var(--pico-secondary-inverse);
  }
  nav ul:last-child {
    align-items: center; /* Vertically align logout button with email */
  }
  nav ul:last-child li {
    margin-left: 1rem; /* Space between email and logout */
  }
  nav ul:last-child button {
    margin-bottom: 0; /* Remove default button margin */
  }
  article form .grid { /* Adjust buttons spacing in the form */
    margin-top: 1rem;
    grid-template-columns: 1fr 1fr; /* Two equal columns for buttons */
    gap: 1rem;
  }
  article p { /* Placeholder text */
      color: var(--pico-muted-color);
  }
</style>
