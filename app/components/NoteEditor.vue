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

        <!-- Content Textarea -->
        <UFormField label="Content" name="content">
          <UTextarea
            v-model="note.content"
            :rows="10"
            :disabled="loading"
            :maxlength="CONTENT_MAX_LENGTH"
            placeholder="Start writing your note..."
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-primary-500"
          />
          <span class="text-xs text-gray-400 mt-1 block">{{ note.content?.length || 0 }} / {{ CONTENT_MAX_LENGTH }}</span>
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
import { computed } from 'vue';

// --- Props ---
const props = defineProps<{
  modelValue: Note | null;
  loading: boolean;
  isSaveDisabled: boolean;
  isTitleTooLong: boolean;
  isContentTooLong: boolean;
  TITLE_MAX_LENGTH: number;
  CONTENT_MAX_LENGTH: number;
}>();

// --- Emits ---
const emit = defineEmits<{
  (e: 'update:modelValue', value: Note | null): void;
  (e: 'save'): void;
  (e: 'delete'): void;
  (e: 'close'): void;
  (e: 'create-new'): void;
}>();

const note = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
</script>
