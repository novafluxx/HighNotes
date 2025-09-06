<template>
  <!-- Main container with flex column layout -->
  <div class="flex flex-col h-full overflow-hidden">


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
            <!-- Search Input -->
            <UInput
              v-model="searchQuery"
              placeholder="Search notes..."
              class="mb-4"
            >
              <template #leading>
                <Icon name="lucide:search" class="size-5 text-gray-500 dark:text-gray-400" />
              </template>
              <template #trailing>
                <UButton
                  v-show="searchQuery !== ''"
                  color="neutral"
                  variant="link"
                  :padded="false"
                  @click="searchQuery = ''"
                >
                  <Icon name="lucide:x" class="size-5" />
                </UButton>
              </template>
            </UInput>
            <ClientOnly>
              <UButton label="New Note" @click.prevent="createNewNote" :loading="loading" block>
                <template #leading>
                  <Icon name="lucide:plus-circle" class="size-5" />
                </template>
              </UButton>
              <template #fallback>
                <!-- Optional: Add a placeholder skeleton or similar -->
                <USkeleton class="h-8 w-full" /> 
              </template>
            </ClientOnly>
          </div>

          <!-- Notes List -->
          <div class="flex-1 p-2 space-y-1 overflow-y-auto ios-scroll">
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
              >
                <template #leading>
                  <Icon name="lucide:arrow-down-circle" class="size-5" />
                </template>
              </UButton>
            </div>
          </div>
        </aside>
        </transition>
        <template #fallback>
          <!-- Empty fallback to prevent flash -->
        </template>
      </ClientOnly>

      <!-- Editor Area -->
      <NoteEditor
        v-model:modelValue="selectedNote"
        v-model:content="currentEditorContent"
        :loading="loading"
        :is-save-disabled="isSaveDisabled"
        :is-title-too-long="isTitleTooLong"
        :is-content-too-long="isContentTooLong"
        :TITLE_MAX_LENGTH="TITLE_MAX_LENGTH"
        :CONTENT_MAX_LENGTH="CONTENT_MAX_LENGTH"
        @save="saveNote"
        @delete="deleteNote"
        @close="selectedNote = null"
        @create-new="createNewNote"
        @encrypt-note="handleEncryptNote"
        @decrypt-note="handleDecryptNote"
      />

      <!-- Mobile Overlay for Sidebar -->
      <div 
        v-if="isMobile && sidebarOpen" 
        class="fixed inset-0 z-20 bg-[rgba(0,0,0,0.1)]" 
        @click="sidebarOpen = false"
      ></div>

    </div>
    
    <!-- PWA Install Prompt -->
    <PwaInstallPrompt />
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
        <UButton label="Confirm Delete" color="error" @click="confirmDeleteNote" :loading="loading">
          <template #leading>
            <Icon name="lucide:trash" class="size-5" />
          </template>
        </UButton>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// --- Imports and Setup --- (Largely unchanged)
import { useNotes } from '~/composables/useNotes';
import { useLayout } from '~/composables/useLayout';
import { useEncryption } from '~/composables/useEncryption';
import NoteEditor from '~/components/NoteEditor.vue';
import auth from '~/middleware/auth';
definePageMeta({ middleware: [auth] })
// --- Use Layout Composable ---
const { sidebarOpen, isMobile } = useLayout();

// --- Use Notes Composable ---
const {
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
} = useNotes();

// --- Use Encryption Composable ---
const { encryptNote, decryptNote } = useEncryption();

// --- Encryption Handlers ---
const handleEncryptNote = async (noteId: string | null) => {
  if (!selectedNote.value || selectedNote.value.is_encrypted) return;

  try {
    const title = selectedNote.value.title || '';
    const content = currentEditorContent.value || '';

    const encryptedPayload = await encryptNote(title, content);
    if (encryptedPayload) {
      // Update the note to mark it as encrypted
      selectedNote.value = {
        ...selectedNote.value,
        is_encrypted: true,
        encrypted_payload: encryptedPayload,
        content: null // Clear plaintext content
      };
      
      // Clear the editor content since it's now encrypted
      currentEditorContent.value = '';
      
      // Save the updated note
      await saveNote();
    }
  } catch (error) {
    console.error('Error encrypting note:', error);
  }
};

const handleDecryptNote = async (noteId: string | null) => {
  if (!selectedNote.value || !selectedNote.value.is_encrypted || !selectedNote.value.encrypted_payload) return;

  try {
    const decryptedData = await decryptNote(selectedNote.value.encrypted_payload);
    if (decryptedData) {
      // Update the note to mark it as unencrypted
      selectedNote.value = {
        ...selectedNote.value,
        is_encrypted: false,
        encrypted_payload: null,
        title: decryptedData.title,
        content: decryptedData.content
      };
      
      // Update the editor content
      currentEditorContent.value = decryptedData.content;
      
      // Save the updated note
      await saveNote();
    }
  } catch (error) {
    console.error('Error decrypting note:', error);
  }
};

// Adjust selectNote and createNewNote to close sidebar on mobile
const selectNoteAndCloseSidebar = async (noteStub: any) => {
  await selectNote(noteStub);
  if (isMobile.value) {
    sidebarOpen.value = false;
  }
};

const createNewNoteAndCloseSidebar = () => {
  createNewNote();
  if (isMobile.value) {
    sidebarOpen.value = false;
  }
};

</script>


