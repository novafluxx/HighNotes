<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex flex-1 overflow-hidden relative">
      <!-- Decorative background blobs (hidden on small screens to reduce GPU work) -->
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 overflow-hidden hidden sm:block">
        <div class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl" />
        <div class="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
      </div>
      <ClientOnly>
        <transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="transform -translate-x-full opacity-0"
          enter-to-class="transform translate-x-0 opacity-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="transform translate-x-0 opacity-100"
          leave-to-class="transform -translate-x-full opacity-0"
        >
          <aside 
            v-if="sidebarOpen || !isMobile" 
            class="flex flex-col w-64 flex-shrink-0 border-r border-gray-200/70 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 backdrop-blur-md overflow-y-auto"
            :class="{ 'absolute inset-y-0 left-0 z-30 shadow-2xl': isMobile && sidebarOpen }" 
            @click.self="isMobile ? sidebarOpen = false : null" 
          >
            <div class="sticky top-0 z-10 flex flex-col p-4 border-b border-gray-200/60 dark:border-gray-800/80 bg-gradient-to-b from-white/70 to-white/20 dark:from-gray-900/60 dark:to-gray-900/20 backdrop-blur-md">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                  <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-fuchsia-500">My Notes</span>
                </h3>
                <span class="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-200 border border-primary-200/60 dark:border-primary-800/60">
                  {{ notes.length }}
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Find and craft ideas ✨</p>
              <UInput
                v-model="searchQuery"
                placeholder="Search notes..."
                class="mb-4 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 focus-within:ring-2 focus-within:ring-primary-400 transition-shadow shadow-sm"
              >
                <template #leading>
                  <span>
                    <Icon name="lucide:search" class="size-5 text-gray-500 dark:text-gray-400" />
                  </span>
                </template>
                <template #trailing>
                  <span>
                    <UButton
                      v-show="searchQuery !== ''"
                      color="neutral"
                      variant="ghost"
                      :padded="false"
                      class="hover:text-primary-600"
                      @click="searchQuery = ''"
                    >
                      <Icon name="lucide:x" class="size-5" />
                    </UButton>
                  </span>
                </template>
              </UInput>
              <ClientOnly>
                <UButton 
                  label="New Note" 
                  color="primary"
                  variant="solid"
                  class="rounded-xl bg-gradient-to-r from-primary-600 to-fuchsia-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow"
                  @click.prevent="createNewNoteAndCloseSidebar" 
                  :loading="loading" 
                  block
                >
                  <template #leading>
                    <Icon name="lucide:plus-circle" class="size-5" />
                  </template>
                </UButton>
                <template #fallback>
                  <USkeleton class="h-9 w-full rounded-xl" /> 
                </template>
              </ClientOnly>
            </div>
            <div class="flex-1 p-2 space-y-1 overflow-y-auto ios-scroll">
              <template v-if="notes.length">
                <button 
                  v-for="note in notes" 
                  :key="note.id!" 
                  @click.prevent="selectNoteAndCloseSidebar(note)" 
                  :disabled="loading && selectedNote?.id === note.id"
                  class="group w-full text-left p-3 rounded-xl transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 hover:shadow-sm"
                  :class="[
                    selectedNote?.id === note.id 
                      ? 'bg-primary-50/80 dark:bg-primary-950/40 text-primary-700 dark:text-primary-200 ring-1 ring-primary-300/60 dark:ring-primary-800/60' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/60'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <span 
                      v-if="String(note.id).startsWith('local-')"
                      class="inline-block size-2 rounded-full bg-amber-400 animate-pulse" 
                      title="Unsynced"
                    />
                    <span class="block text-sm font-medium truncate">{{ note.title || 'Untitled Note' }}</span>
                  </div>
                  <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1">{{ formatDate(note.updated_at) }}</span>
                </button>
              </template>
              <div v-else-if="!loading" class="px-2 py-6 text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400">No notes yet — start your first one!</p>
                <div class="mt-3 flex justify-center">
                  <UButton size="sm" class="rounded-full" @click.prevent="createNewNoteAndCloseSidebar">
                    <template #leading>
                      <Icon name="lucide:sparkles" class="size-4" />
                    </template>
                    Create a note
                  </UButton>
                </div>
              </div>
              <div v-else class="px-2 py-4 space-y-2">
                <USkeleton class="h-10 w-full rounded-xl" />
                <USkeleton class="h-10 w-full rounded-xl" />
                <USkeleton class="h-10 w-full rounded-xl" />
              </div>
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
      <div class="relative flex-1 overflow-hidden">
        <ClientOnly>
          <Suspense>
            <template v-if="selectedNote">
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
              />
            </template>
            <template #fallback>
              <div class="p-4">
                <USkeleton class="h-10 w-1/2 mb-3" />
                <USkeleton class="h-40 w-full" />
              </div>
            </template>
          </Suspense>
        </ClientOnly>
        <!-- Empty editor state overlay -->
        <div
          v-if="!selectedNote"
          class="absolute inset-0 flex items-center justify-center p-6"
          role="region"
          aria-label="No note selected"
        >
          <div class="max-w-md w-full text-center rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md shadow-lg p-8">
            <div class="mx-auto mb-4 size-12 rounded-full bg-gradient-to-br from-primary-600 to-fuchsia-500 text-white grid place-items-center shadow">
              <Icon name="lucide:pen-line" class="size-6" />
            </div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Write something wonderful
            </h2>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Create a new note or pick one from the sidebar.
            </p>
            <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
              <UButton 
                color="primary" 
                variant="solid" 
                class="rounded-full bg-gradient-to-r from-primary-600 to-fuchsia-500 text-white border-0 shadow-md hover:shadow-lg"
                @click.prevent="createNewNoteAndCloseSidebar"
              >
                <template #leading>
                  <Icon name="lucide:plus" class="size-5" />
                </template>
                Create a note
              </UButton>
              <UButton 
                v-if="isMobile"
                color="neutral" 
                variant="soft" 
                class="rounded-full"
                @click="sidebarOpen = true"
              >
                <template #leading>
                  <Icon name="lucide:panel-left-open" class="size-5" />
                </template>
                Open sidebar
              </UButton>
            </div>
          </div>
        </div>
      </div>
      <!-- Mobile FAB for creating new note when sidebar is closed -->
      <button
        v-if="isMobile && !sidebarOpen"
        @click.prevent="createNewNoteAndCloseSidebar"
        class="fixed bottom-6 right-6 z-10 rounded-full bg-gradient-to-r from-primary-600 to-fuchsia-500 text-white shadow-lg hover:shadow-xl transition-shadow p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        aria-label="Create new note"
      >
        <Icon name="lucide:plus" class="size-6" />
      </button>
      <div 
        v-if="isMobile && sidebarOpen" 
        class="fixed inset-0 z-20 bg-[rgba(0,0,0,0.1)]" 
        @click="sidebarOpen = false"
      ></div>
    </div>
    <PwaInstallPrompt />
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
// --- Imports and Setup ---
import { defineAsyncComponent } from 'vue';
import { useNotes } from '~/composables/useNotes';
import { useLayout } from '~/composables/useLayout';
import auth from '~/middleware/auth';
definePageMeta({ 
  middleware: [auth],
  ssr: false // CSR for authenticated note-taking interface (realtime, IndexedDB)
})
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

// Lazy-load the heavy TipTap editor only when needed
const NoteEditor = defineAsyncComponent(() => import('~/components/NoteEditor.vue'));

</script>


