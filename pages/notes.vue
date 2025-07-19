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
            <!-- Search Input -->
            <UInput
              v-model="searchQuery"
              placeholder="Search notes..."
              icon="i-heroicons-magnifying-glass"
              class="mb-4"
              data-testid="search-input"
            >
              <template #trailing>
                <UButton
                  v-show="searchQuery !== ''"
                  color="neutral"
                  variant="link"
                  icon="i-heroicons-x-mark-20-solid"
                  :padded="false"
                  @click="searchQuery = ''"
                  data-testid="clear-search-button"
                />
              </template>
            </UInput>
            <ClientOnly>
              <UButton 
                label="New Note" 
                @click.prevent="createNewNote" 
                :loading="loading" 
                block 
                icon="i-heroicons-plus-circle"
                data-testid="create-note-button"
              />
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
                data-testid="note-item"
              >
                <span class="block text-sm font-medium truncate" data-testid="note-item-title">{{ note.title || 'Untitled Note' }}</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1" data-testid="note-item-content">{{ formatDate(note.updated_at) }}</span>
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
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-800" data-testid="notes-container">
        <!-- Show form only if a note is selected -->
        <template v-if="selectedNote">
          <UForm :state="selectedNote" @submit.prevent="saveNote" class="space-y-4" data-testid="edit-note-button">
            <!-- Title Input -->
            <UFormField label="Title" name="title">
              <UInput 
                v-model="selectedNote.title" 
                required 
                :disabled="loading" 
                :maxlength="TITLE_MAX_LENGTH"
                placeholder="Note Title"
                data-testid="note-title-input"
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
                data-testid="note-content-input"
              />
              <span class="text-xs text-gray-400 mt-1 block">{{ selectedNote.content?.length || 0 }} / {{ CONTENT_MAX_LENGTH }}</span>
              <template #error>
                <span v-if="isContentTooLong" class="text-red-500 text-xs">Content cannot exceed {{ CONTENT_MAX_LENGTH }} characters.</span>
               </template>
            </UFormField>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <UButton
                type="button"
                label="Close"
                color="neutral"
                variant="outline"
                @click="selectedNote = null"
                :disabled="loading"
                icon="i-heroicons-x-circle"
                data-testid="close-note-button"
              />
              <UButton
                type="button"
                label="Delete"
                color="error"
                variant="soft"
                @click="deleteNote"
                :disabled="!selectedNote.id || loading"
                :loading="loading && selectedNote?.id === originalSelectedNote?.id"
                icon="i-heroicons-trash"
                data-testid="delete-note-button"
              />
              <UButton
                type="submit"
                label="Save"
                :disabled="isSaveDisabled"
                :loading="loading && selectedNote?.id === originalSelectedNote?.id"
                icon="i-heroicons-check-circle"
                data-testid="save-note-button"
              />
            </div>
          </UForm>
        </template>
        <!-- Placeholder when no note is selected -->
        <div v-else class="flex items-center justify-center h-full">
          <p class="text-lg text-gray-500 dark:text-gray-400 italic">
            Select a note or
            <button @click="createNewNote" class="text-primary-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              create a new one.
            </button>
          </p>
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
    <UModal v-model:open="isDeleteModalOpen" :ui="{ footer: 'justify-end' }" data-testid="confirm-dialog">
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
        <UButton 
          label="Cancel" 
          color="neutral" 
          variant="outline" 
          @click="isDeleteModalOpen = false" 
          :disabled="loading" 
          data-testid="confirm-no-button"
        />
        <UButton 
          label="Confirm Delete" 
          color="error" 
          @click="confirmDeleteNote" 
          :loading="loading" 
          icon="i-heroicons-trash" 
          data-testid="confirm-yes-button"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// --- Imports and Setup --- (Largely unchanged)
import { useNotes } from '~/composables/useNotes';
import { useLayout } from '~/composables/useLayout';

// --- Use Layout Composable ---
const { sidebarOpen, isMobile, toggleSidebar } = useLayout();

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
} = useNotes();

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

<style scoped>
/* Add any component-specific styles here */
/* Ensure sidebar has a max-height or similar if content might overflow */
aside {
  max-height: calc(100vh - 4rem); /* Adjust based on header height */
}
</style>
