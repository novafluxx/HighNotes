<template>
  <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-800">
    <!-- Show form only if a note is selected -->
    <template v-if="note">
      <UForm :state="note" @submit.prevent="emit('save')" class="space-y-4">
        <!-- Title Input -->
        <UFormField label="Title" name="title">
          <UInput
            v-model="note.title"
            required
            :disabled="loading"
            :maxlength="TITLE_MAX_LENGTH"
            placeholder="Note Title"
          />
          <span class="text-xs text-gray-400 mt-1 block">{{ note.title?.length || 0 }} / {{ TITLE_MAX_LENGTH }}</span>
          <template #error>
             <span v-if="isTitleTooLong" class="text-red-500 text-xs">Title cannot exceed {{ TITLE_MAX_LENGTH }} characters.</span>
          </template>
        </UFormField>

        <!-- Encryption Toggle -->
        <UFormField v-if="showEncryptionControls" label="Encryption" name="encryption">
          <div class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div class="flex items-center gap-3">
              <Icon :name="isNoteEncrypted ? 'lucide:shield-check' : 'lucide:shield'" 
                    :class="isNoteEncrypted ? 'text-green-500' : 'text-gray-400'" 
                    class="w-5 h-5" />
              <div>
                <span class="font-medium text-sm">
                  {{ isNoteEncrypted ? 'Encrypted Note' : 'Unencrypted Note' }}
                </span>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ isNoteEncrypted ? 'This note is protected with encryption' : 'Toggle to encrypt this note' }}
                </p>
              </div>
            </div>
            
            <UButton
              v-if="!isNoteEncrypted"
              @click="handleEncryptionToggle"
              size="sm"
              color="primary"
              variant="outline"
              :disabled="loading || !canEncryptNotes"
              :loading="encryptionLoading"
            >
              <template #leading>
                <Icon name="lucide:shield-plus" class="w-4 h-4" />
              </template>
              Encrypt Note
            </UButton>
            
            <UButton
              v-else
              @click="handleDecryptionToggle"
              size="sm"
              color="amber"
              variant="outline"
              :disabled="loading || !canEncryptNotes"
              :loading="encryptionLoading"
            >
              <template #leading>
                <Icon name="lucide:shield-off" class="w-4 h-4" />
              </template>
              Remove Encryption
            </UButton>
          </div>

          <!-- Encryption Status Messages -->
          <div v-if="!hasEncryptionSetup && !isNoteEncrypted" class="mt-2">
            <UAlert
              color="blue"
              variant="soft"
              icon="lucide:info"
              title="Set up encryption"
              description="Enable encryption to protect your notes with a passphrase."
            />
          </div>
          
          <div v-else-if="!isEncryptionUnlocked && !isNoteEncrypted" class="mt-2">
            <UAlert
              color="amber"
              variant="soft"
              icon="lucide:lock"
              title="Encryption locked"
              description="Unlock encryption to encrypt new notes or access encrypted ones."
            />
          </div>
        </UFormField>

        <!-- Content Editor -->
        <UFormField label="Content" name="content">
          <div v-if="editor" class="tiptap-editor form-input dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <div class="tiptap-toolbar">
              <!-- Encryption Controls in Toolbar -->
              <div v-if="showEncryptionControls" class="flex items-center gap-2 mr-4 pr-4 border-r border-gray-300 dark:border-gray-600">
                <UButton
                  v-if="!hasEncryptionSetup"
                  @click="showSetupModal = true"
                  size="xs"
                  color="primary"
                  variant="outline"
                  aria-label="Setup Encryption"
                >
                  <template #leading>
                    <Icon name="lucide:shield-plus" class="w-4 h-4" />
                  </template>
                  Setup
                </UButton>
                
                <UButton
                  v-else-if="isEncryptionLocked"
                  @click="showUnlockModal = true"
                  size="xs"
                  color="amber"
                  variant="outline"
                  aria-label="Unlock Encryption"
                >
                  <template #leading>
                    <Icon name="lucide:unlock" class="w-4 h-4" />
                  </template>
                  Unlock
                </UButton>
                
                <UButton
                  v-else
                  @click="lockEncryption"
                  size="xs"
                  color="gray"
                  variant="outline"
                  aria-label="Lock Encryption"
                >
                  <template #leading>
                    <Icon name="lucide:lock" class="w-4 h-4" />
                  </template>
                  Lock
                </UButton>
              </div>

              <!-- Existing formatting buttons -->
              <UButton @click="editor.chain().focus().toggleBold().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('bold') }" size="xs" aria-label="Bold">
                <template #leading>
                  <Icon name="lucide:bold" class="w-4 h-4" />
                </template>
              </UButton>
              <UButton @click="editor.chain().focus().toggleItalic().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('italic') }" size="xs" aria-label="Italic">
                <template #leading>
                  <Icon name="lucide:italic" class="w-4 h-4" />
                </template>
              </UButton>
              <UButton @click="editor.chain().focus().toggleStrike().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('strike') }" size="xs" aria-label="Strikethrough">
                <template #leading>
                  <Icon name="lucide:strikethrough" class="w-4 h-4" />
                </template>
              </UButton>
              <UButton @click="editor.chain().focus().toggleCode().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('code') }" size="xs" aria-label="Code">
                <template #leading>
                  <Icon name="lucide:code" class="w-4 h-4" />
                </template>
              </UButton>
              <UButton @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" label="H1" size="xs" />
              <UButton @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" label="H2" size="xs" />
              <UButton @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" label="H3" size="xs" />
              <UButton @click="editor.chain().focus().toggleBulletList().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('bulletList') }" size="xs" aria-label="Bullet List">
                <template #leading>
                  <Icon name="lucide:list" class="w-4 h-4" />
                </template>
              </UButton>
              <UButton @click="editor.chain().focus().toggleOrderedList().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('orderedList') }" size="xs" aria-label="Ordered List">
                <template #leading>
                  <Icon name="lucide:list-ordered" class="w-4 h-4" />
                </template>
              </UButton>
            </div>
            <editor-content :editor="editor" />
            <div v-if="editor" class="character-count text-xs text-gray-400 mt-1 flex justify-end pr-2 pb-1">
              {{ editor.storage.characterCount.characters() }} / {{ CONTENT_MAX_LENGTH }}
            </div>
          </div>
        </UFormField>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <UButton
            type="button"
            label="Close"
            color="neutral"
            variant="outline"
            @click="emit('close')"
            :disabled="loading"
          >
            <template #leading>
              <Icon name="lucide:x-circle" class="w-5 h-5" />
            </template>
          </UButton>
          <UButton
            type="button"
            label="Delete"
            color="error"
            variant="soft"
            @click="emit('delete')"
            :disabled="!note.id || loading"
            :loading="loading"
          >
            <template #leading>
              <Icon name="lucide:trash" class="w-5 h-5" />
            </template>
          </UButton>
          <UButton
            type="submit"
            label="Save"
            :disabled="isSaveDisabled"
            :loading="loading"
          >
            <template #leading>
              <Icon name="lucide:check-circle" class="w-5 h-5" />
            </template>
          </UButton>
        </div>
      </UForm>
    </template>
    <!-- Placeholder when no note is selected -->
    <div v-else class="flex items-center justify-center h-full">
      <p class="text-lg text-gray-500 dark:text-gray-400 italic">
        Select a note or
        <button @click="emit('create-new')" class="text-primary-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
          create a new one.
        </button>
      </p>
    </div>

    <!-- Encryption Setup Modal -->
    <EncryptionSetupModal
      v-model="showSetupModal"
      :loading="encryptionLoading"
      @submit="handleSetupSubmit"
      @close="handleCloseSetupModal"
    />

    <!-- Encryption Unlock Modal -->
    <EncryptionUnlockModal
      v-model="showUnlockModal"
      :loading="encryptionLoading"
      :error="unlockError"
      @submit="handleUnlockSubmit"
      @close="handleCloseUnlockModal"
    />
  </main>
</template>

<script setup lang="ts">
import type { Note } from '~/types';
import { computed, watch, ref, onBeforeUnmount, nextTick } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { useEncryption } from '~/composables/useEncryption';

// --- Props ---
const props = defineProps<{
  modelValue: Note | null;
  loading: boolean;
  isSaveDisabled: boolean;
  isTitleTooLong: boolean;
  CONTENT_MAX_LENGTH: number;
  TITLE_MAX_LENGTH: number;
}>();

// --- Emits ---
const emit = defineEmits<{
  (e: 'update:modelValue', value: Note | null): void;
  (e: 'save'): void;
  (e: 'delete'): void;
  (e: 'close'): void;
  (e: 'create-new'): void;
  (e: 'update:content', value: string): void; // New emit for content updates
  (e: 'encrypt-note', noteId: string | null): void;
  (e: 'decrypt-note', noteId: string | null): void;
}>();

// --- Encryption State ---
const encryption = useEncryption();
const {
  hasEncryptionSetup,
  isEncryptionUnlocked,
  isEncryptionLocked,
  canEncryptNotes,
  lockEncryption,
  setupEncryption,
  unlockEncryption
} = encryption;

// --- Local State ---
const showSetupModal = ref(false);
const showUnlockModal = ref(false);
const encryptionLoading = ref(false);
const unlockError = ref<string | undefined>();

// --- Computed Properties ---
const note = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const showEncryptionControls = computed(() => !!note.value);
const isNoteEncrypted = computed(() => note.value?.is_encrypted || false);

const editor = useEditor({
  extensions: [
    StarterKit,
    CharacterCount.configure({
      limit: props.CONTENT_MAX_LENGTH,
      mode: 'nodeSize',
    }),
  ],
  content: note.value?.content,
  onUpdate: ({ editor }) => {
    emit('update:content', editor.getHTML()); // Emit content changes
  },
  editorProps: {
    attributes: {
      class: 'prose dark:prose-invert max-w-none',
    },
  },
});

// --- Encryption Handlers ---
const handleEncryptionToggle = async () => {
  if (!note.value || isNoteEncrypted.value) return;

  if (!hasEncryptionSetup.value) {
    showSetupModal.value = true;
    return;
  }

  if (!isEncryptionUnlocked.value) {
    showUnlockModal.value = true;
    return;
  }

  // Emit to parent to handle the actual encryption
  emit('encrypt-note', note.value.id);
};

const handleDecryptionToggle = async () => {
  if (!note.value || !isNoteEncrypted.value) return;

  if (!isEncryptionUnlocked.value) {
    showUnlockModal.value = true;
    return;
  }

  // Emit to parent to handle the actual decryption
  emit('decrypt-note', note.value.id);
};

const handleSetupSubmit = async (passphrase: string) => {
  encryptionLoading.value = true;
  try {
    const success = await setupEncryption(passphrase);
    if (success) {
      showSetupModal.value = false;
      // After setup, automatically encrypt the current note if it's not already encrypted
      if (note.value && !isNoteEncrypted.value) {
        await nextTick();
        handleEncryptionToggle();
      }
    }
  } finally {
    encryptionLoading.value = false;
  }
};

const handleUnlockSubmit = async (passphrase: string) => {
  encryptionLoading.value = true;
  unlockError.value = undefined;
  
  try {
    const success = await unlockEncryption(passphrase);
    if (success) {
      showUnlockModal.value = false;
    } else {
      unlockError.value = 'Invalid passphrase. Please try again.';
    }
  } finally {
    encryptionLoading.value = false;
  }
};

const handleCloseSetupModal = () => {
  showSetupModal.value = false;
};

const handleCloseUnlockModal = () => {
  showUnlockModal.value = false;
  unlockError.value = undefined;
};

// Watch for changes to the modelValue (from parent component) and update the editor
watch(() => props.modelValue?.content, (newContent) => {
  if (editor.value && newContent !== editor.value.getHTML()) {
    editor.value.commands.setContent(newContent || '', { emitUpdate: false });
  }
}, { immediate: true });

// When the editor is destroyed, emit an update to clear the modelValue
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
    emit('update:modelValue', null);
  }
});
</script>

<style>
.tiptap-editor {
  border: 1px solid #ccc;
  border-radius: 5px;
}

.tiptap-toolbar {
  display: flex;
  flex-wrap: wrap;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
  gap: 0.5rem; /* Add gap for spacing */
}

.tiptap-toolbar button {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
}

.tiptap-toolbar button.is-active {
  background-color: #333;
  color: #fff;
}

.ProseMirror {
  padding: 0.5rem;
  min-height: 200px;
}

.ProseMirror:focus {
  outline: none;
}

.ProseMirror h1 {
  font-size: 2em;
  font-weight: bold;
}

.ProseMirror h2 {
  font-size: 1.5em;
  font-weight: bold;
}

.ProseMirror h3 {
  font-size: 1.17em;
  font-weight: bold;
}

.ProseMirror ul {
  list-style-type: disc;
  padding-left: 2rem;
}

.ProseMirror ol {
  list-style-type: decimal;
  padding-left: 2rem;
}
</style>