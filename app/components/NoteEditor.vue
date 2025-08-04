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

        <!-- Content Editor -->
        <UFormField label="Content" name="content">
          <div v-if="editor" class="tiptap-editor form-input dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <div class="tiptap-toolbar">
              <UButton @click="editor.chain().focus().toggleBold().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('bold') }" icon="i-heroicons-bold" size="xs" />
              <UButton @click="editor.chain().focus().toggleItalic().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('italic') }" icon="i-heroicons-italic" size="xs" />
              <UButton @click="editor.chain().focus().toggleStrike().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('strike') }" icon="i-heroicons-strikethrough" size="xs" />
              <UButton @click="editor.chain().focus().toggleCode().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('code') }" icon="i-heroicons-code-bracket" size="xs" />
              <UButton @click="editor.chain().focus().setParagraph().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('paragraph') }" label="P" size="xs" />
              <UButton @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" label="H1" size="xs" />
              <UButton @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" label="H2" size="xs" />
              <UButton @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" label="H3" size="xs" />
              <UButton @click="editor.chain().focus().toggleBulletList().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('bulletList') }" icon="i-heroicons-list-bullet" size="xs" />
              <UButton @click="editor.chain().focus().toggleOrderedList().run()" @mousedown.prevent :class="{ 'is-active': editor.isActive('orderedList') }" icon="i-heroicons-bars-3" size="xs" />
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
            icon="i-heroicons-x-circle"
          />
          <UButton
            type="button"
            label="Delete"
            color="error"
            variant="soft"
            @click="emit('delete')"
            :disabled="!note.id || loading"
            :loading="loading"
            icon="i-heroicons-trash"
          />
          <UButton
            type="submit"
            label="Save"
            :disabled="isSaveDisabled"
            :loading="loading"
            icon="i-heroicons-check-circle"
          />
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
  </main>
</template>

<script setup lang="ts">
import type { Note } from '~/types';
import { computed, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';

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
}>();

const note = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

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

const isContentTooLong = computed(() => {
  return (note.value?.content?.length ?? 0) >= props.CONTENT_MAX_LENGTH;
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